"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Artwork, getGradientForSeed } from "@/components/ui/Artwork";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MapPinIcon, SearchIcon } from "@/components/ui/Icons";
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

function setAmbientColor(seed: string) {
  if (typeof document === "undefined") return;
  const [primary] = getGradientForSeed(seed);
  document.body.style.setProperty("--amb", primary);
}

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
  const featured = !hasActiveFilter && filteredBusinesses.length > 0 ? filteredBusinesses[0] : null;

  if (businesses.length === 0) {
    return (
      <EmptyState
        icon="🏟️"
        title="Todavía no hay negocios disponibles"
        description="Pronto verás canchas y servicios activos disponibles para reservar en Panamá."
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Buscador sticky + pills de zona fieles a .sb y .pills de la maqueta */}
      <div className="space-y-3">
        <div className="sticky top-[calc(var(--sat)+62px)] z-10 min-[900px]:static">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a99ec4]" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar negocios, zonas o amenidades…"
              aria-label="Buscar negocios"
              autoComplete="off"
              className="bk-glass h-11 w-full rounded-[14px] border border-white/10 pl-11 pr-4 text-[15px] text-white placeholder-[#a99ec4]/80 outline-none transition focus:border-[#ff3b6b]"
            />
          </div>
        </div>

        {zones.length > 0 && (
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 min-[900px]:mx-0 min-[900px]:px-0">
            <button
              type="button"
              onClick={() => setSelectedZone(null)}
              className={`shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition ${
                selectedZone === null
                  ? "bk-grad border-transparent text-white shadow-[0_6px_18px_rgba(255,45,149,0.28)]"
                  : "border-white/10 bg-white/[0.07] text-[#d9d0ee] hover:bg-white/[0.12]"
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
                  className={`shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bk-grad border-transparent text-white shadow-[0_6px_18px_rgba(255,45,149,0.28)]"
                      : "border-white/10 bg-white/[0.07] text-[#d9d0ee] hover:bg-white/[0.12]"
                  }`}
                >
                  {zone}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Hero destacado (solo cuando no hay filtro/búsqueda activa), fiel a .hero */}
      {featured && (
        <section aria-label="Negocio destacado">
          <Link
            href={`/negocios/${featured.id}`}
            onMouseEnter={() => setAmbientColor(featured.id)}
            className="group relative block h-[340px] w-full overflow-hidden rounded-[24px] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.45)] min-[900px]:h-[380px]"
          >
            <Artwork
              src={featured.cover_image_url}
              alt={featured.name}
              seed={featured.id}
              size="hero"
              className="rounded-none border-0 transition duration-500 group-hover:scale-[1.03]"
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0612]/90 via-[#0a0612]/35 to-transparent min-[900px]:bg-gradient-to-r min-[900px]:from-[#0a0612]/88 min-[900px]:via-[#0a0612]/45 min-[900px]:to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-5 backdrop-blur-md min-[900px]:bottom-10 min-[900px]:left-10 min-[900px]:right-auto min-[900px]:max-w-lg min-[900px]:bg-transparent min-[900px]:p-0 min-[900px]:backdrop-blur-none">
              <span className="text-[11px] font-bold uppercase tracking-widest text-white/80">
                Destacado en Bookealo
              </span>
              <h2 className="mt-1 text-3xl font-extrabold leading-[1.05] tracking-[-0.03em] text-white min-[900px]:text-[44px]">
                {featured.name}
              </h2>

              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-sm text-white/85">
                {featured.zone && (
                  <span className="inline-flex items-center gap-1">
                    <MapPinIcon className="h-4 w-4 text-[#ff5e7e]" />
                    {featured.zone}
                  </span>
                )}
                {featured.minPrice !== null && (
                  <span>· Desde {formatUSD(featured.minPrice)}</span>
                )}
                {featured.serviceCount > 0 && (
                  <span>
                    · {featured.serviceCount}{" "}
                    {featured.serviceCount === 1 ? "servicio" : "servicios"}
                  </span>
                )}
              </div>

              {featured.amenities.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {featured.amenities.slice(0, 3).map((item) => (
                    <Badge key={item} tone="neutral" className="bg-black/35">
                      {item}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="mt-4">
                <span className="bk-grad-shadow inline-flex h-10 items-center rounded-full px-5 text-sm font-bold text-white transition group-hover:brightness-110">
                  Ver servicios y horarios
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Resultados / Grid de negocios activos */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-white">
            {hasActiveFilter ? "Resultados" : "Negocios disponibles"}
          </h2>
          <span className="text-xs font-semibold text-[#a99ec4]">
            {filteredBusinesses.length}{" "}
            {filteredBusinesses.length === 1 ? "negocio" : "negocios"}
          </span>
        </div>

        {filteredBusinesses.length === 0 ? (
          <EmptyState
            icon="🔍"
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
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 min-[900px]:grid-cols-[repeat(auto-fill,minmax(195px,1fr))] min-[900px]:gap-x-5 min-[900px]:gap-y-7">
            {filteredBusinesses.map((business) => (
              <Link
                key={business.id}
                href={`/negocios/${business.id}`}
                onMouseEnter={() => setAmbientColor(business.id)}
                className="group block text-left"
              >
                <Artwork
                  src={business.cover_image_url}
                  alt={business.name}
                  seed={business.id}
                  size="card"
                  showHoverBadge
                />
                <h3 className="mt-2.5 truncate text-[15px] font-semibold text-white">
                  {business.name}
                </h3>
                <p className="mt-0.5 truncate text-[13px] text-[#a99ec4]">
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
    </div>
  );
}
