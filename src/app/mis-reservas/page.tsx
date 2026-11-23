import type { Metadata } from "next";
import {
  CustomerBookingsList,
  type CustomerBookingItem,
} from "@/components/booking/CustomerBookingsList";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/ui/States";
import { requireRole } from "@/lib/auth";
import { translateError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mis reservas",
};

type RawJoinedBooking = {
  id: string;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "blocked" | "cancelled";
  total_price: number | null;
  services: {
    id: string;
    name: string;
    business_id: string;
    businesses: {
      id: string;
      name: string;
      zone: string | null;
      cover_image_url: string | null;
      cancellation_policy: string | null;
    } | null;
  } | null;
};

async function loadCustomerBookings(userId: string): Promise<{
  bookings: CustomerBookingItem[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      start_time,
      end_time,
      status,
      total_price,
      services (
        id,
        name,
        business_id,
        businesses (
          id,
          name,
          zone,
          cover_image_url,
          cancellation_policy
        )
      )
    `,
    )
    .eq("customer_id", userId)
    .order("start_time", { ascending: true });

  if (error) {
    return { bookings: [], error: translateError(error) };
  }

  const nowMs = new Date().getTime();
  const rows = (data ?? []) as unknown as RawJoinedBooking[];

  const mapped: CustomerBookingItem[] = rows.map((row) => {
    const startMs = Date.parse(row.start_time);
    const isUpcoming =
      !Number.isNaN(startMs) &&
      startMs >= nowMs &&
      (row.status === "pending" || row.status === "confirmed");

    return {
      id: row.id,
      start_time: row.start_time,
      end_time: row.end_time,
      status: row.status,
      total_price: row.total_price !== null ? Number(row.total_price) : null,
      serviceName: row.services?.name ?? "Servicio",
      businessId: row.services?.businesses?.id ?? null,
      businessName: row.services?.businesses?.name ?? "Negocio",
      businessZone: row.services?.businesses?.zone ?? null,
      businessCoverUrl: row.services?.businesses?.cover_image_url ?? null,
      cancellationPolicy:
        row.services?.businesses?.cancellation_policy ?? null,
      isUpcoming,
    };
  });

  const upcomingSorted = mapped
    .filter((b) => b.isUpcoming)
    .sort((a, b) => Date.parse(a.start_time) - Date.parse(b.start_time));
  const pastSorted = mapped
    .filter((b) => !b.isUpcoming)
    .sort((a, b) => Date.parse(b.start_time) - Date.parse(a.start_time));

  return { bookings: [...upcomingSorted, ...pastSorted], error: null };
}

export default async function MisReservasPage() {
  const { user, profile } = await requireRole(["customer"], "/mis-reservas");
  const { bookings, error } = await loadCustomerBookings(user.id);

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Tu cuenta"
          title="Mis reservas"
          subtitle={`Hola, ${profile.full_name || "cliente"}.`}
        />
        <ErrorState title="No pudimos cargar tus reservas" message={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tu cuenta"
        title="Mis reservas"
        subtitle={`Hola, ${profile.full_name || "cliente"}. Consulta el estado de tus solicitudes y horarios.`}
      />

      <CustomerBookingsList bookings={bookings} />
    </div>
  );
}
