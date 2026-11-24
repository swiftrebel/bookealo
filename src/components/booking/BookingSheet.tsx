"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createCustomerBookingAction } from "@/actions/bookings";
import { Badge, BookingStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ClockIcon,
} from "@/components/ui/Icons";
import { Sheet } from "@/components/ui/Sheet";
import type { AvailabilityResult, AvailableSlot } from "@/lib/availability";
import { formatUSD } from "@/lib/currency";
import {
  buildPanamaISO,
  formatPanamaDateLong,
  formatPanamaTime,
} from "@/lib/dates";

export type BookingDayOption = {
  dateStr: string;
  dayOfWeek: number;
  weekdayShort: string;
  weekdayFull: string;
  dayNumber: number;
  isToday: boolean;
};

export type BookableBusiness = {
  id: string;
  name: string;
  zone: string | null;
  cancellation_policy: string | null;
};

export type BookableService = {
  id: string;
  name: string;
  price: number;
  slot_duration_minutes: number;
  is_roofed: boolean;
};

type BookingSheetProps = {
  onClose: () => void;
  business: BookableBusiness;
  service: BookableService;
  days: BookingDayOption[];
  isAuthenticated: boolean;
  initialDateStr?: string | null;
  initialSlotTime?: string | null;
};

type Step = "select" | "summary" | "confirmed";

type FetchState = {
  requestKey: string;
  availability: AvailabilityResult | null;
  error: string | null;
};

