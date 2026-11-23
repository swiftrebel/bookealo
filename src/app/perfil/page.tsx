import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Mi perfil",
};

export default async function PerfilPage() {
  const { user, profile } = await requireRole(["customer"], "/perfil");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tu cuenta"
        title="Mi perfil"
        subtitle="Tus datos de contacto para las reservas en Bookealo."
      />

      <Card className="max-w-xl space-y-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white">Datos registrados</h2>
          <Badge tone="info">Cliente</Badge>
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-xl bg-white/[0.04] p-3.5">
            <dt className="text-xs text-[#a99ec4]">Nombre completo</dt>
            <dd className="mt-1 font-semibold text-white">
              {profile.full_name || "Sin nombre"}
            </dd>
          </div>
          <div className="rounded-xl bg-white/[0.04] p-3.5">
            <dt className="text-xs text-[#a99ec4]">Teléfono</dt>
            <dd className="mt-1 font-semibold text-white">
              {profile.phone || "Sin teléfono"}
            </dd>
          </div>
          <div className="rounded-xl bg-white/[0.04] p-3.5 sm:col-span-2">
            <dt className="text-xs text-[#a99ec4]">Correo electrónico</dt>
            <dd className="mt-1 font-semibold text-white">{user.email}</dd>
          </div>
        </dl>

        <p className="text-xs text-[#a99ec4]">
          La edición de nombre y teléfono se habilitará en la Fase 5.
        </p>
      </Card>
    </div>
  );
}
