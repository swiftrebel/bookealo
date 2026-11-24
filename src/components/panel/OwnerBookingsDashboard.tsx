"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { updateOwnerBookingStatusAction } from "@/actions/owner-bookings";
import type { BookingDayOption } from "@/components/booking/BookingSheet";
import { OwnerBookingSheet } from "@/components/panel/OwnerBookingSheet";
import { Badge, BookingStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  ExternalLinkIcon,
  LockIcon,
  MapPinIcon,
  PhoneIcon,
  PlusIcon,
  UserIcon,
} from "@/components/ui/Icons";
import { ConfirmModal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/States";
import { formatUSD } from "@/lib/currency";
import { formatPanamaDate, formatPanamaTimeRange } from "@/lib/dates";
import type { OwnerBookingWithDetails } from "@/lib/owner";
import type { BusinessRow, ServiceRow } from "@/types/database";

type OwnerBookingsDashboardProps = {
  business: BusinessRow;
  amenities: string[];
  services: ServiceRow[];
  bookings: OwnerBookingWithDetails[];
  days: BookingDayOption[];
};

type TabKey = "pending" | "upcoming" | "history";

type PendingConfirmAction = {
  booking: OwnerBookingWithDetails;
  kind: "reject" | "cancel";
};

function isSafeHttpUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function OwnerBookingsDashboard({
  business,
  amenities,
  services,
  bookings,
  days,
}: OwnerBookingsDashboardProps) {
  const router = useRouter();

  const initialPendingCount = bookings.filter(
    (b) => b.bucket === "pending",
  ).length;
  const [activeTab, setActiveTab] = useState<TabKey>(
    initialPendingCount > 0 ? "pending" : "upcoming",
  );
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [sheetMode, setSheetMode] = useState<"manual" | "blocked" | null>(null);
  const [confirmAction, setConfirmAction] =
    useState<PendingConfirmAction | null>(null);
  const [busyBookingId, setBusyBookingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  const filteredByService = useMemo(() => {
    if (serviceFilter === "all") return bookings;
    return bookings.filter((b) => b.service_id === serviceFilter);
  }, [bookings, serviceFilter]);

  const pendingList = useMemo(
    () =>
      filteredByService
        .filter((b) => b.bucket === "pending")
        .sort((a, b) => Date.parse(a.start_time) - Date.parse(b.start_time)),
    [filteredByService],
  );

  const upcomingList = useMemo(
    () =>
      filteredByService
        .filter((b) => b.bucket === "upcoming")
        .sort((a, b) => Date.parse(a.start_time) - Date.parse(b.start_time)),
    [filteredByService],
  );

  const historyList = useMemo(
    () =>
      filteredByService
        .filter((b) => b.bucket === "history")
        .sort((a, b) => Date.parse(b.start_time) - Date.parse(a.start_time)),
    [filteredByService],
  );

  const visibleList =
    activeTab === "pending"
      ? pendingList
      : activeTab === "upcoming"
        ? upcomingList
        : historyList;

  const handleConfirmPending = async (booking: OwnerBookingWithDetails) => {
    setBusyBookingId(booking.id);
    setFeedback(null);

    const result = await updateOwnerBookingStatusAction(booking.id, "confirmed");
    setBusyBookingId(null);

    if (!result.ok) {
      setFeedback({ type: "error", message: result.error });
      return;
    }

    setFeedback({
      type: "success",
      message: "Reserva confirmada correctamente.",
    });
    router.refresh();
  };

  const handleExecuteModalCancel = async () => {
    if (!confirmAction) return;
    const { booking, kind } = confirmAction;

    setBusyBookingId(booking.id);
    setFeedback(null);

    const result = await updateOwnerBookingStatusAction(booking.id, "cancelled");
    setBusyBookingId(null);
    setConfirmAction(null);

    if (!result.ok) {
      setFeedback({ type: "error", message: result.error });
      return;
    }

    setFeedback({
      type: "success",
      message:
        kind === "reject"
          ? "Solicitud rechazada y horario liberado."
          : booking.isBlocked
            ? "Bloqueo eliminado y horario liberado."
            : "Reserva cancelada y horario liberado.",
    });
    router.refresh();
  };

  const safeMapsUrl = isSafeHttpUrl(business.maps_url)
    ? business.maps_url
    : null;

  return (
    <div className="space-y-9">
      {/* Acciones principales del dueño */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => setSheetMode("manual")}>
          <PlusIcon className="h-4 w-4" />
          Reserva manual
        </Button>
        <Button variant="secondary" onClick={() => setSheetMode("blocked")}>
          <LockIcon className="h-4 w-4" />
          Bloquear horario
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

      {/* Pestañas Pendientes / Próximas / Historial */}
      <div className="space-y-3.5">
        <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 min-[900px]:mx-0 min-[900px]:px-0">
          {(
            [
              ["pending", "Pendientes", pendingList.length],
              ["upcoming", "Próximas", upcomingList.length],
              ["history", "Historial", historyList.length],
            ] as const
          ).map(([key, label, count]) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`bk-tx h-[36px] shrink-0 cursor-pointer rounded-full border px-4 text-[13px] font-medium tabular-nums ${
                  active
                    ? "border-transparent bg-[#f5f5f7] text-black"
                    : "border-white/[0.09] bg-[#1a1a1c] text-[#86868b] hover:bg-[#222225] hover:text-[#f5f5f7]"
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {/* Filtro rápido por servicio si hay más de uno */}
        {services.length > 1 && (
          <div className="no-scrollbar -mx-6 flex items-center gap-2 overflow-x-auto px-6 min-[900px]:mx-0 min-[900px]:px-0">
            <span className="mr-1 shrink-0 text-[12px] font-medium text-[#86868b]">
              Servicio:
            </span>
            <button
              type="button"
              onClick={() => setServiceFilter("all")}
              className={`bk-tx h-[30px] shrink-0 cursor-pointer rounded-full border px-3 text-[12px] font-medium ${
                serviceFilter === "all"
                  ? "border-white/25 bg-white/[0.12] text-[#f5f5f7]"
                  : "border-white/[0.08] bg-[#111113] text-[#86868b] hover:text-[#f5f5f7]"
              }`}
            >
              Todos
            </button>
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => setServiceFilter(service.id)}
                className={`bk-tx h-[30px] shrink-0 cursor-pointer rounded-full border px-3 text-[12px] font-medium ${
                  serviceFilter === service.id
                    ? "border-white/25 bg-white/[0.12] text-[#f5f5f7]"
                    : "border-white/[0.08] bg-[#111113] text-[#86868b] hover:text-[#f5f5f7]"
                }`}
              >
                {service.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista de reservas según pestaña */}
      {visibleList.length === 0 ? (
        <EmptyState
          icon={
            activeTab === "pending" ? (
              <CheckIcon className="h-5 w-5" />
            ) : (
              <CalendarIcon className="h-5 w-5" />
            )
          }
          title={
            activeTab === "pending"
              ? "No tienes solicitudes pendientes"
              : activeTab === "upcoming"
                ? "No hay reservas ni bloqueos próximos"
                : "Aún no hay historial de reservas"
          }
          description={
            activeTab === "pending"
              ? "Cuando un cliente envíe una solicitud de reserva, aparecerá aquí para que la confirmes o rechaces."
              : activeTab === "upcoming"
                ? "Las reservas confirmadas y horarios bloqueados aparecerán aquí."
                : "Aquí aparecerán las reservas pasadas y canceladas."
          }
        />
      ) : (
        <div className="border-t border-white/10">
          {visibleList.map((booking) => {
            const isBusy = busyBookingId === booking.id;
            const isPending = booking.status === "pending";
            const canCancelUpcoming =
              booking.bucket === "upcoming" &&
              (booking.status === "confirmed" || booking.status === "blocked");

            return (
              <article
                key={booking.id}
                className="border-b border-white/10 py-6"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[17px] font-semibold tracking-[-0.015em] text-[#f5f5f7]">
                        {booking.serviceName}
                      </h3>
                      <BookingStatusBadge status={booking.status} />
                      {booking.isManual && <Badge tone="info">Manual</Badge>}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-[#86868b]">
                      <span className="inline-flex items-center gap-1.5 capitalize text-[#f5f5f7]/80">
                        <CalendarIcon className="h-3.5 w-3.5 text-[#86868b]" />
                        {formatPanamaDate(booking.start_time)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[#f5f5f7]/80 tabular-nums">
                        <ClockIcon className="h-3.5 w-3.5 text-[#86868b]" />
                        {formatPanamaTimeRange(
                          booking.start_time,
                          booking.end_time,
                        )}
                      </span>
                    </div>

                    {/* Datos del cliente o bloqueo */}
                    {booking.isBlocked ? (
                      <p className="inline-flex items-center gap-1.5 text-[13px] text-[#b996ff]/85">
                        <LockIcon className="h-3.5 w-3.5" />
                        Horario bloqueado manualmente por el negocio
                      </p>
                    ) : (
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[14px]">
                        <span className="inline-flex items-center gap-1.5 font-medium text-[#f5f5f7]">
                          <UserIcon className="h-4 w-4 text-[#86868b]" />
                          {booking.contactName || "Cliente"}
                        </span>
                        {booking.contactPhone && (
                          <a
                            href={`tel:${booking.contactPhone.replace(/\s+/g, "")}`}
                            className="bk-ul inline-flex items-center gap-1.5 text-[13px] tabular-nums"
                          >
                            <PhoneIcon className="h-3.5 w-3.5 text-[#86868b]" />
                            {booking.contactPhone}
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Precio y acciones */}
                  <div className="flex flex-wrap items-center justify-between gap-4 sm:flex-col sm:items-end">
                    {!booking.isBlocked && (
                      <p className="text-[19px] font-semibold tracking-[-0.02em] text-[#f5f5f7] tabular-nums">
                        {formatUSD(booking.total_price)}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      {isPending && booking.bucket === "pending" && (
                        <>
                          <Button
                            size="sm"
                            loading={isBusy}
                            disabled={Boolean(busyBookingId)}
                            onClick={() => handleConfirmPending(booking)}
                          >
                            <CheckIcon className="h-3.5 w-3.5" />
                            Confirmar
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={Boolean(busyBookingId)}
                            onClick={() =>
                              setConfirmAction({ booking, kind: "reject" })
                            }
                          >
                            Rechazar
                          </Button>
                        </>
                      )}

                      {canCancelUpcoming && (
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={Boolean(busyBookingId)}
                          onClick={() =>
                            setConfirmAction({ booking, kind: "cancel" })
                          }
                        >
                          {booking.isBlocked ? "Desbloquear" : "Cancelar"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Datos del negocio en modo solo lectura */}
      <section className="pt-4">
        <Card className="space-y-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-[#f5f5f7]">
                Información de tu negocio
              </h2>
              <p className="mt-1 text-[13px] text-[#86868b]">
                Solo lectura. Para actualizar estos datos, contacta al
                administrador.
              </p>
            </div>
            <Badge tone={business.is_active ? "confirmed" : "cancelled"}>
              {business.is_active ? "Activo" : "Inactivo"}
            </Badge>
          </div>

          <div className="grid gap-3 text-[14px] sm:grid-cols-2">
            {business.zone && (
              <div className="flex items-center gap-2 text-[#f5f5f7]/85">
                <MapPinIcon className="h-4 w-4 shrink-0 text-[#86868b]" />
                <span>{business.zone}</span>
              </div>
            )}
            {business.phone && (
              <div className="flex items-center gap-2 text-[#f5f5f7]/85 tabular-nums">
                <PhoneIcon className="h-4 w-4 shrink-0 text-[#86868b]" />
                <span>{business.phone}</span>
              </div>
            )}
            {safeMapsUrl && (
              <a
                href={safeMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bk-ul inline-flex w-fit items-center gap-1.5 text-[14px]"
              >
                <span>Ver ubicación en Google Maps</span>
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          {amenities.length > 0 && (
            <p className="text-[14px] text-[#86868b]">
              {amenities.join(" · ")}
            </p>
          )}

          {business.cancellation_policy && (
            <div className="border-t border-white/[0.08] pt-4 text-[13px] text-[#86868b]">
              <strong className="block font-medium text-[#f5f5f7]">
                Política de cancelación
              </strong>
              <p className="mt-1.5 leading-relaxed">
                {business.cancellation_policy}
              </p>
            </div>
          )}
        </Card>
      </section>

      {/* Sheet de reserva manual / bloqueo */}
      {sheetMode && (
        <OwnerBookingSheet
          key={sheetMode}
          mode={sheetMode}
          services={services}
          days={days}
          onClose={() => setSheetMode(null)}
          onSuccess={(message) => {
            setSheetMode(null);
            setFeedback({ type: "success", message });
            setActiveTab("upcoming");
            router.refresh();
          }}
        />
      )}

      {/* Modal de confirmación para rechazar / cancelar / desbloquear */}
      <ConfirmModal
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleExecuteModalCancel}
        loading={Boolean(
          confirmAction && busyBookingId === confirmAction.booking.id,
        )}
        title={
          confirmAction?.kind === "reject"
            ? "¿Rechazar esta solicitud?"
            : confirmAction?.booking.isBlocked
              ? "¿Desbloquear este horario?"
              : "¿Cancelar esta reserva?"
        }
        description={
          confirmAction
            ? confirmAction.booking.isBlocked
              ? `El horario de ${confirmAction.booking.serviceName} (${formatPanamaDate(confirmAction.booking.start_time)}, ${formatPanamaTimeRange(confirmAction.booking.start_time, confirmAction.booking.end_time)}) volverá a quedar disponible para reservas.`
              : `Vas a ${confirmAction.kind === "reject" ? "rechazar" : "cancelar"} la reserva de ${confirmAction.booking.contactName || "cliente"} en ${confirmAction.booking.serviceName} (${formatPanamaDate(confirmAction.booking.start_time)}, ${formatPanamaTimeRange(confirmAction.booking.start_time, confirmAction.booking.end_time)}). Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel={
          confirmAction?.kind === "reject"
            ? "Sí, rechazar"
            : confirmAction?.booking.isBlocked
              ? "Sí, desbloquear"
              : "Sí, cancelar"
        }
        cancelLabel="Volver"
        variant="danger"
      />
    </div>
  );
}
