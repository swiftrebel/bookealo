import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Panel del negocio",
};

export default async function PanelPage() {
  const { user, profile } = await requireRole(["business_owner"], "/panel");
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, zone, phone, is_active")
    .eq("owner_id", user.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Panel del dueño"
        title={business ? business.name : "Panel de negocio"}
        subtitle={
          business
            ? `Sesión iniciada como ${profile.full_name || user.email}${business.zone ? ` · ${business.zone}` : ""}`
            : `Bienvenido, ${profile.full_name || user.email}`
        }
        action={
          business ? (
            <Badge tone={business.is_active ? "confirmed" : "cancelled"}>
              {business.is_active ? "Negocio activo" : "Negocio inactivo"}
            </Badge>
          ) : undefined
        }
      />

      {!business ? (
        <EmptyState
          icon="🏟️"
          title="Aún no tienes un negocio asignado"
          description="Tu cuenta tiene rol de dueño de negocio, pero todavía no tiene un negocio vinculado. Pide al administrador que te asigne tu negocio desde Supabase."
        />
      ) : (
        <Card className="p-6">
          <p className="text-base font-bold text-white">
            Acceso verificado para dueño de negocio
          </p>
          <p className="mt-1.5 text-sm text-[#a99ec4]">
            En las Fases 4 y 5 habilitaremos aquí la gestión de reservas
            (pendientes, próximas, historial, reservas manuales y bloqueos), así
            como tus servicios y horarios.
          </p>
        </Card>
      )}
    </div>
  );
}
