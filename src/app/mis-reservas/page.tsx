import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Mis reservas",
};

export default async function MisReservasPage() {
  const { profile } = await requireRole(["customer"], "/mis-reservas");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tu cuenta"
        title="Mis reservas"
        subtitle={`Hola, ${profile.full_name || "cliente"}. Aquí verás tus reservas próximas y pasadas.`}
      />

      <EmptyState
        icon="🗓️"
        title="Aún no tienes reservas"
        description="El flujo completo de reservas y cancelaciones se habilitará en la Fase 3."
        action={
          <Link
            href="/"
            className="bk-grad-shadow inline-flex h-11 items-center justify-center rounded-[14px] px-5 text-sm font-bold text-white"
          >
            Explorar negocios
          </Link>
        }
      />
    </div>
  );
}
