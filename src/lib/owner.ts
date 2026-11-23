import { createClient } from "@/lib/supabase/server";
import type {
  BookingRow,
  BusinessRow,
  MyCustomerRow,
  ServiceRow,
} from "@/types/database";

export type OwnerContextData = {
  business: BusinessRow | null;
  services: ServiceRow[];
  error: string | null;
};

export async function getOwnerBusinessAndServices(
  ownerId: string,
): Promise<OwnerContextData> {
  const supabase = await createClient();

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select(
      "id, name, zone, maps_url, phone, cover_image_url, amenities, cancellation_policy, is_active, created_at, owner_id",
    )
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (businessError) {
    return { business: null, services: [], error: businessError.message };
  }

  if (!business) {
    return { business: null, services: [], error: null };
  }

  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select(
      "id, business_id, name, price, slot_duration_minutes, is_roofed, is_active, created_at",
    )
    .eq("business_id", business.id)
    .order("created_at", { ascending: true });

  if (servicesError) {
    return { business, services: [], error: servicesError.message };
  }

  return {
    business,
    services: services ?? [],
    error: null,
  };
}

export type OwnerBookingWithDetails = {
  id: string;
  service_id: string;
  serviceName: string;
  start_time: string;
  end_time: string;
  status: BookingRow["status"];
  total_price: number | null;
  customer_id: string | null;
  contactName: string | null;
  contactPhone: string | null;
  isManual: boolean;
  isBlocked: boolean;
  bucket: "pending" | "upcoming" | "history";
};

export async function loadOwnerPanelData(ownerId: string): Promise<{
  business: BusinessRow | null;
  services: ServiceRow[];
  bookings: OwnerBookingWithDetails[];
  error: string | null;
}> {
  const { business, services, error } = await getOwnerBusinessAndServices(ownerId);

  if (error || !business) {
    return { business, services, bookings: [], error };
  }

  if (services.length === 0) {
    return { business, services, bookings: [], error: null };
  }

  const supabase = await createClient();
  const serviceIds = services.map((s) => s.id);
  const serviceNameMap = new Map(services.map((s) => [s.id, s.name]));

  const [bookingsRes, customersRes] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, service_id, customer_id, guest_name, guest_phone, start_time, end_time, status, total_price, notes, created_at",
      )
      .in("service_id", serviceIds)
      .order("start_time", { ascending: true }),
    // Por reglas de RLS, los datos de clientes registrados se leen SOLO desde la vista my_customers
    supabase.from("my_customers").select("id, full_name, phone"),
  ]);

  if (bookingsRes.error) {
    return {
      business,
      services,
      bookings: [],
      error: bookingsRes.error.message,
    };
  }

  const customersMap = new Map<string, MyCustomerRow>();
  (customersRes.data ?? []).forEach((customer) => {
    customersMap.set(customer.id, customer);
  });

  const nowMs = new Date().getTime();

  const mapped: OwnerBookingWithDetails[] = (bookingsRes.data ?? []).map(
    (booking) => {
      const endMs = Date.parse(booking.end_time);
      const isFutureOrOngoing = !Number.isNaN(endMs) && endMs >= nowMs;
      const isBlocked = booking.status === "blocked";
      const isManual = !isBlocked && booking.customer_id === null;

      let contactName: string | null = null;
      let contactPhone: string | null = null;

      if (booking.customer_id) {
        const customer = customersMap.get(booking.customer_id);
        contactName = customer?.full_name ?? "Cliente registrado";
        contactPhone = customer?.phone ?? null;
      } else if (!isBlocked) {
        contactName = booking.guest_name ?? "Reserva manual";
        contactPhone = booking.guest_phone ?? null;
      }

      let bucket: OwnerBookingWithDetails["bucket"] = "history";
      if (booking.status === "pending" && isFutureOrOngoing) {
        bucket = "pending";
      } else if (
        (booking.status === "confirmed" || booking.status === "blocked") &&
        isFutureOrOngoing
      ) {
        bucket = "upcoming";
      }

      return {
        id: booking.id,
        service_id: booking.service_id,
        serviceName: serviceNameMap.get(booking.service_id) ?? "Servicio",
        start_time: booking.start_time,
        end_time: booking.end_time,
        status: booking.status,
        total_price:
          booking.total_price !== null ? Number(booking.total_price) : null,
        customer_id: booking.customer_id,
        contactName,
        contactPhone,
        isManual,
        isBlocked,
        bucket,
      };
    },
  );

  return {
    business,
    services,
    bookings: mapped,
    error: null,
  };
}