export function BookingSheet({
  onClose,
  business,
  service,
  days,
  isAuthenticated,
  initialDateStr,
  initialSlotTime,
}: BookingSheetProps) {
  const router = useRouter();
  const defaultDate =
    initialDateStr && days.some((d) => d.dateStr === initialDateStr)
      ? initialDateStr
      : (days[0]?.dateStr ?? "");

  const [step, setStep] = useState<Step>("select");
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);
  const [confirmedPrice, setConfirmedPrice] = useState<number | null>(null);

  const pendingInitialTimeRef = useRef<string | null>(initialSlotTime ?? null);

  const requestKey = `${service.id}|${selectedDate}|${reloadCounter}`;
  const [fetchState, setFetchState] = useState<FetchState>({
    requestKey: "",
    availability: null,
    error: null,
  });

  const loadingSlots = fetchState.requestKey !== requestKey;
  const availability = loadingSlots ? null : fetchState.availability;
  const slotsError = loadingSlots ? null : fetchState.error;

  useEffect(() => {
    if (!selectedDate) return;

    const controller = new AbortController();
    const currentKey = `${service.id}|${selectedDate}|${reloadCounter}`;

    const params = new URLSearchParams({
      serviceId: service.id,
      date: selectedDate,
      mode: "customer",
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
            body.error || "No pudimos cargar los horarios disponibles.",
          );
        }

        setFetchState({
          requestKey: currentKey,
          availability: body,
          error: null,
        });

        const initialTime = pendingInitialTimeRef.current;
        if (initialTime) {
          pendingInitialTimeRef.current = null;
          const matched = body.slots.find(
            (slot) => slot.startTime === initialTime,
          );
          if (matched) {
            setSelectedSlot(matched);
            if (isAuthenticated) {
              setStep("summary");
            }
          } else {
            setBookingError(
              "El horario que habías elegido ya no está disponible. Elige otra franja.",
            );
          }
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message =
          err instanceof Error
            ? err.message
            : "No pudimos cargar los horarios disponibles.";
        setFetchState({
          requestKey: currentKey,
          availability: null,
          error: message,
        });
      });

    return () => controller.abort();
  }, [service.id, selectedDate, reloadCounter, isAuthenticated]);

  const readableDate = selectedDate
    ? formatPanamaDateLong(buildPanamaISO(selectedDate, "12:00:00"))
    : "";

  const returnPath = selectedSlot
    ? `/negocios/${business.id}?reservar=${encodeURIComponent(service.id)}&fecha=${encodeURIComponent(selectedDate)}&hora=${encodeURIComponent(selectedSlot.startTime)}`
    : `/negocios/${business.id}?reservar=${encodeURIComponent(service.id)}&fecha=${encodeURIComponent(selectedDate)}`;

  const handleSelectDate = (dateStr: string) => {
    pendingInitialTimeRef.current = null;
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setBookingError(null);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;

    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(returnPath)}`);
      return;
    }

    setSubmitting(true);
    setBookingError(null);

    const result = await createCustomerBookingAction({
      serviceId: service.id,
      dateStr: selectedDate,
      startTime: selectedSlot.startTime,
    });

    setSubmitting(false);

    if (!result.ok) {
      if (result.code === "UNAUTHENTICATED") {
        router.push(`/login?next=${encodeURIComponent(returnPath)}`);
        return;
      }

      if (result.code === "SLOT_TAKEN") {
        setBookingError(result.error);
        setSelectedSlot(null);
        setStep("select");
        setReloadCounter((c) => c + 1);
        return;
      }

      setBookingError(result.error);
      return;
    }

    setConfirmedPrice(result.booking.total_price ?? service.price);
    setStep("confirmed");
  };

  return (
    <Sheet
      open
      onClose={submitting ? () => {} : onClose}
      title={service.name}
      subtitle={`${business.name}${business.zone ? ` · ${business.zone}` : ""}`}
      headerExtra={
        <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
          <Badge tone={service.is_roofed ? "info" : "neutral"}>
            {service.is_roofed ? "Techado" : "Aire libre"}
          </Badge>
          <Badge tone="neutral">{service.slot_duration_minutes} min</Badge>
          <Badge tone="confirmed">{formatUSD(service.price)}</Badge>
        </div>
      }
      footer={
        step === "select" ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[20px] font-semibold tracking-[-0.02em] text-[#f5f5f7] tabular-nums">
                {formatUSD(service.price)}
              </p>
              <p className="text-[12px] text-[#86868b] tabular-nums">
                {selectedSlot
                  ? `${selectedSlot.startTime} – ${selectedSlot.endTime}`
                  : `Turno de ${service.slot_duration_minutes} min`}
              </p>
            </div>
            <Button
              size="lg"
              disabled={!selectedSlot}
              onClick={() => {
                setBookingError(null);
                setStep("summary");
              }}
            >
              Continuar
            </Button>
          </div>
        ) : step === "summary" ? (
          <div className="space-y-3">
            {isAuthenticated ? (
              <Button
                fullWidth
                size="lg"
                loading={submitting}
                onClick={handleConfirmBooking}
              >
                {submitting ? "Enviando solicitud..." : "Confirmar reserva"}
              </Button>
            ) : (
              <>
                <Button
                  fullWidth
                  size="lg"
                  onClick={() =>
                    router.push(`/login?next=${encodeURIComponent(returnPath)}`)
                  }
                >
                  Iniciar sesión para reservar
                </Button>
                <p className="text-center text-[13px] text-[#86868b]">
                  ¿No tienes cuenta?{" "}
                  <Link
                    href={`/registro?next=${encodeURIComponent(returnPath)}`}
                    className="bk-ul font-medium"
                  >
                    Regístrate aquí
                  </Link>
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/mis-reservas"
              onClick={onClose}
              className="bk-cta h-12 flex-1 px-6 text-[15px]"
            >
              Ver mis reservas
            </Link>
            <Button variant="secondary" size="lg" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        )
      }
    >
      {step === "select" && (
        <div className="space-y-7 pt-5">
          {bookingError && (
            <div
              role="alert"
              className="rounded-[14px] border border-[#ff6961]/30 bg-[rgba(255,69,58,0.14)] px-4 py-3 text-[13px] font-medium text-[#ff6961]"
            >
              {bookingError}
            </div>
          )}

          {/* Selector de los próximos 14 días (America/Panama) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[16px] font-semibold tracking-[-0.015em] text-[#f5f5f7]">
                Elige una fecha
              </h4>
              <span className="text-[12px] text-[#86868b]">
                Próximos 14 días
              </span>
            </div>

            <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 pb-1">
              {days.map((day) => {
                const active = selectedDate === day.dateStr;
                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => handleSelectDate(day.dateStr)}
                    className={`bk-tx w-[58px] shrink-0 cursor-pointer rounded-[14px] border py-2.5 text-center ${
                      active
                        ? "border-transparent bg-[#f5f5f7] text-black"
                        : "border-white/[0.09] bg-[#1a1a1c] text-[#86868b] hover:bg-[#222225] hover:text-[#f5f5f7]"
                    }`}
                  >
                    <span className="block text-[11px] font-medium capitalize">
                      {day.isToday ? "Hoy" : day.weekdayShort}
                    </span>
                    <strong
                      className={`mt-0.5 block text-[19px] font-semibold tabular-nums ${
                        active ? "text-black" : "text-[#f5f5f7]"
                      }`}
                    >
                      {day.dayNumber}
                    </strong>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Franjas disponibles (solo libres) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[16px] font-semibold tracking-[-0.015em] text-[#f5f5f7]">
                Horarios disponibles
              </h4>
              <span className="text-[12px] text-[#86868b]">Hora de Panamá</span>
            </div>

            {loadingSlots ? (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-12 animate-pulse rounded-[12px] bg-[#1a1a1c]"
                  />
                ))}
              </div>
            ) : slotsError ? (
              <Card className="border-[#ff6961]/25 bg-[rgba(255,69,58,0.1)] p-4">
                <p className="text-[13px] font-medium text-[#ff6961]">
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
              <Card variant="surface" className="p-6 text-center">
                <p className="text-[15px] font-semibold text-[#f5f5f7]">
                  Cerrado este día
                </p>
                <p className="mt-1.5 text-[13px] text-[#86868b]">
                  Este servicio no tiene atención el{" "}
                  <span className="capitalize">{readableDate}</span>. Elige otra
                  fecha.
                </p>
              </Card>
            ) : availability && availability.slots.length === 0 ? (
              <Card variant="surface" className="p-6 text-center">
                <p className="text-[15px] font-semibold text-[#f5f5f7]">
                  Sin horarios disponibles
                </p>
                <p className="mt-1.5 text-[13px] text-[#86868b]">
                  No quedan franjas libres para esta fecha. Prueba seleccionando
                  otro día.
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
                        setBookingError(null);
                      }}
                      className={`bk-tx cursor-pointer rounded-[12px] border py-3 text-center text-[14px] font-medium tabular-nums ${
                        active
                          ? "border-transparent bg-[#1d7f45] text-white"
                          : "border-white/[0.09] bg-[#1a1a1c] text-[#f5f5f7] hover:border-white/20 hover:bg-[#222225]"
                      }`}
                    >
                      {slot.startTime}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {step === "summary" && selectedSlot && (
        <div className="space-y-6 pt-5">
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              setBookingError(null);
              setStep("select");
            }}
            className="bk-tx inline-flex cursor-pointer items-center gap-1 text-[14px] text-[#86868b] hover:text-[#f5f5f7] disabled:opacity-50"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Cambiar fecha u horario
          </button>

          <div>
            <h4 className="text-[22px] font-semibold tracking-[-0.025em] text-[#f5f5f7]">
              Resumen de tu reserva
            </h4>
            <p className="mt-1 text-[13px] text-[#86868b]">
              Revisa los detalles antes de enviar tu solicitud.
            </p>
          </div>

          {bookingError && (
            <div
              role="alert"
              className="rounded-[14px] border border-[#ff6961]/30 bg-[rgba(255,69,58,0.14)] px-4 py-3 text-[13px] font-medium text-[#ff6961]"
            >
              {bookingError}
            </div>
          )}

          <Card variant="surface" className="divide-y divide-white/[0.08] px-4 text-[14px]">
            <div className="flex items-start justify-between gap-3 py-3.5">
              <span className="text-[#86868b]">Negocio</span>
              <span className="text-right font-medium text-[#f5f5f7]">
                {business.name}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3 py-3.5">
              <span className="text-[#86868b]">Servicio</span>
              <span className="text-right font-medium text-[#f5f5f7]">
                {service.name}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3 py-3.5">
              <span className="inline-flex items-center gap-1.5 text-[#86868b]">
                <CalendarIcon className="h-4 w-4" />
                Fecha
              </span>
              <span className="text-right font-medium capitalize text-[#f5f5f7]">
                {readableDate}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3 py-3.5">
              <span className="inline-flex items-center gap-1.5 text-[#86868b]">
                <ClockIcon className="h-4 w-4" />
                Horario
              </span>
              <span className="text-right font-medium text-[#f5f5f7] tabular-nums">
                {formatPanamaTime(selectedSlot.startIso)} –{" "}
                {formatPanamaTime(selectedSlot.endIso)} (
                {service.slot_duration_minutes} min)
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 py-4">
              <span className="font-medium text-[#f5f5f7]">
                Total a pagar en el lugar
              </span>
              <span className="text-[20px] font-semibold tracking-[-0.02em] text-[#f5f5f7] tabular-nums">
                {formatUSD(service.price)}
              </span>
            </div>
          </Card>

          <div className="border-t border-white/[0.09] pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[rgba(245,245,247,0.44)]">
              Política de cancelación
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[#86868b]">
              {business.cancellation_policy?.trim() ||
                "Puedes cancelar desde Mis reservas. Para cambios de última hora contacta directamente al negocio."}
            </p>
          </div>

          <p className="text-[13px] text-[#86868b]">
            Tu reserva quedará en estado{" "}
            <strong className="font-medium text-[#f5f5f7]">Pendiente</strong>{" "}
            hasta que el negocio la confirme.
          </p>
        </div>
      )}

      {step === "confirmed" && selectedSlot && (
        <div className="space-y-6 pt-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#1d7f45] text-white">
            <CheckIcon className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h4 className="text-[24px] font-semibold leading-[1.15] tracking-[-0.025em] text-[#f5f5f7]">
              Solicitud enviada, esperando confirmación del negocio
            </h4>
            <p className="text-[14px] leading-relaxed text-[#86868b]">
              Puedes consultar el estado o cancelar tu solicitud en cualquier
              momento desde{" "}
              <strong className="font-medium text-[#f5f5f7]">
                Mis reservas
              </strong>
              .
            </p>
          </div>

          <Card variant="surface" className="space-y-2 p-5 text-left text-[14px]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-[#f5f5f7]">
                {service.name}
              </span>
              <BookingStatusBadge status="pending" />
            </div>
            <p className="text-[13px] text-[#86868b]">{business.name}</p>
            <p className="text-[13px] capitalize text-[#f5f5f7]/80 tabular-nums">
              {readableDate} · {formatPanamaTime(selectedSlot.startIso)} –{" "}
              {formatPanamaTime(selectedSlot.endIso)}
            </p>
            <p className="pt-2 text-[17px] font-semibold text-[#f5f5f7] tabular-nums">
              {formatUSD(confirmedPrice ?? service.price)}{" "}
              <span className="text-[12px] font-normal text-[#86868b]">
                (pago en el lugar)
              </span>
            </p>
          </Card>
        </div>
      )}
    </Sheet>
  );
}
