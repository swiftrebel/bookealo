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
import { Card } from "@/components/ui/Card";
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-white">{service.name}</h2>
            <Badge tone={service.is_active ? "confirmed" : "cancelled"}>
              {service.is_active ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-[#a99ec4]">
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
          className={`rounded-[14px] border px-4 py-3 text-sm font-medium ${
            feedback.type === "error"
              ? "border-[#ff3b6b]/40 bg-[#ff3b6b]/15 text-[#ff7a9b]"
              : "border-emerald-400/35 bg-emerald-500/15 text-emerald-200"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="space-y-2.5">
        {days.map((day) => {
          const dayName = DAY_NAMES_FULL[day.day_of_week];
          return (
            <Card
              key={day.day_of_week}
              className={`p-4 transition ${day.is_closed ? "opacity-75" : ""}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center justify-between gap-3 sm:w-44">
                  <span className="font-bold text-white">{dayName}</span>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#a99ec4]">
                    <input
                      type="checkbox"
                      checked={day.is_closed}
                      onChange={(e) =>
                        updateDay(day.day_of_week, {
                          is_closed: e.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-[#ff3b6b]"
                    />
                    Cerrado
                  </label>
                </div>

                {day.is_closed ? (
                  <p className="text-sm text-[#a99ec4]">
                    Sin atención este día
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-xs font-semibold text-[#a99ec4]">
                      <span>Abre</span>
                      <input
                        type="time"
                        value={day.open_time}
                        onChange={(e) =>
                          updateDay(day.day_of_week, {
                            open_time: e.target.value,
                          })
                        }
                        className="h-10 rounded-xl border border-white/10 bg-[rgba(26,15,44,0.8)] px-3 text-sm font-semibold text-white outline-none focus:border-[#ff3b6b]"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-[#a99ec4]">
                      <span>Cierra</span>
                      <input
                        type="time"
                        value={day.close_time}
                        onChange={(e) =>
                          updateDay(day.day_of_week, {
                            close_time: e.target.value,
                          })
                        }
                        className="h-10 rounded-xl border border-white/10 bg-[rgba(26,15,44,0.8)] px-3 text-sm font-semibold text-white outline-none focus:border-[#ff3b6b]"
                      />
                    </label>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end pt-2">
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
        icon="🕒"
        title="Crea un servicio primero"
        description="Necesitas al menos un servicio registrado para configurar sus horarios semanales."
        action={
          <Link
            href="/panel/servicios"
            className="bk-grad-shadow inline-flex h-11 items-center justify-center rounded-[14px] px-5 text-sm font-bold text-white"
          >
            Ir a Servicios
          </Link>
        }
      />
    );
  }

  const activeService =
    services.find((s) => s.id === selectedServiceId) ?? services[0];

  return (
    <div className="space-y-6">
      {/* Selector de servicio */}
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 min-[900px]:mx-0 min-[900px]:px-0">
        {services.map((service) => {
          const active = service.id === activeService.id;
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => setSelectedServiceId(service.id)}
              className={`shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "bk-grad border-transparent text-white shadow-[0_6px_18px_rgba(255,45,149,0.28)]"
                  : "border-white/10 bg-white/[0.07] text-[#d9d0ee] hover:bg-white/[0.12]"
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
