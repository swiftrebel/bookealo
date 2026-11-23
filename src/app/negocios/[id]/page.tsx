import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BusinessSchedulePreview } from "@/components/businesses/BusinessSchedulePreview";
import { Artwork } from "@/components/ui/Artwork";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  ChevronLeftIcon,
  ClockIcon,
  ExternalLinkIcon,
  MapPinIcon,
  PhoneIcon,
} from "@/components/ui/Icons";
import { EmptyState } from "@/components/ui/States";
import { getAuthContext } from "@/lib/auth";
import { formatUSD } from "@/lib/currency";
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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [supabase, auth] = await Promise.all([
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
    .select("id, business_id, name, price, slot_duration_minutes, is_roofed, is_active")
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

  const amenities = parseAmenities(business.amenities);
  const safeMapsUrl = isSafeHttpUrl(business.maps_url) ? business.maps_url : null;
  const isNonCustomerRole =
    auth.profile?.role === "business_owner" ||
    auth.profile?.role === "super_admin";

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#ff5e7e] transition hover:text-white"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Volver a negocios
        </Link>
      </div>

      {/* Portada y encabezado del negocio */}
      <section className="relative overflow-hidden rounded-[24px] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        <div className="relative h-[260px] w-full sm:h-[320px]">
          <Artwork
            src={business.cover_image_url}
            alt={business.name}
            seed={business.id}
            size="hero"
            className="rounded-none border-0"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0612] via-[#0a0612]/45 to-transparent" />
        </div>

        <div className="relative -mt-20 px-5 pb-6 sm:px-8 sm:pb-8">
          <h1 className="text-3xl font-extrabold leading-tight tracking-[-0.03em] text-white sm:text-[42px]">
            {business.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/85">
            {business.zone && (
              <span className="inline-flex items-center gap-1.5">
                <MapPinIcon className="h-4 w-4 text-[#ff5e7e]" />
                {business.zone}
              </span>
            )}
            {business.phone && (
              <a
                href={`tel:${business.phone.replace(/\s+/g, "")}`}
                className="inline-flex items-center gap-1.5 transition hover:text-[#ff5e7e]"
              >
                <PhoneIcon className="h-4 w-4 text-[#ff5e7e]" />
                {business.phone}
              </a>
            )}
            {safeMapsUrl && (
              <a
                href={safeMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-[#ff5e7e] transition hover:text-white"
              >
                <span>Ver en Google Maps</span>
                <ExternalLinkIcon className="h-4 w-4" />
              </a>
            )}
          </div>

          {amenities.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-semibold text-white/90"
                >
                  {amenity}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Aviso si el usuario tiene rol que no puede reservar */}
      {isNonCustomerRole && (
        <Card className="border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          Necesitas una cuenta de cliente para reservar.
        </Card>
      )}

      {/* Servicios activos */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-[23px] font-bold tracking-[-0.02em] text-white">
            Servicios disponibles
          </h2>
          <span className="text-xs font-semibold text-[#a99ec4]">
            {serviceList.length}{" "}
            {serviceList.length === 1 ? "servicio" : "servicios"}
          </span>
        </div>

        {serviceList.length === 0 ? (
          <EmptyState
            icon="⚽"
            title="No hay servicios activos en este momento"
            description="Este negocio aún no tiene servicios habilitados para reservar."
          />
        ) : (
          <div className="grid gap-4">
            {serviceList.map((service) => {
              const serviceSchedules = schedulesByService.get(service.id) ?? [];
              return (
                <Card key={service.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-white">
                          {service.name}
                        </h3>
                        <Badge tone={service.is_roofed ? "info" : "neutral"}>
                          {service.is_roofed ? "Techado" : "Aire libre"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-[#a99ec4]">
                        <span className="inline-flex items-center gap-1.5">
                          <ClockIcon className="h-4 w-4 text-[#ff5e7e]" />
                          {service.slot_duration_minutes} min por turno
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-extrabold tracking-tight text-white">
                        {formatUSD(service.price)}
                      </p>
                      <p className="text-xs text-[#a99ec4]">
                        por turno ({service.slot_duration_minutes} min)
                      </p>
                    </div>
                  </div>

                  <BusinessSchedulePreview schedules={serviceSchedules} />
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Política de cancelación e información de pago */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-base font-bold text-white">
            Política de cancelación
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#a99ec4]">
            {business.cancellation_policy?.trim() ||
              "Consulta directamente con el negocio para cambios o cancelaciones de última hora."}
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-bold text-white">Forma de pago</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#a99ec4]">
            Por el momento no se realizan cobros en línea. El pago se realiza
            directamente en el lugar al asistir a tu reserva (precios en USD).
          </p>
        </Card>
      </section>
    </div>
  );
}
