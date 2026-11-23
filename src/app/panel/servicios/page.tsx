import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Servicios",
};

export default async function PanelServiciosPage() {
  await requireRole(["business_owner"], "/panel/servicios");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Panel del dueño"
        title="Servicios"
        subtitle="Administra tus canchas o servicios disponibles para reservar."
      />
      <EmptyState
        icon="⚙️"
        title="Gestión de servicios próximamente"
        description="La creación, edición y activación de servicios se implementará en la Fase 5."
      />
    </div>
  );
}
