import type { SupabaseClient } from "@supabase/supabase-js";
import {
  addDaysToDateString,
  buildPanamaISO,
  getPanamaDayOfWeek,
  getTodayPanamaDateString,
  minutesToTime,
  timeToMinutes,
} from "@/lib/dates";
import { translateError } from "@/lib/errors";
import type { BusySlotRow, Database, ScheduleRow } from "@/types/database";

export type AvailableSlot = {
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  startIso: string; // ISO con -05:00
  endIso: string; // ISO con -05:00
};

export type AvailabilityResult = {
  dateStr: string;
  dayOfWeek: number;
  isClosed: boolean;
  hasSchedule: boolean;
  slots: AvailableSlot[];
  error?: string;
};

const DATE_YMD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateString(dateStr: string): boolean {
  if (!DATE_YMD_REGEX.test(dateStr)) return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  const check = new Date(Date.UTC(y, m - 1, d));
  return (
    check.getUTCFullYear() === y &&
    check.getUTCMonth() === m - 1 &&
    check.getUTCDate() === d
  );
}

/**
 * Valida que una fecha esté dentro de los próximos `maxDays` días (0 .. maxDays-1) en America/Panama.
 */
export function isWithinBookingWindow(
  dateStr: string,
  maxDays = 14,
  now: Date = new Date(),
): boolean {
  if (!isValidDateString(dateStr)) return false;
  const today = getTodayPanamaDateString(now);
  const lastAllowed = addDaysToDateString(today, maxDays - 1);
  return dateStr >= today && dateStr <= lastAllowed;
}

/**
 * Función pura que calcula las franjas libres para un día en America/Panama:
 * 1. Revisa el horario del día en `schedules` (0=domingo .. 6=sábado).
 * 2. Genera franjas desde `open_time` avanzando `slotDurationMinutes` mientras `fin <= close_time`.
 * 3. Descarta franjas que ya pasaron (comparando epoch real vs `now`).
 * 4. Descarta franjas que se solapen con `busySlots` (franja.inicio < ocupada.fin && franja.fin > ocupada.inicio).
 */
export function computeAvailableSlots({
  dateStr,
  slotDurationMinutes,
  schedule,
  busySlots,
  now = new Date(),
}: {
  dateStr: string;
  slotDurationMinutes: number;
  schedule: ScheduleRow | null;
  busySlots: BusySlotRow[];
  now?: Date;
}): AvailabilityResult {
  const dayOfWeek = getPanamaDayOfWeek(dateStr);

  if (!schedule) {
    return {
      dateStr,
      dayOfWeek,
      isClosed: true,
      hasSchedule: false,
      slots: [],
    };
  }

  if (schedule.is_closed || slotDurationMinutes <= 0) {
    return {
      dateStr,
      dayOfWeek,
      isClosed: true,
      hasSchedule: true,
      slots: [],
    };
  }

  const openMin = timeToMinutes(schedule.open_time);
  const closeMin = timeToMinutes(schedule.close_time);

  if (closeMin <= openMin) {
    return {
      dateStr,
      dayOfWeek,
      isClosed: true,
      hasSchedule: true,
      slots: [],
    };
  }

  const nowMs = now.getTime();
  const parsedBusy = busySlots
    .map((b) => ({
      startMs: Date.parse(b.slot_start),
      endMs: Date.parse(b.slot_end),
    }))
    .filter((b) => !Number.isNaN(b.startMs) && !Number.isNaN(b.endMs));

  const slots: AvailableSlot[] = [];

  for (
    let cursorMin = openMin;
    cursorMin + slotDurationMinutes <= closeMin;
    cursorMin += slotDurationMinutes
  ) {
    const startTime = minutesToTime(cursorMin);
    const endTime = minutesToTime(cursorMin + slotDurationMinutes);
    const startIso = buildPanamaISO(dateStr, startTime);
    const endIso = buildPanamaISO(dateStr, endTime);

    const startMs = Date.parse(startIso);
    const endMs = Date.parse(endIso);

    // Descartar franjas que ya pasaron (hoy o fechas pasadas)
    if (startMs <= nowMs) {
      continue;
    }

    // Descartar franjas solapadas con alguna reserva pendiente/confirmada/bloqueada
    const overlaps = parsedBusy.some(
      (busy) => startMs < busy.endMs && endMs > busy.startMs,
    );

    if (!overlaps) {
      slots.push({
        startTime,
        endTime,
        startIso,
        endIso,
      });
    }
  }

  return {
    dateStr,
    dayOfWeek,
    isClosed: false,
    hasSchedule: true,
    slots,
  };
}

/**
 * Consulta en Supabase el horario del servicio y las horas ocupadas (vía RPC get_busy_slots)
 * para devolver únicamente las franjas libres en America/Panama.
 */
export async function fetchAvailableSlotsForDate(
  supabase: SupabaseClient<Database>,
  serviceId: string,
  dateStr: string,
  options?: { allowInactiveService?: boolean; now?: Date },
): Promise<AvailabilityResult> {
  const now = options?.now ?? new Date();
  const dayOfWeek = getPanamaDayOfWeek(dateStr);

  if (!isValidDateString(dateStr)) {
    return {
      dateStr,
      dayOfWeek,
      isClosed: true,
      hasSchedule: false,
      slots: [],
      error: "La fecha seleccionada no es válida.",
    };
  }

  let serviceQuery = supabase
    .from("services")
    .select("id, slot_duration_minutes, is_active")
    .eq("id", serviceId);

  if (!options?.allowInactiveService) {
    serviceQuery = serviceQuery.eq("is_active", true);
  }

  const { data: service, error: serviceError } = await serviceQuery.maybeSingle();

  if (serviceError) {
    return {
      dateStr,
      dayOfWeek,
      isClosed: true,
      hasSchedule: false,
      slots: [],
      error: translateError(serviceError, "No pudimos consultar este servicio."),
    };
  }

  if (!service) {
    return {
      dateStr,
      dayOfWeek,
      isClosed: true,
      hasSchedule: false,
      slots: [],
      error: "Este servicio no está disponible.",
    };
  }

  const { data: schedule, error: scheduleError } = await supabase
    .from("schedules")
    .select("id, service_id, day_of_week, open_time, close_time, is_closed")
    .eq("service_id", serviceId)
    .eq("day_of_week", dayOfWeek)
    .maybeSingle();

  if (scheduleError) {
    return {
      dateStr,
      dayOfWeek,
      isClosed: true,
      hasSchedule: false,
      slots: [],
      error: translateError(scheduleError, "No pudimos leer el horario del servicio."),
    };
  }

  if (!schedule || schedule.is_closed) {
    return {
      dateStr,
      dayOfWeek,
      isClosed: true,
      hasSchedule: Boolean(schedule),
      slots: [],
    };
  }

  const rangeFrom = buildPanamaISO(dateStr, "00:00:00");
  const rangeTo = buildPanamaISO(addDaysToDateString(dateStr, 1), "00:00:00");

  const { data: busySlots, error: busyError } = await supabase.rpc(
    "get_busy_slots",
    {
      p_service_id: serviceId,
      p_from: rangeFrom,
      p_to: rangeTo,
    },
  );

  if (busyError) {
    return {
      dateStr,
      dayOfWeek,
      isClosed: false,
      hasSchedule: true,
      slots: [],
      error: translateError(
        busyError,
        "No pudimos verificar la disponibilidad de horarios. Intenta nuevamente.",
      ),
    };
  }

  return computeAvailableSlots({
    dateStr,
    slotDurationMinutes: service.slot_duration_minutes,
    schedule,
    busySlots: busySlots ?? [],
    now,
  });
}
