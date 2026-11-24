import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { OwnerBookingsDashboard } from "@/components/panel/OwnerBookingsDashboard";
import { Badge } from "@/components/ui/Badge";
import { CalendarIcon } from "@/components/ui/Icons";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { requireRole } from "@/lib/auth";
import { getNextPanamaDays } from "@/lib/dates";
import { translateError } from "@/lib/errors";
import { loadOwnerPanelData } from "@/lib/owner";
import { parseAmenities } from "@/types/database";

export const metadata: Metadata = {
  title: "Panel del negocio",
};

export default async function PanelPage() {
  const { user, profile } = await requireRole(["business_owner"], "/panel");
  const { business, services, bookings, error } = await loadOwnerPanelData(
    user.id,
  );

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Panel del dueño"
          title="Reservas"
          subtitle={`Sesión iniciada como ${profile.full_name || user.email}`}
        />
        <ErrorState
          title="No pudimos cargar tu panel"
          message={translateError(error)}
        />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Panel del dueño"
          title="Panel de negocio"
          subtitle={`Bienvenido, ${profile.full_name || user.email}`}
        />
        <EmptyState
          icon={<CalendarIcon className="h-5 w-5" />}
          title="Aún no tienes un negocio asignado"
          description="Tu cuenta tiene rol de dueño de negocio, pero todavía no tiene un negocio vinculado. Pide al administrador que te asigne tu negocio desde Supabase."
        />
      </div>
    );
  }

  const next14Days = getNextPanamaDays(14);
  const amenities = parseAmenities(business.amenities);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Panel del dueño"
        title={business.name}
        subtitle={`Gestiona solicitudes, reservas confirmadas y bloqueos${business.zone ? ` · ${business.zone}` : ""}`}
        action={
          <Badge tone={business.is_active ? "confirmed" : "cancelled"}>
            {business.is_active ? "Negocio activo" : "Negocio inactivo"}
          </Badge>
        }
      />

      <OwnerBookingsDashboard
        business={business}
        amenities={amenities}
        services={services}
        bookings={bookings}
        days={next14Days}
      />
    </div>
  );
}
