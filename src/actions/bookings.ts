"use server";

import { revalidatePath } from "next/cache";
import {
  fetchAvailableSlotsForDate,
  isValidDateString,
  isWithinBookingWindow,
} from "@/lib/availability";
import { getAuthContext } from "@/lib/auth";
import { translateError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export type CreateBookingResult =
  | {
      ok: true;
      booking: {
        id: string;
        start_time: string;
        end_time: string;
        total_price: number | null;
        status: string;
      };
    }
  | {
      ok: false;
      error: string;
      code?: "UNAUTHENTICATED" | "FORBIDDEN" | "SLOT_TAKEN" | "VALIDATION";
    };

export async function createCustomerBookingAction(input: {
  serviceId: string;
  dateStr: string;
  startTime: string;
}): Promise<CreateBookingResult> {
  const { user, profile } = await getAuthContext();

  if (!user || !profile) {
    return {
      ok: false,
      error: "Debes iniciar sesión para realizar una reserva.",
      code: "UNAUTHENTICATED",
    };
  }

  if (profile.role !== "customer") {
    return {
      ok: false,
      error: "Necesitas una cuenta de cliente para reservar.",
      code: "FORBIDDEN",
    };
  }

  const serviceId = input.serviceId.trim();
  const dateStr = input.dateStr.trim();
  const startTime = input.startTime.trim();

  if (!serviceId || !isValidDateString(dateStr) || !/^\d{2}:\d{2}$/.test(startTime)) {
    return {
      ok: false,
      error: "Los datos de la reserva no son válidos.",
      code: "VALIDATION",
    };
  }

  if (!isWithinBookingWindow(dateStr, 14)) {
    return {
      ok: false,
      error: "Solo puedes reservar con hasta 14 días de anticipación.",
      code: "VALIDATION",
    };
  }

  const supabase = await createClient();

  // Validación en servidor del horario de apertura y disponibilidad (la BD no valida schedules)
  const availability = await fetchAvailableSlotsForDate(
    supabase,
    serviceId,
    dateStr,
  );

  if (availability.error) {
    return {
      ok: false,
      error: availability.error,
      code: "VALIDATION",
    };
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
      error: "Ese horario ya está ocupado. Por favor elige otra franja disponible.",
      code: "SLOT_TAKEN",
    };
  }

  // Por reglas de la BD: NO enviar total_price; sí enviar end_time = start_time + duración
  const { data: booking, error: insertError } = await supabase
    .from("bookings")
    .insert({
      service_id: serviceId,
      customer_id: user.id,
      start_time: matchedSlot.startIso,
      end_time: matchedSlot.endIso,
      status: "pending",
    })
    .select("id, start_time, end_time, total_price, status")
    .single();

  if (insertError || !booking) {
    const rawMsg = insertError?.message ?? "";
    const isSlotTaken = rawMsg.includes("Ese horario ya está ocupado");
    return {
      ok: false,
      error: translateError(
        insertError,
        "No pudimos completar tu reserva. Intenta nuevamente.",
      ),
      code: isSlotTaken ? "SLOT_TAKEN" : "VALIDATION",
    };
  }

  revalidatePath("/mis-reservas");
  return {
    ok: true,
    booking,
  };
}

export type CancelBookingResult =
  | { ok: true }
  | { ok: false; error: string };

export async function cancelCustomerBookingAction(
  bookingId: string,
): Promise<CancelBookingResult> {
  const { user, profile } = await getAuthContext();

  if (!user || !profile || profile.role !== "customer") {
    return {
      ok: false,
      error: "No tienes permisos para cancelar esta reserva.",
    };
  }

  const trimmedId = bookingId.trim();
  if (!trimmedId) {
    return { ok: false, error: "Reserva no válida." };
  }

  const supabase = await createClient();

  // Verificar que la reserva exista, pertenezca al usuario y permita transición a cancelled
  const { data: existing, error: fetchError } = await supabase
    .from("bookings")
    .select("id, status, customer_id")
    .eq("id", trimmedId)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, error: translateError(fetchError) };
  }

  if (!existing) {
    return { ok: false, error: "No encontramos esa reserva en tu cuenta." };
  }

  if (existing.status === "cancelled") {
    return { ok: false, error: "Esta reserva ya se encuentra cancelada." };
  }

  if (existing.status !== "pending" && existing.status !== "confirmed") {
    return { ok: false, error: "Esta reserva no se puede cancelar." };
  }

  // Por reglas de BD/RLS: actualizar ÚNICAMENTE la columna status
  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", trimmedId)
    .eq("customer_id", user.id);

  if (updateError) {
    return {
      ok: false,
      error: translateError(
        updateError,
        "No pudimos cancelar la reserva. Intenta nuevamente.",
      ),
    };
  }

  revalidatePath("/mis-reservas");
  return { ok: true };
}
