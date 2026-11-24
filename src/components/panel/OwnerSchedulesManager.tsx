"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  saveServiceSchedulesAction,
  type ScheduleDayInput,
} from "@/actions/schedules";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ClockIcon } from "@/components/ui/Icons";
import { EmptyState } from "@/components/ui/States";
import { DAY_NAMES_FULL, formatTime24 } from "@/lib/dates";
import type { ScheduleRow, ServiceRow } from "@/types/database";

type OwnerSchedulesManagerProps = {
  services: ServiceRow[];
  schedulesByService: Record<string, ScheduleRow[]>;
  initialServiceId?: string | null;
};

// Orden de visualización habitual en Panamá (Lunes..Sábado..Domingo)
// usando convención de BD: 0 = domingo ... 6 = sábado
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

function buildInitialWeek(rows: ScheduleRow[]): ScheduleDayInput[] {
  const byDay = new Map<number, ScheduleRow>();
  rows.forEach((row) => byDay.set(row.day_of_week, row));

  return DISPLAY_ORDER.map((dayIndex) => {
    const existing = byDay.get(dayIndex);
    if (existing) {
      return {
        day_of_week: dayIndex,
        open_time: formatTime24(existing.open_time),
        close_time: formatTime24(existing.close_time),
        is_closed: existing.is_closed,
      };
    }
    return {
      day_of_week: dayIndex,
      open_time: "08:00",
      close_time: "22:00",
      is_closed: true,
    };
  });
}

function ServiceScheduleEditor({
  service,
  initialRows,
}: {
  service: ServiceRow;
  initialRows: ScheduleRow[];
}) {
  const router = useRouter();
  const [days, setDays] = useState<ScheduleDayInput[]>(() =>
    buildInitialWeek(initialRows),
  );
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  const updateDay = (
    dayOfWeek: number,
    patch: Partial<Omit<ScheduleDayInput, "day_of_week">>,
  ) => {
    setDays((prev) =>
      prev.map((d) => (d.day_of_week === dayOfWeek ? { ...d, ...patch } : d)),
    );
    setFeedback(null);
  };

  const applyMondayToAll = () => {
    const monday = days.find((d) => d.day_of_week === 1);
    if (!monday) return;
    setDays((prev) =>
      prev.map((d) => ({
        ...d,
        open_time: monday.open_time,
        close_time: monday.close_time,
        is_closed: monday.is_closed,
      })),
    );
    setFeedback(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);

    const result = await saveServiceSchedulesAction(service.id, days);
    setSaving(false);

    if (!result.ok) {
      setFeedback({ type: "error", message: result.error });
      return;
    }

    setFeedback({
      type: "success",
      message: `Horarios de “${service.name}” guardados correctamente.`,
    });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[#f5f5f7]">
              {service.name}
            </h2>
            <Badge tone={service.is_active ? "confirmed" : "cancelled"}>
              {service.is_active ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <p className="mt-1 text-[13px] text-[#86868b]">
            Franjas cada {service.slot_duration_minutes} minutos · Hora de
            Panamá (UTC-5)
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={applyMondayToAll}
          disabled={saving}
        >
          Copiar lunes a toda la semana
        </Button>
      </div>

      {feedback && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={`rounded-[14px] border px-4 py-3 text-[14px] font-medium ${
            feedback.type === "error"
              ? "border-[#ff6961]/30 bg-[rgba(255,69,58,0.14)] text-[#ff6961]"
              : "border-[#34c470]/30 bg-[rgba(29,127,69,0.2)] text-[#34c470]"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="border-t border-white/10">
        {days.map((day) => {
          const dayName = DAY_NAMES_FULL[day.day_of_week];
          return (
            <div
              key={day.day_of_week}
              className={`border-b border-white/10 py-4 transition ${
                day.is_closed ? "opacity-65" : ""
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center justify-between gap-4 sm:w-52">
                  <span className="text-[15px] font-medium text-[#f5f5f7]">
                    {dayName}
                  </span>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-[#86868b]">
                    <input
                      type="checkbox"
                      checked={day.is_closed}
                      onChange={(e) =>
                        updateDay(day.day_of_week, {
                          is_closed: e.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-[#1d7f45]"
                    />
                    Cerrado
                  </label>
                </div>

                {day.is_closed ? (
                  <p className="text-[14px] text-[#86868b]">
                    Sin atención este día
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2.5 text-[13px] text-[#86868b]">
                      <span>Abre</span>
                      <input
                        type="time"
                        value={day.open_time}
                        onChange={(e) =>
                          updateDay(day.day_of_week, {
                            open_time: e.target.value,
                          })
                        }
                        className="h-10 rounded-[12px] border border-white/[0.09] bg-[#1a1a1c] px-3 text-[14px] font-medium text-[#f5f5f7] tabular-nums outline-none transition focus:border-white/25 focus:bg-[#222225]"
                      />
                    </label>
                    <label className="flex items-center gap-2.5 text-[13px] text-[#86868b]">
                      <span>Cierra</span>
                      <input
                        type="time"
                        value={day.close_time}
                        onChange={(e) =>
                          updateDay(day.day_of_week, {
                            close_time: e.target.value,
                          })
                        }
                        className="h-10 rounded-[12px] border border-white/[0.09] bg-[#1a1a1c] px-3 text-[14px] font-medium text-[#f5f5f7] tabular-nums outline-none transition focus:border-white/25 focus:bg-[#222225]"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-3">
        <Button size="lg" loading={saving} onClick={handleSave}>
          {saving ? "Guardando..." : "Guardar horarios"}
        </Button>
      </div>
    </div>
  );
}

export function OwnerSchedulesManager({
  services,
  schedulesByService,
  initialServiceId,
}: OwnerSchedulesManagerProps) {
  const defaultId =
    initialServiceId && services.some((s) => s.id === initialServiceId)
      ? initialServiceId
      : (services[0]?.id ?? "");

  const [selectedServiceId, setSelectedServiceId] = useState<string>(defaultId);

  if (services.length === 0) {
    return (
      <EmptyState
        icon={<ClockIcon className="h-5 w-5" />}
        title="Crea un servicio primero"
        description="Necesitas al menos un servicio registrado para configurar sus horarios semanales."
        action={
          <Link href="/panel/servicios" className="bk-cta h-11 px-6 text-[14px]">
            Ir a Servicios
          </Link>
        }
      />
    );
  }

  const activeService =
    services.find((s) => s.id === selectedServiceId) ?? services[0];

  return (
    <div className="space-y-8">
      {/* Selector de servicio */}
      <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 min-[900px]:mx-0 min-[900px]:px-0">
        {services.map((service) => {
          const active = service.id === activeService.id;
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => setSelectedServiceId(service.id)}
              className={`bk-tx h-[36px] shrink-0 cursor-pointer rounded-full border px-4 text-[13px] font-medium ${
                active
                  ? "border-transparent bg-[#f5f5f7] text-black"
                  : "border-white/[0.09] bg-[#1a1a1c] text-[#86868b] hover:bg-[#222225] hover:text-[#f5f5f7]"
              }`}
            >
              {service.name}
            </button>
          );
        })}
      </div>

      <ServiceScheduleEditor
        key={activeService.id}
        service={activeService}
        initialRows={schedulesByService[activeService.id] ?? []}
      />
    </div>
  );
}
