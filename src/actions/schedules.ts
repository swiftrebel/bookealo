"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/auth";
import { DAY_NAMES_FULL, timeToMinutes } from "@/lib/dates";
import { translateError } from "@/lib/errors";
import { getOwnerBusinessAndServices } from "@/lib/owner";
import { createClient } from "@/lib/supabase/server";

export type ScheduleDayInput = {
  day_of_week: number; // 0 = domingo ... 6 = sábado
  open_time: string; // HH:MM
  close_time: string; // HH:MM
  is_closed: boolean;
};

export type SaveSchedulesResult =
  | { ok: true }
  | { ok: false; error: string };

const TIME_HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function toPgTime(timeStr: string): string {
  const trimmed = timeStr.trim();
  if (TIME_HHMM_REGEX.test(trimmed)) {
    return `${trimmed}:00`;
  }
  return "08:00:00";
}

export async function saveServiceSchedulesAction(
  serviceId: string,
  days: ScheduleDayInput[],
): Promise<SaveSchedulesResult> {
  const { user, profile } = await getAuthContext();
  if (!user || !profile || profile.role !== "business_owner") {
    return { ok: false, error: "No tienes permisos para editar horarios." };
  }

  const { business, services, error: ownerError } =
    await getOwnerBusinessAndServices(user.id);
  if (ownerError || !business) {
    return {
      ok: false,
      error: "No encontramos un negocio asignado a tu cuenta.",
    };
  }

  if (!services.some((s) => s.id === serviceId)) {
    return { ok: false, error: "Este servicio no pertenece a tu negocio." };
  }

  if (days.length !== 7) {
    return {
      ok: false,
      error: "Debes configurar los 7 días de la semana.",
    };
  }

  const seenDays = new Set<number>();
  for (const day of days) {
    if (
      !Number.isInteger(day.day_of_week) ||
      day.day_of_week < 0 ||
      day.day_of_week > 6 ||
      seenDays.has(day.day_of_week)
    ) {
      return { ok: false, error: "Los días de la semana no son válidos." };
    }
    seenDays.add(day.day_of_week);

    if (!day.is_closed) {
      if (
        !TIME_HHMM_REGEX.test(day.open_time) ||
        !TIME_HHMM_REGEX.test(day.close_time)
      ) {
        return {
          ok: false,
          error: `Ingresa horas válidas para ${DAY_NAMES_FULL[day.day_of_week]}.`,
        };
      }
      if (timeToMinutes(day.close_time) <= timeToMinutes(day.open_time)) {
        return {
          ok: false,
          error: `En ${DAY_NAMES_FULL[day.day_of_week]}, la hora de cierre debe ser posterior a la hora de apertura.`,
        };
      }
    }
  }

  const supabase = await createClient();

  const { data: existingRows, error: fetchError } = await supabase
    .from("schedules")
    .select("id, day_of_week")
    .eq("service_id", serviceId);

  if (fetchError) {
    return {
      ok: false,
      error: translateError(fetchError, "No pudimos leer los horarios actuales."),
    };
  }

  const existingByDay = new Map<number, string>();
  (existingRows ?? []).forEach((row) => {
    existingByDay.set(row.day_of_week, row.id);
  });

  const toInsert: {
    service_id: string;
    day_of_week: number;
    open_time: string;
    close_time: string;
    is_closed: boolean;
  }[] = [];

  for (const day of days) {
    const openTime = day.is_closed
      ? TIME_HHMM_REGEX.test(day.open_time)
        ? toPgTime(day.open_time)
        : "08:00:00"
      : toPgTime(day.open_time);
    const closeTime = day.is_closed
      ? TIME_HHMM_REGEX.test(day.close_time)
        ? toPgTime(day.close_time)
        : "22:00:00"
      : toPgTime(day.close_time);

    const existingId = existingByDay.get(day.day_of_week);
    if (existingId) {
      const { error: updateError } = await supabase
        .from("schedules")
        .update({
          open_time: openTime,
          close_time: closeTime,
          is_closed: day.is_closed,
        })
        .eq("id", existingId)
        .eq("service_id", serviceId);

      if (updateError) {
        return {
          ok: false,
          error: translateError(
            updateError,
            `No pudimos actualizar el horario de ${DAY_NAMES_FULL[day.day_of_week]}.`,
          ),
        };
      }
    } else {
      toInsert.push({
        service_id: serviceId,
        day_of_week: day.day_of_week,
        open_time: openTime,
        close_time: closeTime,
        is_closed: day.is_closed,
      });
    }
  }

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("schedules")
      .insert(toInsert);

    if (insertError) {
      return {
        ok: false,
        error: translateError(insertError, "No pudimos guardar los horarios."),
      };
    }
  }

  revalidatePath("/panel/horarios");
  revalidatePath("/panel");
  revalidatePath(`/negocios/${business.id}`);
  return { ok: true };
}
