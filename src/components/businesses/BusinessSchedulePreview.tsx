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
      <p className="mt-5 text-[13px] text-[#86868b]">
        Horario aún no configurado por el negocio.
      </p>
    );
  }

  const byDay = new Map<number, ScheduleRow>();
  schedules.forEach((s) => byDay.set(s.day_of_week, s));

  return (
    <div className="mt-6">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[rgba(245,245,247,0.44)]">
        Horarios habituales
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {DISPLAY_ORDER.map((dayIndex) => {
          const row = byDay.get(dayIndex);
          const closed = !row || row.is_closed;
          return (
            <div
              key={dayIndex}
              className={`rounded-[12px] border px-3 py-2 text-[12px] ${
                closed
                  ? "border-white/[0.05] bg-[#111113]/60 text-[#86868b]/60"
                  : "border-white/[0.08] bg-[#161618] text-[#f5f5f7]/85"
              }`}
            >
              <span className="font-medium capitalize text-[#f5f5f7]">
                {DAY_NAMES_SHORT[dayIndex]}
              </span>
              <span className="mt-0.5 block text-[11px] text-[#86868b] tabular-nums">
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
