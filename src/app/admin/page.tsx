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

      <Card className="max-w-2xl rounded-[24px] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-[#1a1a1c] text-[#34c470]">
            <ShieldIcon className="h-6 w-6" />
          </div>
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[#f5f5f7]">
                Usa el panel de Supabase para administrar
              </h2>
              <Badge tone="confirmed">super_admin</Badge>
            </div>
            <p className="text-[14px] leading-relaxed text-[#86868b]">
              En el MVP de Bookealo, la creación de negocios, asignación de
              dueños y cambio de roles se realiza directamente desde el panel de
              Supabase.
            </p>
            <p className="text-[12px] text-[rgba(245,245,247,0.44)]">
              Sesión activa: {profile.full_name || user.email} ({user.email})
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="bk-tx inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-[#1a1a1c] px-6 text-[14px] font-medium text-[#f5f5f7] hover:bg-[#222225]"
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
