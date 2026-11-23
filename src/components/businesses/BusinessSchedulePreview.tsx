import { DAY_NAMES_SHORT, formatTime24 } from "@/lib/dates";
import type { ScheduleRow } from "@/types/database";

type BusinessSchedulePreviewProps = {
  schedules: ScheduleRow[];
};

const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export function BusinessSchedulePreview({
  schedules,
}: BusinessSchedulePreviewProps) {
  if (schedules.length === 0) {
    return (
      <p className="text-xs text-[#a99ec4]">
        Horario aún no configurado por el negocio.
      </p>
    );
  }

  const byDay = new Map<number, ScheduleRow>();
  schedules.forEach((s) => byDay.set(s.day_of_week, s));

  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#a99ec4]">
        Horarios habituales
      </p>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {DISPLAY_ORDER.map((dayIndex) => {
          const row = byDay.get(dayIndex);
          const closed = !row || row.is_closed;
          return (
            <div
              key={dayIndex}
              className={`rounded-xl border px-2.5 py-1.5 text-xs ${
                closed
                  ? "border-white/5 bg-white/[0.03] text-[#a99ec4]/60"
                  : "border-white/10 bg-white/[0.05] text-white/90"
              }`}
            >
              <span className="font-bold capitalize">
                {DAY_NAMES_SHORT[dayIndex]}
              </span>
              <span className="mt-0.5 block text-[11px]">
                {closed
                  ? "Cerrado"
                  : `${formatTime24(row.open_time)} – ${formatTime24(row.close_time)}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
