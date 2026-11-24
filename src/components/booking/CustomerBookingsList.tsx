"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cancelCustomerBookingAction } from "@/actions/bookings";
import { Artwork } from "@/components/ui/Artwork";
import { BookingStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
        icon={<CalendarIcon className="h-5 w-5" />}
        title="Aún no tienes reservas"
        description="Explora negocios activos y reserva tu primer horario en segundos."
        action={
          <Link href="/" className="bk-cta h-11 px-6 text-[14px]">
            Explorar negocios
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
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

      {/* Pestañas Próximas / Pasadas */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("upcoming")}
          className={`bk-tx h-[36px] cursor-pointer rounded-full border px-4 text-[13px] font-medium tabular-nums ${
            tab === "upcoming"
              ? "border-transparent bg-[#f5f5f7] text-black"
              : "border-white/[0.09] bg-[#1a1a1c] text-[#86868b] hover:bg-[#222225] hover:text-[#f5f5f7]"
          }`}
        >
          Próximas ({upcoming.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("past")}
          className={`bk-tx h-[36px] cursor-pointer rounded-full border px-4 text-[13px] font-medium tabular-nums ${
            tab === "past"
              ? "border-transparent bg-[#f5f5f7] text-black"
              : "border-white/[0.09] bg-[#1a1a1c] text-[#86868b] hover:bg-[#222225] hover:text-[#f5f5f7]"
          }`}
        >
          Pasadas ({past.length})
        </button>
      </div>

      {activeList.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="h-5 w-5" />}
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
              <Link href="/" className="bk-cta h-11 px-6 text-[14px]">
                Buscar horarios
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="border-t border-white/10">
          {activeList.map((booking) => {
            const canCancel =
              booking.isUpcoming &&
              (booking.status === "pending" || booking.status === "confirmed");

            return (
              <article
                key={booking.id}
                className="border-b border-white/10 py-6"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <Artwork
                      src={booking.businessCoverUrl}
                      alt={booking.businessName}
                      seed={booking.businessId ?? booking.id}
                      size="sm"
                    />

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        {booking.businessId ? (
                          <Link
                            href={`/negocios/${booking.businessId}`}
                            className="bk-ul truncate text-[17px] font-semibold tracking-[-0.015em] text-[#f5f5f7]"
                          >
                            {booking.businessName}
                          </Link>
                        ) : (
                          <span className="truncate text-[17px] font-semibold tracking-[-0.015em] text-[#f5f5f7]">
                            {booking.businessName}
                          </span>
                        )}
                        <BookingStatusBadge status={booking.status} />
                      </div>

                      <p className="text-[15px] text-[#f5f5f7]/80">
                        {booking.serviceName}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[#86868b]">
                        <span className="inline-flex items-center gap-1.5 capitalize">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {formatPanamaDate(booking.start_time)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 tabular-nums">
                          <ClockIcon className="h-3.5 w-3.5" />
                          {formatPanamaTimeRange(
                            booking.start_time,
                            booking.end_time,
                          )}
                        </span>
                        {booking.businessZone && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPinIcon className="h-3.5 w-3.5" />
                            {booking.businessZone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-5 sm:justify-end">
                    <div className="sm:text-right">
                      <p className="text-[19px] font-semibold tracking-[-0.02em] text-[#f5f5f7] tabular-nums">
                        {formatUSD(booking.total_price)}
                      </p>
                      <p className="text-[12px] text-[#86868b]">
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
              </article>
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
