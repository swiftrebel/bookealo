import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { parseAmenities } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function TestSupabasePage() {
  const supabase = await createClient();

  const { data: businesses, error } = await supabase
    .from("businesses")
    .select(
      "id, name, zone, phone, maps_url, cover_image_url, amenities, cancellation_policy, is_active",
    )
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  return (
    <main className="min-h-screen bg-[#0a0612] text-white px-5 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#ff3b6b]">
              Fase 0 · Verificación de Supabase
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
              Negocios activos
            </h1>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#a99ec4] transition hover:bg-white/10 hover:text-white"
          >
            Volver al inicio
          </Link>
        </div>

        {error ? (
          <div className="rounded-2xl border border-[#ff3b6b]/40 bg-[#ff3b6b]/10 p-5">
            <p className="font-semibold text-[#ff5e7e]">
              No se pudo consultar la tabla de negocios.
            </p>
            <p className="mt-1 text-sm text-[#a99ec4]">
              Revisa tu conexión a Supabase y las variables de entorno en{" "}
              <code>.env.local</code>.
            </p>
          </div>
        ) : !businesses || businesses.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-lg font-semibold">
              Conexión exitosa, sin negocios activos todavía
            </p>
            <p className="mt-1 text-sm text-[#a99ec4]">
              La consulta a Supabase respondió correctamente pero no devolvió
              negocios activos.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[#a99ec4]">
              Conexión verificada correctamente. Se encontraron{" "}
              <strong className="text-white">{businesses.length}</strong>{" "}
              negocio(s) activo(s):
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {businesses.map((business) => {
                const amenities = parseAmenities(business.amenities);
                return (
                  <article
                    key={business.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.07] p-5"
                  >
                    <h2 className="text-xl font-bold">{business.name}</h2>
                    {business.zone && (
                      <p className="mt-1 text-sm text-[#a99ec4]">
                        Zona: {business.zone}
                      </p>
                    )}
                    {business.phone && (
                      <p className="mt-1 text-sm text-[#a99ec4]">
                        Teléfono: {business.phone}
                      </p>
                    )}
                    {amenities.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {amenities.map((item) => (
                          <span
                            key={item}
                            className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/90"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
