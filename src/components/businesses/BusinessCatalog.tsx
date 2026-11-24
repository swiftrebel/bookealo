"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Artwork } from "@/components/ui/Artwork";
import { Button } from "@/components/ui/Button";
import { SearchIcon } from "@/components/ui/Icons";
import { EmptyState } from "@/components/ui/States";
import { formatUSD } from "@/lib/currency";

export type CatalogBusiness = {
  id: string;
  name: string;
  zone: string | null;
  cover_image_url: string | null;
  amenities: string[];
  minPrice: number | null;
  serviceCount: number;
};

type BusinessCatalogProps = {
  businesses: CatalogBusiness[];
};

export function BusinessCatalog({ businesses }: BusinessCatalogProps) {
  const [query, setQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const zones = useMemo(() => {
    const unique = new Set<string>();
    businesses.forEach((b) => {
      const z = b.zone?.trim();
      if (z) unique.add(z);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, "es"));
  }, [businesses]);

  const filteredBusinesses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return businesses.filter((b) => {
      if (selectedZone && (b.zone?.trim() ?? "") !== selectedZone) {
        return false;
      }
      if (!normalizedQuery) return true;
      const haystack = [b.name, b.zone ?? "", ...b.amenities]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [businesses, query, selectedZone]);

  const hasActiveFilter = Boolean(query.trim() || selectedZone);
  const featured =
    !hasActiveFilter && filteredBusinesses.length > 0
      ? filteredBusinesses[0]
      : null;

  return (
    <div className="space-y-16 min-[900px]:space-y-24">
      {/* Hero editorial + Buscador + Chips de zona */}
      <section className="bk-rise">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[rgba(245,245,247,0.44)]">
          Reservas en Panamá
        </p>
        <h1 className="max-w-2xl text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] text-[#f5f5f7] min-[900px]:text-[56px] min-[900px]:leading-[1.04] min-[900px]:tracking-[-0.038em]">
          Encuentra tu cancha ideal
        </h1>
        <p className="mt-4 max-w-[520px] text-[17px] leading-[1.47] text-[#86868b]">
          Reserva canchas y servicios por horario en Panamá.
        </p>

        {businesses.length > 0 && (
          <div className="mt-9 space-y-4 min-[900px]:mt-10">
            <div className="relative max-w-[580px]">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868b]" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar canchas, clubes o amenidades…"
                aria-label="Buscar negocios"
                autoComplete="off"
                className="h-[48px] w-full rounded-[14px] border border-white/[0.09] bg-[#1a1a1c] pl-11 pr-4 text-[16px] text-[#f5f5f7] placeholder-[#86868b] outline-none transition duration-300 focus:border-white/25 focus:bg-[#222225] min-[900px]:h-[50px]"
              />
            </div>

            {zones.length > 0 && (
              <div className="no-scrollbar -mx-6 flex flex-nowrap gap-2 overflow-x-auto px-6 pb-1 min-[900px]:mx-0 min-[900px]:flex-wrap min-[900px]:px-0">
                <button
                  type="button"
                  onClick={() => setSelectedZone(null)}
                  className={`bk-tx h-[34px] shrink-0 cursor-pointer rounded-full border px-4 text-[13px] font-medium min-[900px]:text-[13px] ${
                    selectedZone === null
                      ? "border-transparent bg-[#f5f5f7] text-black"
                      : "border-white/[0.09] bg-[#1a1a1c] text-[#86868b] hover:bg-[#222225] hover:text-[#f5f5f7]/80"
                  }`}
                >
                  Todas las zonas
                </button>
                {zones.map((zone) => {
                  const active = selectedZone === zone;
                  return (
                    <button
                      key={zone}
                      type="button"
                      onClick={() => setSelectedZone(active ? null : zone)}
                      className={`bk-tx h-[34px] shrink-0 cursor-pointer rounded-full border px-4 text-[13px] font-medium ${
                        active
                          ? "border-transparent bg-[#f5f5f7] text-black"
                          : "border-white/[0.09] bg-[#1a1a1c] text-[#86868b] hover:bg-[#222225] hover:text-[#f5f5f7]/80"
                      }`}
                    >
                      {zone}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {businesses.length === 0 ? (
        <EmptyState
          icon={<SearchIcon className="h-5 w-5" />}
          title="Todavía no hay negocios disponibles"
          description="Pronto verás canchas y servicios activos disponibles para reservar en Panamá."
        />
      ) : (
        <>
          {/* Hero destacado (cuando no hay filtro activo) */}
          {featured && (
            <section
              aria-label="Negocio destacado"
              className="bk-rise"
              style={{ animationDelay: "120ms" }}
            >
              <Link
                href={`/negocios/${featured.id}`}
                className="group bk-tx relative block h-[420px] w-full overflow-hidden rounded-[24px] min-[900px]:h-[460px]"
              >
                <Artwork
                  src={featured.cover_image_url}
                  alt={featured.name}
                  seed={featured.id}
                  size="hero"
                  className="rounded-none"
                />

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.52)_0%,rgba(0,0,0,0)_42%,rgba(0,0,0,0.48)_100%)]"
                />

                <div className="absolute inset-0 flex flex-col justify-between p-7 min-[900px]:p-11">
                  <div className="max-w-[460px]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/60">
                      Destacado en Bookealo
                    </p>
                    <h2 className="mt-2 text-[30px] font-semibold leading-[1.06] tracking-[-0.032em] text-white min-[900px]:text-[46px]">
                      {featured.name}
                    </h2>
                    <p className="mt-2.5 text-[15px] text-white/75 min-[900px]:text-[17px]">
                      {[
                        featured.zone,
                        featured.minPrice !== null
                          ? `Desde ${formatUSD(featured.minPrice)}`
                          : null,
                        featured.serviceCount > 0
                          ? `${featured.serviceCount} ${featured.serviceCount === 1 ? "servicio" : "servicios"}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>

                  <div className="flex flex-col items-start justify-between gap-3.5 min-[900px]:flex-row min-[900px]:items-center">
                    {featured.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2 min-[900px]:order-2">
                        {featured.amenities.slice(0, 3).map((item) => (
                          <span
                            key={item}
                            className="bk-glass rounded-full px-3.5 py-1.5 text-[12px] font-medium text-white/85 min-[900px]:text-[13px]"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    )}

                    <span className="bk-cta h-[42px] px-5 text-[14px] min-[900px]:order-1 min-[900px]:h-[44px] min-[900px]:px-6 min-[900px]:text-[15px]">
                      Ver servicios y horarios
                    </span>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {/* Grid de negocios */}
          <section
            aria-label="Negocios disponibles"
            className="bk-rise"
            style={{ animationDelay: "180ms" }}
          >
            <div className="mb-8 flex items-baseline justify-between gap-4 min-[900px]:mb-9">
              <h2 className="text-[26px] font-semibold leading-[1.1] tracking-[-0.03em] text-[#f5f5f7] min-[900px]:text-[36px]">
                {hasActiveFilter ? "Resultados" : "Todos los negocios"}
              </h2>
              <span className="text-[13px] text-[#86868b] tabular-nums">
                {filteredBusinesses.length}{" "}
                {filteredBusinesses.length === 1 ? "negocio" : "negocios"}
              </span>
            </div>

            {filteredBusinesses.length === 0 ? (
              <EmptyState
                icon={<SearchIcon className="h-5 w-5" />}
                title={
                  query.trim()
                    ? `Sin resultados para “${query.trim()}”`
                    : "No hay negocios en esta zona"
                }
                description="Prueba con otro término de búsqueda o selecciona otra zona."
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setQuery("");
                      setSelectedZone(null);
                    }}
                  >
                    Limpiar filtros
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 min-[900px]:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] min-[900px]:gap-x-6 min-[900px]:gap-y-12">
                {filteredBusinesses.map((business) => (
                  <Link
                    key={business.id}
                    href={`/negocios/${business.id}`}
                    className="group block text-left"
                  >
                    <Artwork
                      src={business.cover_image_url}
                      alt={business.name}
                      seed={business.id}
                      size="card"
                    />
                    <h3 className="mt-3 truncate text-[15px] font-semibold tracking-[-0.015em] text-[#f5f5f7] min-[900px]:text-[17px]">
                      {business.name}
                    </h3>
                    <p className="mt-0.5 truncate text-[13px] text-[#86868b] tabular-nums">
                      {[
                        business.zone || "Panamá",
                        business.minPrice !== null
                          ? `Desde ${formatUSD(business.minPrice)}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
