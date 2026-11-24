import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { OwnerServicesManager } from "@/components/panel/OwnerServicesManager";
import { GridIcon } from "@/components/ui/Icons";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { requireRole } from "@/lib/auth";
import { translateError } from "@/lib/errors";
import { getOwnerBusinessAndServices } from "@/lib/owner";

export const metadata: Metadata = {
  title: "Servicios",
};

export default async function PanelServiciosPage() {
  const { user } = await requireRole(["business_owner"], "/panel/servicios");
  const { business, services, error } = await getOwnerBusinessAndServices(
    user.id,
  );

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Panel del dueño"
          title="Servicios"
          subtitle="Administra tus canchas o servicios reservables."
        />
        <ErrorState
          title="No pudimos cargar tus servicios"
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
          title="Servicios"
          subtitle="Administra tus canchas o servicios reservables."
        />
        <EmptyState
          icon={<GridIcon className="h-5 w-5" />}
          title="Aún no tienes un negocio asignado"
          description="Cuando el administrador asigne un negocio a tu cuenta, podrás crear y administrar tus servicios desde aquí."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={business.name}
        title="Servicios"
        subtitle="Crea, edita, activa o desactiva los servicios disponibles para reservar."
      />
      <OwnerServicesManager services={services} />
    </div>
  );
}
