import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BusinessServicesSection,
  type ServiceWithSchedules,
} from "@/components/businesses/BusinessServicesSection";
import { Artwork } from "@/components/ui/Artwork";
import { ChevronLeftIcon, ExternalLinkIcon } from "@/components/ui/Icons";
import { getAuthContext } from "@/lib/auth";
import { getNextPanamaDays } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { parseAmenities, type ScheduleRow } from "@/types/database";

function isSafeHttpUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("name, zone")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (!business) {
    return { title: "Negocio no encontrado" };
  }

  return {
    title: business.name,
    description: business.zone
      ? `Reserva en ${business.name} (${business.zone}) con Bookealo.`
      : `Reserva en ${business.name} con Bookealo.`,
  };
}

export default async function BusinessDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    reservar?: string | string[];
    fecha?: string | string[];
    hora?: string | string[];
  }>;
}) {
  const [{ id }, resolvedSearchParams, supabase, auth] = await Promise.all([
    params,
    searchParams,
    createClient(),
    getAuthContext(),
  ]);

  const { data: business } = await supabase
    .from("businesses")
    .select(
      "id, name, zone, maps_url, phone, cover_image_url, amenities, cancellation_policy, is_active",
    )
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (!business) {
    notFound();
  }

  const { data: services } = await supabase
    .from("services")
    .select(
      "id, business_id, name, price, slot_duration_minutes, is_roofed, is_active",
    )
    .eq("business_id", business.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const serviceList = services ?? [];
  const serviceIds = serviceList.map((service) => service.id);

  const schedulesByService = new Map<string, ScheduleRow[]>();
  if (serviceIds.length > 0) {
    const { data: schedules } = await supabase
      .from("schedules")
      .select("id, service_id, day_of_week, open_time, close_time, is_closed")
      .in("service_id", serviceIds);

    (schedules ?? []).forEach((schedule) => {
      const list = schedulesByService.get(schedule.service_id) ?? [];
      list.push(schedule);
      schedulesByService.set(schedule.service_id, list);
    });
  }

  const servicesWithSchedules: ServiceWithSchedules[] = serviceList.map(
    (service) => ({
      id: service.id,
      name: service.name,
      price: Number(service.price),
      slot_duration_minutes: service.slot_duration_minutes,
      is_roofed: service.is_roofed,
      schedules: schedulesByService.get(service.id) ?? [],
    }),
  );

  const amenities = parseAmenities(business.amenities);
  const safeMapsUrl = isSafeHttpUrl(business.maps_url)
    ? business.maps_url
    : null;
  const next14Days = getNextPanamaDays(14);

  const firstParam = (val: string | string[] | undefined) =>
    Array.isArray(val) ? (val[0] ?? null) : (val ?? null);

  return (
    <div>
      {/* Breadcrumb */}
      <Link
        href="/"
        className="bk-rise bk-tx inline-flex items-center gap-1.5 text-[14px] text-[#86868b] hover:text-[#f5f5f7]"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Negocios
      </Link>

      {/* Header editorial */}
      <header
        className="bk-rise mt-8 max-w-[760px] min-[900px]:mt-10"
        style={{ animationDelay: "80ms" }}
      >
        {business.zone && (
          <p className="text-[16px] font-medium tracking-[0.01em] text-[#86868b] min-[900px]:text-[18px]">
            {business.zone}
          </p>
        )}

        <h1 className="mt-2.5 text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] text-[#f5f5f7] min-[900px]:text-[72px]">
          {business.name}
        </h1>

        {amenities.length > 0 && (
          <p className="mt-5 text-[16px] text-[#86868b] min-[900px]:text-[18px]">
            {amenities.join(" · ")}
          </p>
        )}

        {(business.phone || safeMapsUrl) && (
          <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-3 text-[15px] min-[900px]:mt-8">
            {business.phone && (
              <a
                href={`tel:${business.phone.replace(/\s+/g, "")}`}
                className="bk-ul bk-tx tabular-nums"
              >
                {business.phone}
              </a>
            )}
            {safeMapsUrl && (
              <a
                href={safeMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bk-ul bk-tx inline-flex items-center gap-1.5"
              >
                <span>Ver en Google Maps</span>
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}
      </header>

      {/* Portada independiente */}
      <div
        className="group bk-rise mt-12 h-[240px] overflow-hidden rounded-[24px] sm:h-[340px] min-[900px]:mt-20 min-[900px]:h-[460px]"
        style={{ animationDelay: "160ms" }}
      >
        <Artwork
          src={business.cover_image_url}
          alt={`Carátula de ${business.name}`}
          seed={business.id}
          size="cover"
          className="rounded-none"
        />
      </div>

      {/* Servicios activos + flujo de reserva interactivo */}
      <div
        className="bk-rise mt-16 min-[900px]:mt-32"
        style={{ animationDelay: "240ms" }}
      >
        <BusinessServicesSection
          business={{
            id: business.id,
            name: business.name,
            zone: business.zone,
            cancellation_policy: business.cancellation_policy,
          }}
          services={servicesWithSchedules}
          days={next14Days}
          userRole={auth.profile?.role ?? null}
          initialServiceId={firstParam(resolvedSearchParams.reservar)}
          initialDateStr={firstParam(resolvedSearchParams.fecha)}
          initialSlotTime={firstParam(resolvedSearchParams.hora)}
        />
      </div>

      {/* Política de cancelación e información de pago */}
      <section
        className="bk-rise mt-16 grid gap-12 sm:grid-cols-2 min-[900px]:mt-32 min-[900px]:gap-16"
        style={{ animationDelay: "320ms" }}
      >
        <div className="border-t border-white/10 pt-6">
          <h2 className="text-[20px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#f5f5f7]">
            Política de cancelación
          </h2>
          <p className="mt-3 text-[16px] leading-[1.5] text-[#86868b] min-[900px]:text-[17px]">
            {business.cancellation_policy?.trim() ||
              "Consulta directamente con el negocio para cambios o cancelaciones de última hora."}
          </p>
        </div>

        <div className="border-t border-white/10 pt-6">
          <h2 className="text-[20px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#f5f5f7]">
            Forma de pago
          </h2>
          <p className="mt-3 text-[16px] leading-[1.5] text-[#86868b] min-[900px]:text-[17px]">
            Por el momento no se realizan cobros en línea. El pago se realiza
            directamente en el lugar al asistir a tu reserva (precios en USD).
          </p>
        </div>
      </section>
    </div>
  );
}
