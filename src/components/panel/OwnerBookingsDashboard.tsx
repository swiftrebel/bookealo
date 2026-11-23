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
    <div className="space-y-7">
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
          className={`rounded-[14px] border px-4 py-3 text-sm font-medium ${
            feedback.type === "error"
              ? "border-[#ff3b6b]/40 bg-[#ff3b6b]/15 text-[#ff7a9b]"
              : "border-emerald-400/35 bg-emerald-500/15 text-emerald-200"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Pestañas Pendientes / Próximas / Historial */}
      <div className="space-y-3">
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 min-[900px]:mx-0 min-[900px]:px-0">
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
                className={`shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bk-grad border-transparent text-white shadow-[0_6px_18px_rgba(255,45,149,0.28)]"
                    : "border-white/10 bg-white/[0.07] text-[#d9d0ee] hover:bg-white/[0.12]"
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {/* Filtro rápido por servicio si hay más de uno */}
        {services.length > 1 && (
          <div className="no-scrollbar -mx-5 flex items-center gap-1.5 overflow-x-auto px-5 min-[900px]:mx-0 min-[900px]:px-0">
            <span className="mr-1 shrink-0 text-xs font-semibold text-[#a99ec4]">
              Servicio:
            </span>
            <button
              type="button"
              onClick={() => setServiceFilter("all")}
              className={`shrink-0 cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition ${
                serviceFilter === "all"
                  ? "border-white/30 bg-white/15 text-white"
                  : "border-white/10 bg-white/[0.04] text-[#a99ec4] hover:text-white"
              }`}
            >
              Todos
            </button>
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => setServiceFilter(service.id)}
                className={`shrink-0 cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  serviceFilter === service.id
                    ? "border-white/30 bg-white/15 text-white"
                    : "border-white/10 bg-white/[0.04] text-[#a99ec4] hover:text-white"
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
            activeTab === "pending"
              ? "✅"
              : activeTab === "upcoming"
                ? "🗓️"
                : "📜"
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
        <div className="space-y-3">
          {visibleList.map((booking) => {
            const isBusy = busyBookingId === booking.id;
            const isPending = booking.status === "pending";
            const canCancelUpcoming =
              booking.bucket === "upcoming" &&
              (booking.status === "confirmed" || booking.status === "blocked");

            return (
              <Card key={booking.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-white">
                        {booking.serviceName}
                      </h3>
                      <BookingStatusBadge status={booking.status} />
                      {booking.isManual && <Badge tone="info">Manual</Badge>}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#a99ec4]">
                      <span className="inline-flex items-center gap-1 capitalize text-white/90">
                        <CalendarIcon className="h-3.5 w-3.5 text-[#ff5e7e]" />
                        {formatPanamaDate(booking.start_time)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-white/90">
                        <ClockIcon className="h-3.5 w-3.5 text-[#ff5e7e]" />
                        {formatPanamaTimeRange(
                          booking.start_time,
                          booking.end_time,
                        )}
                      </span>
                    </div>

                    {/* Datos del cliente o bloqueo */}
                    {booking.isBlocked ? (
                      <p className="inline-flex items-center gap-1.5 text-xs text-violet-200/85">
                        <LockIcon className="h-3.5 w-3.5" />
                        Horario bloqueado manualmente por el negocio
                      </p>
                    ) : (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-white">
                          <UserIcon className="h-4 w-4 text-[#a99ec4]" />
                          {booking.contactName || "Cliente"}
                        </span>
                        {booking.contactPhone && (
                          <a
                            href={`tel:${booking.contactPhone.replace(/\s+/g, "")}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#ff5e7e] transition hover:text-white"
                          >
                            <PhoneIcon className="h-3.5 w-3.5" />
                            {booking.contactPhone}
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Precio y acciones */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                    {!booking.isBlocked && (
                      <p className="text-lg font-extrabold text-white">
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
                            <CheckIcon className="h-4 w-4" />
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
              </Card>
            );
          })}
        </div>
      )}

      {/* Datos del negocio en modo solo lectura */}
      <section className="pt-2">
        <Card className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white">
                Información de tu negocio
              </h2>
              <p className="text-xs text-[#a99ec4]">
                Solo lectura. Para actualizar estos datos, contacta al
                administrador.
              </p>
            </div>
            <Badge tone={business.is_active ? "confirmed" : "cancelled"}>
              {business.is_active ? "Activo" : "Inactivo"}
            </Badge>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            {business.zone && (
              <div className="flex items-center gap-2 text-white/90">
                <MapPinIcon className="h-4 w-4 shrink-0 text-[#ff5e7e]" />
                <span>{business.zone}</span>
              </div>
            )}
            {business.phone && (
              <div className="flex items-center gap-2 text-white/90">
                <PhoneIcon className="h-4 w-4 shrink-0 text-[#ff5e7e]" />
                <span>{business.phone}</span>
              </div>
            )}
            {safeMapsUrl && (
              <a
                href={safeMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-[#ff5e7e] hover:text-white"
              >
                <span>Ver ubicación en Google Maps</span>
                <ExternalLinkIcon className="h-4 w-4" />
              </a>
            )}
          </div>

          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {amenities.map((item) => (
                <Badge key={item} tone="neutral">
                  {item}
                </Badge>
              ))}
            </div>
          )}

          {business.cancellation_policy && (
            <div className="rounded-xl bg-white/[0.04] p-3.5 text-xs text-[#a99ec4]">
              <strong className="block text-white/90">
                Política de cancelación
              </strong>
              <p className="mt-1 leading-relaxed">
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
