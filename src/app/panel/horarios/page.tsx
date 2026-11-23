import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Horarios",
};

export default async function PanelHorariosPage() {
  await requireRole(["business_owner"], "/panel/horarios");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Panel del dueño"
        title="Horarios"
        subtitle="Configura los días y horas de apertura para cada servicio."
      />
      <EmptyState
        icon="🕒"
        title="Gestión de horarios próximamente"
        description="La edición semanal de horarios por servicio se implementará en la Fase 5."
      />
    </div>
  );
}
