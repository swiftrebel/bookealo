import {
  BusinessCatalog,
  type CatalogBusiness,
} from "@/components/businesses/BusinessCatalog";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/ui/States";
import { translateError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { parseAmenities } from "@/types/database";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: businesses, error: businessesError } = await supabase
    .from("businesses")
    .select("id, name, zone, cover_image_url, amenities")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (businessesError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Inicio"
          subtitle="Reserva canchas y servicios por horario en Panamá."
        />
        <ErrorState
          title="No pudimos cargar los negocios"
          message={translateError(businessesError)}
        />
      </div>
    );
  }

  const businessIds = (businesses ?? []).map((b) => b.id);
  const priceMap = new Map<string, { min: number; count: number }>();

  if (businessIds.length > 0) {
    const { data: activeServices } = await supabase
      .from("services")
      .select("business_id, price")
      .in("business_id", businessIds)
      .eq("is_active", true);

    (activeServices ?? []).forEach((service) => {
      const price = Number(service.price);
      const existing = priceMap.get(service.business_id);
      if (!existing) {
        priceMap.set(service.business_id, { min: price, count: 1 });
      } else {
        priceMap.set(service.business_id, {
          min: Math.min(existing.min, price),
          count: existing.count + 1,
        });
      }
    });
  }

  const catalogBusinesses: CatalogBusiness[] = (businesses ?? []).map(
    (business) => {
      const stats = priceMap.get(business.id);
      return {
        id: business.id,
        name: business.name,
        zone: business.zone,
        cover_image_url: business.cover_image_url,
        amenities: parseAmenities(business.amenities),
        minPrice: stats ? stats.min : null,
        serviceCount: stats ? stats.count : 0,
      };
    },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inicio"
        subtitle="Reserva canchas y servicios por horario en Panamá."
      />

      <BusinessCatalog businesses={catalogBusinesses} />
    </div>
  );
}
