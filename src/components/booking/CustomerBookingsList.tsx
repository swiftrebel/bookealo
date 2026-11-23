"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cancelCustomerBookingAction } from "@/actions/bookings";
import { Artwork } from "@/components/ui/Artwork";
import { BookingStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CalendarIcon, ClockIcon, MapPinIcon } from "@/components/ui/Icons";
import { ConfirmModal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/States";
import { formatUSD } from "@/lib/currency";
import { formatPanamaDate, formatPanamaTimeRange } from "@/lib/dates";
import type { BookingStatus } from "@/types/database";

export type CustomerBookingItem = {
  id: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  total_price: number | null;
  serviceName: string;
  businessId: string | null;
  businessName: string;
  businessZone: string | null;
  businessCoverUrl: string | null;
  cancellationPolicy: string | null;
  isUpcoming: boolean;
};

type CustomerBookingsListProps = {
  bookings: CustomerBookingItem[];
};

export function CustomerBookingsList({ bookings }: CustomerBookingsListProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [bookingToCancel, setBookingToCancel] =
    useState<CustomerBookingItem | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  const upcoming = bookings.filter((b) => b.isUpcoming);
  const past = bookings.filter((b) => !b.isUpcoming);
  const activeList = tab === "upcoming" ? upcoming : past;

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    setCancelling(true);
    setFeedback(null);

    const result = await cancelCustomerBookingAction(bookingToCancel.id);
    setCancelling(false);

    if (!result.ok) {
      setFeedback({ type: "error", message: result.error });
      setBookingToCancel(null);
      return;
    }

    setBookingToCancel(null);
    setFeedback({
      type: "success",
      message: "Tu reserva fue cancelada correctamente.",
    });
    router.refresh();
  };

  if (bookings.length === 0) {
    return (
      <EmptyState
        icon="🗓️"
        title="Aún no tienes reservas"
        description="Explora negocios activos y reserva tu primer horario en segundos."
        action={
          <Link
            href="/"
            className="bk-grad-shadow inline-flex h-11 items-center justify-center rounded-[14px] px-6 text-sm font-bold text-white"
          >
            Explorar negocios
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Pestañas Próximas / Pasadas */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("upcoming")}
          className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition ${
            tab === "upcoming"
              ? "bk-grad border-transparent text-white shadow-[0_6px_18px_rgba(255,45,149,0.28)]"
              : "border-white/10 bg-white/[0.07] text-[#d9d0ee] hover:bg-white/[0.12]"
          }`}
        >
          Próximas ({upcoming.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("past")}
          className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition ${
            tab === "past"
              ? "bk-grad border-transparent text-white shadow-[0_6px_18px_rgba(255,45,149,0.28)]"
              : "border-white/10 bg-white/[0.07] text-[#d9d0ee] hover:bg-white/[0.12]"
          }`}
        >
          Pasadas ({past.length})
        </button>
      </div>

      {activeList.length === 0 ? (
        <EmptyState
          icon={tab === "upcoming" ? "🗓️" : "📜"}
          title={
            tab === "upcoming"
              ? "No tienes reservas próximas"
              : "No tienes reservas pasadas"
          }
          description={
            tab === "upcoming"
              ? "Cuando hagas una reserva, aparecerá aquí con su estado."
              : "Aquí verás tu historial de reservas anteriores o canceladas."
          }
          action={
            tab === "upcoming" ? (
              <Link
                href="/"
                className="bk-grad-shadow inline-flex h-11 items-center justify-center rounded-[14px] px-5 text-sm font-bold text-white"
              >
                Buscar horarios
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {activeList.map((booking) => {
            const canCancel =
              booking.isUpcoming &&
              (booking.status === "pending" || booking.status === "confirmed");

            return (
              <Card key={booking.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3.5">
                    <Artwork
                      src={booking.businessCoverUrl}
                      alt={booking.businessName}
                      seed={booking.businessId ?? booking.id}
                      size="sm"
                    />

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {booking.businessId ? (
                          <Link
                            href={`/negocios/${booking.businessId}`}
                            className="truncate text-base font-bold text-white transition hover:text-[#ff5e7e]"
                          >
                            {booking.businessName}
                          </Link>
                        ) : (
                          <span className="truncate text-base font-bold text-white">
                            {booking.businessName}
                          </span>
                        )}
                        <BookingStatusBadge status={booking.status} />
                      </div>

                      <p className="text-sm font-medium text-white/90">
                        {booking.serviceName}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#a99ec4]">
                        <span className="inline-flex items-center gap-1 capitalize">
                          <CalendarIcon className="h-3.5 w-3.5 text-[#ff5e7e]" />
                          {formatPanamaDate(booking.start_time)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ClockIcon className="h-3.5 w-3.5 text-[#ff5e7e]" />
                          {formatPanamaTimeRange(
                            booking.start_time,
                            booking.end_time,
                          )}
                        </span>
                        {booking.businessZone && (
                          <span className="inline-flex items-center gap-1">
                            <MapPinIcon className="h-3.5 w-3.5" />
                            {booking.businessZone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3 sm:border-t-0 sm:pt-0">
                    <div className="sm:text-right">
                      <p className="text-lg font-extrabold text-white">
                        {formatUSD(booking.total_price)}
                      </p>
                      <p className="text-[11px] text-[#a99ec4]">
                        Pago en el lugar
                      </p>
                    </div>

                    {canCancel && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setBookingToCancel(booking)}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={Boolean(bookingToCancel)}
        onClose={() => setBookingToCancel(null)}
        onConfirm={handleConfirmCancel}
        loading={cancelling}
        title="¿Cancelar esta reserva?"
        description={
          bookingToCancel
            ? `Vas a cancelar ${bookingToCancel.serviceName} en ${bookingToCancel.businessName} (${formatPanamaDate(bookingToCancel.start_time)}, ${formatPanamaTimeRange(bookingToCancel.start_time, bookingToCancel.end_time)}). Esta acción no se puede deshacer.${
                bookingToCancel.cancellationPolicy
                  ? ` Política del negocio: ${bookingToCancel.cancellationPolicy}`
                  : ""
              }`
            : ""
        }
        confirmLabel="Sí, cancelar"
        cancelLabel="Mantener reserva"
        variant="danger"
      />
    </div>
  );
}
