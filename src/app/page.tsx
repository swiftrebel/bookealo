import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getAuthContext, getRoleLabel } from "@/lib/auth";

export default async function HomePage() {
  const { user, profile } = await getAuthContext();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Inicio"
        subtitle="Reserva canchas y servicios por horario en Panamá."
      />

      <section
        className="relative overflow-hidden rounded-[24px] border border-white/15 p-7 shadow-[0_20px_50px_rgba(0,0,0,0.45)] sm:p-10"
        style={{
          background:
            "radial-gradient(circle at 80% 10%, rgba(255,255,255,0.28), transparent 50%), linear-gradient(150deg, #ff5e7e, #4a1a7a)",
        }}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-white/80">
          Bookealo · Panamá
        </p>
        <h2 className="mt-2 max-w-xl text-3xl font-extrabold leading-[1.08] tracking-[-0.03em] text-white sm:text-4xl">
          Encuentra tu horario ideal y reserva en segundos.
        </h2>
        <p className="mt-3 max-w-lg text-sm text-white/85 sm:text-base">
          En la Fase 2 mostraremos aquí el catálogo de negocios activos con
          búsqueda y filtro por zona.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {!user ? (
            <>
              <Link
                href="/registro"
                className="inline-flex h-11 items-center justify-center rounded-[14px] bg-white px-6 text-sm font-extrabold text-[#130a22] transition hover:bg-white/90"
              >
                Crear cuenta
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-[14px] border border-white/25 bg-black/25 px-6 text-sm font-bold text-white backdrop-blur-md transition hover:bg-black/40"
              >
                Iniciar sesión
              </Link>
            </>
          ) : profile?.role === "business_owner" ? (
            <Link
              href="/panel"
              className="inline-flex h-11 items-center justify-center rounded-[14px] bg-white px-6 text-sm font-extrabold text-[#130a22] transition hover:bg-white/90"
            >
              Ir a mi panel
            </Link>
          ) : profile?.role === "super_admin" ? (
            <Link
              href="/admin"
              className="inline-flex h-11 items-center justify-center rounded-[14px] bg-white px-6 text-sm font-extrabold text-[#130a22] transition hover:bg-white/90"
            >
              Ir a Administración
            </Link>
          ) : (
            <Link
              href="/mis-reservas"
              className="inline-flex h-11 items-center justify-center rounded-[14px] bg-white px-6 text-sm font-extrabold text-[#130a22] transition hover:bg-white/90"
            >
              Ver mis reservas
            </Link>
          )}
        </div>
      </section>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-white">Estado de sesión</p>
            <p className="mt-1 text-sm text-[#a99ec4]">
              {user && profile
                ? `Conectado como ${profile.full_name || user.email} (${user.email})`
                : "Navegando como invitado (sin sesión activa)."}
            </p>
          </div>
          {profile ? (
            <Badge tone="accent">{getRoleLabel(profile.role)}</Badge>
          ) : (
            <Badge tone="neutral">Invitado</Badge>
          )}
        </div>
      </Card>
    </div>
  );
}
