"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createCustomerBookingAction } from "@/actions/bookings";
import { getGradientForSeed } from "@/components/ui/Artwork";
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

  const [accentColor] = getGradientForSeed(business.id);
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
      accentColor={accentColor}
      headerExtra={
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge tone={service.is_roofed ? "info" : "neutral"}>
            {service.is_roofed ? "Techado" : "Aire libre"}
          </Badge>
          <Badge tone="neutral">{service.slot_duration_minutes} min</Badge>
          <Badge tone="accent">{formatUSD(service.price)}</Badge>
        </div>
      }
      footer={
        step === "select" ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xl font-extrabold text-white">
                {formatUSD(service.price)}
              </p>
              <p className="text-xs text-[#a99ec4]">
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
          <div className="space-y-2.5">
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
                <p className="text-center text-xs text-[#a99ec4]">
                  ¿No tienes cuenta?{" "}
                  <Link
                    href={`/registro?next=${encodeURIComponent(returnPath)}`}
                    className="font-bold text-[#ff5e7e] hover:text-white"
                  >
                    Regístrate aquí
                  </Link>
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/mis-reservas"
              onClick={onClose}
              className="bk-grad-shadow inline-flex h-12 flex-1 items-center justify-center rounded-[14px] px-5 text-sm font-bold text-white transition hover:brightness-110"
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
        <div className="space-y-6 pt-3">
          {bookingError && (
            <div
              role="alert"
              className="rounded-[14px] border border-[#ff3b6b]/40 bg-[#ff3b6b]/15 px-4 py-3 text-sm font-medium text-[#ff7a9b]"
            >
              {bookingError}
            </div>
          )}

          {/* Selector de los próximos 14 días (America/Panama), fiel a .days */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold tracking-[-0.02em] text-white">
                Elige una fecha
              </h4>
              <span className="text-xs text-[#a99ec4]">Próximos 14 días</span>
            </div>

            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
              {days.map((day) => {
                const active = selectedDate === day.dateStr;
                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => handleSelectDate(day.dateStr)}
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

          {/* Franjas disponibles (solo libres), fiel a .slots */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold tracking-[-0.02em] text-white">
                Horarios disponibles
              </h4>
              <span className="text-xs text-[#a99ec4]">Hora de Panamá</span>
            </div>

            {loadingSlots ? (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-12 animate-pulse rounded-[12px] bg-white/[0.08]"
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
              <Card className="p-6 text-center">
                <p className="font-bold text-white">Cerrado este día</p>
                <p className="mt-1 text-xs text-[#a99ec4]">
                  Este servicio no tiene atención el{" "}
                  <span className="capitalize">{readableDate}</span>. Elige otra
                  fecha.
                </p>
              </Card>
            ) : availability && availability.slots.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="font-bold text-white">
                  Sin horarios disponibles
                </p>
                <p className="mt-1 text-xs text-[#a99ec4]">
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
                      className={`cursor-pointer rounded-[12px] border py-3 text-center text-sm font-bold transition active:scale-[0.96] ${
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
        </div>
      )}

      {step === "summary" && selectedSlot && (
        <div className="space-y-5 pt-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              setBookingError(null);
              setStep("select");
            }}
            className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-[#ff5e7e] transition hover:text-white disabled:opacity-50"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Cambiar fecha u horario
          </button>

          <div>
            <h4 className="text-xl font-extrabold tracking-[-0.02em] text-white">
              Resumen de tu reserva
            </h4>
            <p className="mt-1 text-xs text-[#a99ec4]">
              Revisa los detalles antes de enviar tu solicitud.
            </p>
          </div>

          {bookingError && (
            <div
              role="alert"
              className="rounded-[14px] border border-[#ff3b6b]/40 bg-[#ff3b6b]/15 px-4 py-3 text-sm font-medium text-[#ff7a9b]"
            >
              {bookingError}
            </div>
          )}

          <Card className="space-y-3.5 p-4 text-sm">
            <div className="flex items-start justify-between gap-3">
              <span className="text-[#a99ec4]">Negocio</span>
              <span className="text-right font-semibold text-white">
                {business.name}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-[#a99ec4]">Servicio</span>
              <span className="text-right font-semibold text-white">
                {service.name}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-[#a99ec4]">
                <CalendarIcon className="h-4 w-4" />
                Fecha
              </span>
              <span className="text-right font-semibold capitalize text-white">
                {readableDate}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-[#a99ec4]">
                <ClockIcon className="h-4 w-4" />
                Horario
              </span>
              <span className="text-right font-semibold text-white">
                {formatPanamaTime(selectedSlot.startIso)} –{" "}
                {formatPanamaTime(selectedSlot.endIso)} (
                {service.slot_duration_minutes} min)
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
              <span className="font-semibold text-white">
                Total a pagar en el lugar
              </span>
              <span className="text-xl font-extrabold text-white">
                {formatUSD(service.price)}
              </span>
            </div>
          </Card>

          <Card className="space-y-1.5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[#a99ec4]">
              Política de cancelación
            </p>
            <p className="text-xs leading-relaxed text-white/85">
              {business.cancellation_policy?.trim() ||
                "Puedes cancelar desde Mis reservas. Para cambios de última hora contacta directamente al negocio."}
            </p>
          </Card>

          <p className="text-xs text-[#a99ec4]">
            Tu reserva quedará en estado <strong>Pendiente</strong> hasta que el
            negocio la confirme.
          </p>
        </div>
      )}

      {step === "confirmed" && selectedSlot && (
        <div className="space-y-5 pt-6 text-center">
          <div className="bk-grad-shadow mx-auto grid h-16 w-16 place-items-center rounded-full text-white">
            <CheckIcon className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h4 className="text-2xl font-extrabold leading-tight tracking-[-0.02em] text-white">
              Solicitud enviada, esperando confirmación del negocio
            </h4>
            <p className="text-sm text-[#a99ec4]">
              Puedes consultar el estado o cancelar tu solicitud en cualquier
              momento desde <strong>Mis reservas</strong>.
            </p>
          </div>

          <Card className="space-y-2.5 p-4 text-left text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-white">{service.name}</span>
              <BookingStatusBadge status="pending" />
            </div>
            <p className="text-xs text-[#a99ec4]">{business.name}</p>
            <p className="text-xs capitalize text-white/90">
              {readableDate} · {formatPanamaTime(selectedSlot.startIso)} –{" "}
              {formatPanamaTime(selectedSlot.endIso)}
            </p>
            <p className="pt-1 text-base font-extrabold text-white">
              {formatUSD(confirmedPrice ?? service.price)}{" "}
              <span className="text-xs font-normal text-[#a99ec4]">
                (pago en el lugar)
              </span>
            </p>
          </Card>
        </div>
      )}
    </Sheet>
  );
}
