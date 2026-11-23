"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createOwnerBookingAction } from "@/actions/owner-bookings";
import type { BookingDayOption } from "@/components/booking/BookingSheet";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import type { AvailabilityResult, AvailableSlot } from "@/lib/availability";
import { formatUSD } from "@/lib/currency";
import { buildPanamaISO, formatPanamaDateLong } from "@/lib/dates";
import type { ServiceRow } from "@/types/database";

type OwnerBookingSheetProps = {
  mode: "manual" | "blocked";
  services: ServiceRow[];
  days: BookingDayOption[];
  onClose: () => void;
  onSuccess: (message: string) => void;
};

type FetchState = {
  requestKey: string;
  availability: AvailabilityResult | null;
  error: string | null;
};

export function OwnerBookingSheet({
  mode,
  services,
  days,
  onClose,
  onSuccess,
}: OwnerBookingSheetProps) {
  const activeServices = services.filter((s) => s.is_active);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    activeServices[0]?.id ?? "",
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    days[0]?.dateStr ?? "",
  );
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);

  const selectedService =
    activeServices.find((s) => s.id === selectedServiceId) ?? null;

  const requestKey =
    selectedServiceId && selectedDate
      ? `${selectedServiceId}|${selectedDate}|${reloadCounter}`
      : "";

  const [fetchState, setFetchState] = useState<FetchState>({
    requestKey: "",
    availability: null,
    error: null,
  });

  const loadingSlots = Boolean(requestKey) && fetchState.requestKey !== requestKey;
  const availability = loadingSlots ? null : fetchState.availability;
  const slotsError = loadingSlots ? null : fetchState.error;

  useEffect(() => {
    if (!selectedServiceId || !selectedDate) return;

    const controller = new AbortController();
    const currentKey = `${selectedServiceId}|${selectedDate}|${reloadCounter}`;

    const params = new URLSearchParams({
      serviceId: selectedServiceId,
      date: selectedDate,
      mode: "owner",
    });

    fetch(`/api/availability?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (res) => {
        const body = (await res.json()) as AvailabilityResult & {
          error?: string;
        };
        if (!res.ok) {
          throw new Error(
            body.error || "No pudimos cargar las franjas disponibles.",
          );
        }
        setFetchState({
          requestKey: currentKey,
          availability: body,
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message =
          err instanceof Error
            ? err.message
            : "No pudimos cargar las franjas disponibles.";
        setFetchState({
          requestKey: currentKey,
          availability: null,
          error: message,
        });
      });

    return () => controller.abort();
  }, [selectedServiceId, selectedDate, reloadCounter]);

  const readableDate = selectedDate
    ? formatPanamaDateLong(buildPanamaISO(selectedDate, "12:00:00"))
    : "";

  const canSubmit =
    Boolean(selectedService && selectedSlot) &&
    (mode === "blocked" ||
      (guestName.trim().length >= 2 && guestPhone.trim().length >= 7));

  const handleSubmit = async () => {
    if (!selectedService || !selectedSlot) return;

    setSubmitting(true);
    setSubmitError(null);

    const result = await createOwnerBookingAction({
      serviceId: selectedService.id,
      dateStr: selectedDate,
      startTime: selectedSlot.startTime,
      mode,
      guestName: mode === "manual" ? guestName : undefined,
      guestPhone: mode === "manual" ? guestPhone : undefined,
    });

    setSubmitting(false);

    if (!result.ok) {
      setSubmitError(result.error);
      if (result.code === "SLOT_TAKEN") {
        setSelectedSlot(null);
        setReloadCounter((c) => c + 1);
      }
      return;
    }

    onSuccess(
      mode === "manual"
        ? "Reserva manual creada y confirmada correctamente."
        : "Horario bloqueado correctamente.",
    );
  };

  return (
    <Sheet
      open
      onClose={submitting ? () => {} : onClose}
      title={mode === "manual" ? "Nueva reserva manual" : "Bloquear horario"}
      subtitle={
        mode === "manual"
          ? "Registra una reserva directa (quedará confirmada de inmediato)."
          : "Marca una franja como ocupada para que no pueda reservarse."
      }
      accentColor={mode === "manual" ? "#ff3b6b" : "#7c3aed"}
      headerExtra={
        <div className="mb-2">
          <Badge tone={mode === "manual" ? "confirmed" : "blocked"}>
            {mode === "manual" ? "Confirmada directa" : "Bloqueo de horario"}
          </Badge>
        </div>
      }
      footer={
        activeServices.length > 0 ? (
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              {selectedService && (
                <>
                  <p className="truncate text-sm font-bold text-white">
                    {mode === "manual"
                      ? formatUSD(selectedService.price)
                      : selectedService.name}
                  </p>
                  <p className="truncate text-xs text-[#a99ec4]">
                    {selectedSlot
                      ? `${selectedSlot.startTime} – ${selectedSlot.endTime}`
                      : "Elige una franja libre"}
                  </p>
                </>
              )}
            </div>
            <Button
              size="lg"
              loading={submitting}
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {mode === "manual" ? "Crear reserva" : "Bloquear franja"}
            </Button>
          </div>
        ) : undefined
      }
    >
      {activeServices.length === 0 ? (
        <Card className="mt-4 p-6 text-center">
          <p className="font-bold text-white">No tienes servicios activos</p>
          <p className="mt-1.5 text-sm text-[#a99ec4]">
            Activa o crea al menos un servicio para poder registrar reservas
            manuales o bloquear horarios.
          </p>
          <Link
            href="/panel/servicios"
            onClick={onClose}
            className="bk-grad-shadow mt-4 inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-bold text-white"
          >
            Ir a Servicios
          </Link>
        </Card>
      ) : (
        <div className="space-y-6 pt-3">
          {submitError && (
            <div
              role="alert"
              className="rounded-[14px] border border-[#ff3b6b]/40 bg-[#ff3b6b]/15 px-4 py-3 text-sm font-medium text-[#ff7a9b]"
            >
              {submitError}
            </div>
          )}

          {/* 1. Selector de servicio */}
          <div className="space-y-2.5">
            <h4 className="text-base font-bold text-white">1. Servicio</h4>
            <div className="grid gap-2">
              {activeServices.map((service) => {
                const active = service.id === selectedServiceId;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      setSelectedServiceId(service.id);
                      setSelectedSlot(null);
                      setSubmitError(null);
                    }}
                    className={`flex cursor-pointer items-center justify-between rounded-[14px] border px-4 py-3 text-left transition ${
                      active
                        ? "border-[#ff3b6b] bg-[#ff3b6b]/15 text-white"
                        : "border-white/10 bg-white/[0.06] text-white/90 hover:bg-white/[0.11]"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold">{service.name}</p>
                      <p className="text-xs text-[#a99ec4]">
                        {service.slot_duration_minutes} min ·{" "}
                        {service.is_roofed ? "Techado" : "Aire libre"}
                      </p>
                    </div>
                    <span className="text-sm font-extrabold">
                      {formatUSD(service.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Selector de fecha */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white">2. Fecha</h4>
              <span className="text-xs text-[#a99ec4]">Próximos 14 días</span>
            </div>
            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
              {days.map((day) => {
                const active = selectedDate === day.dateStr;
                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDate(day.dateStr);
                      setSelectedSlot(null);
                      setSubmitError(null);
                    }}
                    className={`w-[58px] shrink-0 cursor-pointer rounded-[14px] border py-2.5 text-center transition ${
                      active
                        ? "bk-grad border-transparent text-white shadow-[0_6px_18px_rgba(255,45,149,0.3)]"
                        : "border-white/10 bg-white/[0.07] text-[#a99ec4] hover:bg-white/[0.12]"
                    }`}
                  >
                    <span className="block text-[11px] font-semibold capitalize">
                      {day.isToday ? "Hoy" : day.weekdayShort}
                    </span>
                    <strong className="mt-0.5 block text-xl font-extrabold text-white">
                      {day.dayNumber}
                    </strong>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Selector de franja horaria libre */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white">
                3. Franja disponible
              </h4>
              <span className="text-xs text-[#a99ec4]">Hora de Panamá</span>
            </div>

            {loadingSlots ? (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-11 animate-pulse rounded-[12px] bg-white/[0.08]"
                  />
                ))}
              </div>
            ) : slotsError ? (
              <Card className="border-[#ff3b6b]/35 bg-[#ff3b6b]/10 p-4">
                <p className="text-sm font-semibold text-[#ff7a9b]">
                  {slotsError}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => setReloadCounter((c) => c + 1)}
                >
                  Reintentar
                </Button>
              </Card>
            ) : availability?.isClosed ? (
              <Card className="p-5 text-center">
                <p className="text-sm font-bold text-white">Cerrado este día</p>
                <p className="mt-1 text-xs text-[#a99ec4]">
                  No hay horario abierto para{" "}
                  <span className="capitalize">{readableDate}</span>.
                </p>
              </Card>
            ) : availability && availability.slots.length === 0 ? (
              <Card className="p-5 text-center">
                <p className="text-sm font-bold text-white">
                  Sin franjas libres
                </p>
                <p className="mt-1 text-xs text-[#a99ec4]">
                  Todas las franjas de este día están ocupadas o ya pasaron.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {(availability?.slots ?? []).map((slot) => {
                  const active = selectedSlot?.startIso === slot.startIso;
                  return (
                    <button
                      key={slot.startIso}
                      type="button"
                      onClick={() => {
                        setSelectedSlot(slot);
                        setSubmitError(null);
                      }}
                      className={`cursor-pointer rounded-[12px] border py-2.5 text-center text-sm font-bold transition active:scale-[0.96] ${
                        active
                          ? "bk-grad border-transparent text-white shadow-[0_6px_18px_rgba(255,45,149,0.3)]"
                          : "border-white/10 bg-white/[0.07] text-white hover:bg-white/[0.13]"
                      }`}
                    >
                      {slot.startTime}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Datos del cliente (solo para reserva manual) */}
          {mode === "manual" && (
            <div className="space-y-3 border-t border-white/10 pt-4">
              <h4 className="text-base font-bold text-white">
                4. Datos del cliente
              </h4>
              <Input
                id="guest_name"
                label="Nombre del cliente"
                placeholder="Ej. Carlos Pérez"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
              />
              <Input
                id="guest_phone"
                type="tel"
                label="Teléfono"
                placeholder="Ej. 6123-4567"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                required
              />
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}
