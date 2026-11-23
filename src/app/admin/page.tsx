import type { Metadata } from "next";
import Link from "next/link";
import { logoutAction } from "@/actions/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ShieldIcon } from "@/components/ui/Icons";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Administración",
};

export default async function AdminPage() {
  const { user, profile } = await requireRole(["super_admin"], "/admin");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Administración de Bookealo"
        subtitle="Gestión centralizada desde el panel de Supabase."
      />

      <Card variant="surface" className="max-w-2xl rounded-[24px] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="bk-grad grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-[0_8px_22px_rgba(255,45,149,0.3)]">
            <ShieldIcon className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-[-0.02em] text-white">
                Usa el panel de Supabase para administrar
              </h2>
              <Badge tone="accent">super_admin</Badge>
            </div>
            <p className="text-sm leading-relaxed text-[#a99ec4]">
              En el MVP de Bookealo, la creación de negocios, asignación de
              dueños y cambio de roles se realiza directamente desde el panel de
              Supabase.
            </p>
            <p className="text-xs text-[#a99ec4]/80">
              Sesión activa: {profile.full_name || user.email} ({user.email})
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.07] px-5 text-sm font-bold text-white transition hover:bg-white/[0.12]"
          >
            Ver negocios públicos
          </Link>
          <form action={logoutAction}>
            <Button type="submit" variant="danger">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
