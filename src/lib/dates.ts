export const PANAMA_TIMEZONE = "America/Panama";
export const PANAMA_OFFSET = "-05:00";

export const DAY_NAMES_FULL: readonly string[] = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export const DAY_NAMES_SHORT: readonly string[] = [
  "dom",
  "lun",
  "mar",
  "mié",
  "jue",
  "vie",
  "sáb",
];

/**
 * Devuelve la fecha actual en America/Panama en formato YYYY-MM-DD.
 */
export function getTodayPanamaDateString(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PANAMA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = parts.find((p) => p.type === "year")?.value ?? "2026";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

/**
 * Suma `offsetDays` días a una fecha YYYY-MM-DD (sin depender de la zona horaria local).
 */
export function addDaysToDateString(dateStr: string, offsetDays: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + offsetDays));
  const year = utc.getUTCFullYear();
  const month = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const day = String(utc.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene los próximos N días a partir de hoy en America/Panama.
 */
export function getNextPanamaDays(count: number, now: Date = new Date()) {
  const today = getTodayPanamaDateString(now);
  return Array.from({ length: count }, (_, index) => {
    const dateStr = addDaysToDateString(today, index);
    const dayOfWeek = getPanamaDayOfWeek(dateStr);
    const dayNumber = Number(dateStr.slice(8, 10));
    return {
      dateStr,
      dayOfWeek,
      weekdayShort: DAY_NAMES_SHORT[dayOfWeek],
      weekdayFull: DAY_NAMES_FULL[dayOfWeek],
      dayNumber,
      isToday: index === 0,
    };
  });
}

/**
 * Convención de la BD: 0 = domingo, 1 = lunes, ..., 6 = sábado.
 */
export function getPanamaDayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * Construye un timestamp ISO con offset explícito de Panamá (-05:00).
 * Acepta tiempo en formato "HH:MM" o "HH:MM:SS".
 */
export function buildPanamaISO(dateStr: string, timeStr: string): string {
  const normalizedTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr.slice(0, 8);
  return `${dateStr}T${normalizedTime}${PANAMA_OFFSET}`;
}

/**
 * Convierte "HH:MM" o "HH:MM:SS" a minutos desde medianoche.
 */
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Convierte minutos desde medianoche a "HH:MM".
 */
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/**
 * Formatea una hora "HH:MM" o "HH:MM:SS" a formato legible de Panamá (ej. "8:00 a. m." o "18:00").
 */
export function formatTime24(timeStr: string): string {
  return timeStr.slice(0, 5);
}

export function formatPanamaDate(isoOrDate: string | Date): string {
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return new Intl.DateTimeFormat("es-PA", {
    timeZone: PANAMA_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatPanamaDateLong(isoOrDate: string | Date): string {
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return new Intl.DateTimeFormat("es-PA", {
    timeZone: PANAMA_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatPanamaDateFromYMD(dateStr: string): string {
  return formatPanamaDate(buildPanamaISO(dateStr, "12:00:00"));
}

export function formatPanamaTime(isoOrDate: string | Date): string {
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return new Intl.DateTimeFormat("es-PA", {
    timeZone: PANAMA_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatPanamaTimeRange(startIso: string, endIso: string): string {
  return `${formatPanamaTime(startIso)} – ${formatPanamaTime(endIso)}`;
}
