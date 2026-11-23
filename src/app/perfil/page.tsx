import type { Metadata } from "next";
import { logoutAction } from "@/actions/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
        subtitle="Mantén actualizados tu nombre y teléfono para tus reservas."
        action={<Badge tone="info">Cliente</Badge>}
      />

      <ProfileForm
        initialFullName={profile.full_name ?? ""}
        initialPhone={profile.phone ?? ""}
        email={user.email ?? ""}
      />

      <Card className="flex max-w-xl flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-bold text-white">Cerrar sesión</p>
          <p className="text-xs text-[#a99ec4]">
            Sal de tu cuenta en este dispositivo.
          </p>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="danger" size="sm">
            Cerrar sesión
          </Button>
        </form>
      </Card>
    </div>
  );
}
