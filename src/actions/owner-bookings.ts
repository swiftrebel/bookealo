"use server";

import { revalidatePath } from "next/cache";
import {
  fetchAvailableSlotsForDate,
  isValidDateString,
  isWithinBookingWindow,
} from "@/lib/availability";
import { getAuthContext } from "@/lib/auth";
import { translateError } from "@/lib/errors";
import { getOwnerBusinessAndServices } from "@/lib/owner";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type OwnerActionResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      code?: "SLOT_TAKEN" | "FORBIDDEN" | "VALIDATION";
    };

export async function updateOwnerBookingStatusAction(
  bookingId: string,
  targetStatus: "confirmed" | "cancelled",
): Promise<OwnerActionResult> {
  const { user, profile } = await getAuthContext();

  if (!user || !profile || profile.role !== "business_owner") {
    return {
      ok: false,
      error: "No tienes permisos para realizar esta acción.",
      code: "FORBIDDEN",
    };
  }

  const trimmedId = bookingId.trim();
  if (!trimmedId) {
    return { ok: false, error: "Reserva no válida.", code: "VALIDATION" };
  }

  const { business, services, error: ownerError } =
    await getOwnerBusinessAndServices(user.id);

  if (ownerError || !business) {
    return {
      ok: false,
      error: "No encontramos un negocio asignado a tu cuenta.",
      code: "FORBIDDEN",
    };
  }

  const ownedServiceIds = new Set(services.map((s) => s.id));
  const supabase = await createClient();

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, service_id, status")
    .eq("id", trimmedId)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, error: translateError(fetchError) };
  }

  if (!booking || !ownedServiceIds.has(booking.service_id)) {
    return {
      ok: false,
      error: "No encontramos esta reserva en tu negocio.",
      code: "FORBIDDEN",
    };
  }

  // Transiciones válidas:
  // pending -> confirmed | cancelled
  // confirmed -> cancelled
  // blocked -> cancelled
  // cancelled -> ninguna
  if (booking.status === "cancelled") {
    return {
      ok: false,
      error: "Una reserva cancelada no se puede modificar ni reabrir.",
      code: "VALIDATION",
    };
  }

  if (targetStatus === "confirmed" && booking.status !== "pending") {
    return {
      ok: false,
      error: "Solo puedes confirmar reservas que estén en estado pendiente.",
      code: "VALIDATION",
    };
  }

  // Por reglas de BD/RLS: actualizar ÚNICAMENTE la columna status
  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: targetStatus })
    .eq("id", trimmedId);

  if (updateError) {
    return {
      ok: false,
      error: translateError(
        updateError,
        "No pudimos actualizar el estado de la reserva.",
      ),
    };
  }

  revalidatePath("/panel");
  return { ok: true };
}

export async function createOwnerBookingAction(input: {
  serviceId: string;
  dateStr: string;
  startTime: string;
  mode: "manual" | "blocked";
  guestName?: string;
  guestPhone?: string;
}): Promise<OwnerActionResult> {
  const { user, profile } = await getAuthContext();

  if (!user || !profile || profile.role !== "business_owner") {
    return {
      ok: false,
      error: "No tienes permisos para realizar esta acción.",
      code: "FORBIDDEN",
    };
  }

  const { business, services, error: ownerError } =
    await getOwnerBusinessAndServices(user.id);

  if (ownerError || !business) {
    return {
      ok: false,
      error: "No tienes un negocio asignado.",
      code: "FORBIDDEN",
    };
  }

  const serviceId = input.serviceId.trim();
  const dateStr = input.dateStr.trim();
  const startTime = input.startTime.trim();

  const ownedService = services.find((s) => s.id === serviceId);
  if (!ownedService) {
    return {
      ok: false,
      error: "El servicio seleccionado no pertenece a tu negocio.",
      code: "FORBIDDEN",
    };
  }

  if (!ownedService.is_active) {
    return {
      ok: false,
      error: "Este servicio está desactivado. Actívalo primero para agendar.",
      code: "VALIDATION",
    };
  }

  if (!isValidDateString(dateStr) || !/^\d{2}:\d{2}$/.test(startTime)) {
    return {
      ok: false,
      error: "Selecciona una fecha y franja horaria válidas.",
      code: "VALIDATION",
    };
  }

  if (!isWithinBookingWindow(dateStr, 30)) {
    return {
      ok: false,
      error: "Solo puedes agendar dentro de los próximos 30 días.",
      code: "VALIDATION",
    };
  }

  const guestName = (input.guestName ?? "").trim();
  const guestPhone = (input.guestPhone ?? "").trim();

  if (input.mode === "manual") {
    if (guestName.length < 2) {
      return {
        ok: false,
        error: "Ingresa el nombre del cliente para la reserva manual.",
        code: "VALIDATION",
      };
    }
    if (guestPhone.length < 7) {
      return {
        ok: false,
        error: "Ingresa un número de teléfono válido para el cliente.",
        code: "VALIDATION",
      };
    }
  }

  const supabase = await createClient();

  const availability = await fetchAvailableSlotsForDate(
    supabase,
    serviceId,
    dateStr,
    { allowInactiveService: false },
  );

  if (availability.error) {
    return { ok: false, error: availability.error, code: "VALIDATION" };
  }

  if (availability.isClosed) {
    return {
      ok: false,
      error: "Este servicio está cerrado en la fecha seleccionada.",
      code: "VALIDATION",
    };
  }

  const matchedSlot = availability.slots.find(
    (slot) => slot.startTime === startTime,
  );

  if (!matchedSlot) {
    return {
      ok: false,
      error: "Ese horario ya está ocupado. Elige otra franja disponible.",
      code: "SLOT_TAKEN",
    };
  }

  const payload: Database["public"]["Tables"]["bookings"]["Insert"] =
    input.mode === "manual"
      ? {
          service_id: serviceId,
          customer_id: null,
          guest_name: guestName,
          guest_phone: guestPhone,
          start_time: matchedSlot.startIso,
          end_time: matchedSlot.endIso,
          status: "confirmed",
        }
      : {
          service_id: serviceId,
          customer_id: null,
          guest_name: null,
          guest_phone: null,
          start_time: matchedSlot.startIso,
          end_time: matchedSlot.endIso,
          status: "blocked",
        };

  const { error: insertError } = await supabase.from("bookings").insert(payload);

  if (insertError) {
    const rawMsg = insertError.message ?? "";
    const isSlotTaken = rawMsg.includes("Ese horario ya está ocupado");
    return {
      ok: false,
      error: translateError(
        insertError,
        input.mode === "manual"
          ? "No pudimos crear la reserva manual."
          : "No pudimos bloquear este horario.",
      ),
      code: isSlotTaken ? "SLOT_TAKEN" : "VALIDATION",
    };
  }

  revalidatePath("/panel");
  return { ok: true };
}
