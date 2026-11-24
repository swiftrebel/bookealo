"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { logoutAction } from "@/actions/auth";
import { Artwork } from "@/components/ui/Artwork";
import {
  BookingsIcon,
  CalendarIcon,
  ClockIcon,
  GridIcon,
  HomeIcon,
  LogInIcon,
  LogOutIcon,
  ShieldIcon,
  UserIcon,
} from "@/components/ui/Icons";
import { formatPanamaDate, formatPanamaTime } from "@/lib/dates";
import type { ProfileRow } from "@/types/database";

export type NextBookingPreview = {
  id: string;
  businessId: string | null;
  businessName: string;
  businessCoverUrl: string | null;
  serviceName: string;
  startTime: string;
};

type AppShellProps = {
  userEmail: string | null;
  profile: ProfileRow | null;
  navBadgeCount?: number;
  nextBooking?: NextBookingPreview | null;
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: ReactNode;
  matchExact?: boolean;
  badgeCount?: number;
};

function isActivePath(
  pathname: string,
  href: string,
  matchExact?: boolean,
): boolean {
  if (matchExact || href === "/") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(
  fullName: string | null | undefined,
  email: string | null | undefined,
): string {
  const source = fullName?.trim() || email?.trim() || "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function AppShell({
  userEmail,
  profile,
  navBadgeCount = 0,
  nextBooking = null,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/registro";

  const role = profile?.role ?? null;
  const isAuthenticated = Boolean(userEmail && profile);

  const brandHref =
    role === "business_owner"
      ? "/panel"
      : role === "super_admin"
        ? "/admin"
        : "/";

  const desktopNavItems: NavItem[] = (() => {
    if (role === "business_owner") {
      return [
        {
          href: "/panel",
          label: "Reservas",
          shortLabel: "Reservas",
          icon: <CalendarIcon className="h-[22px] w-[22px]" />,
          matchExact: true,
          badgeCount: navBadgeCount,
        },
        {
          href: "/panel/servicios",
          label: "Servicios",
          shortLabel: "Servicios",
          icon: <GridIcon className="h-[22px] w-[22px]" />,
        },
        {
          href: "/panel/horarios",
          label: "Horarios",
          shortLabel: "Horarios",
          icon: <ClockIcon className="h-[22px] w-[22px]" />,
        },
        {
          href: "/",
          label: "Explorar",
          shortLabel: "Explorar",
          icon: <HomeIcon className="h-[22px] w-[22px]" />,
          matchExact: true,
        },
      ];
    }

    if (role === "super_admin") {
      return [
        {
          href: "/admin",
          label: "Administración",
          shortLabel: "Admin",
          icon: <ShieldIcon className="h-[22px] w-[22px]" />,
        },
        {
          href: "/",
          label: "Explorar",
          shortLabel: "Explorar",
          icon: <HomeIcon className="h-[22px] w-[22px]" />,
          matchExact: true,
        },
      ];
    }

    if (role === "customer") {
      return [
        {
          href: "/",
          label: "Inicio",
          shortLabel: "Inicio",
          icon: <HomeIcon className="h-[22px] w-[22px]" />,
          matchExact: true,
        },
        {
          href: "/mis-reservas",
          label: "Mis reservas",
          shortLabel: "Reservas",
          icon: <BookingsIcon className="h-[22px] w-[22px]" />,
          badgeCount: navBadgeCount,
        },
        {
          href: "/perfil",
          label: "Mi perfil",
          shortLabel: "Perfil",
          icon: <UserIcon className="h-[22px] w-[22px]" />,
        },
      ];
    }

    return [
      {
        href: "/",
        label: "Inicio",
        shortLabel: "Inicio",
        icon: <HomeIcon className="h-[22px] w-[22px]" />,
        matchExact: true,
      },
      {
        href: "/login",
        label: "Iniciar sesión",
        shortLabel: "Entrar",
        icon: <LogInIcon className="h-[22px] w-[22px]" />,
      },
    ];
  })();

  const mobileTabItems: NavItem[] =
    !isAuthenticated && role === null
      ? [
          ...desktopNavItems,
          {
            href: "/registro",
            label: "Crear cuenta",
            shortLabel: "Registro",
            icon: <UserIcon className="h-[22px] w-[22px]" />,
          },
        ]
      : desktopNavItems;

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-black text-[#f5f5f7]">
        <header className="bk-glass-nav sticky top-0 z-30 border-b border-white/10">
          <div className="mx-auto flex h-[56px] max-w-[1080px] items-center justify-between px-6 pt-[var(--sat)] min-[900px]:h-[60px] min-[900px]:px-10">
            <Link
              href="/"
              className="text-[19px] font-semibold tracking-[-0.03em] text-[#f5f5f7] min-[900px]:text-[20px]"
            >
              Bookealo
            </Link>
            <Link
              href="/"
              className="bk-tx text-[14px] text-[#86868b] hover:text-[#f5f5f7]"
            >
              Explorar
            </Link>
          </div>
        </header>

        <main className="mx-auto flex max-w-[440px] flex-col px-6 pb-[calc(48px+var(--sab))] pt-12 min-[900px]:pt-20">
          {children}
        </main>
      </div>
    );
  }

  const showMiniBar =
    role === "customer" &&
    Boolean(nextBooking) &&
    pathname !== "/mis-reservas";

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7]">
      {/* Barra superior glass sticky (escritorio y móvil) */}
      <header className="bk-glass-nav sticky top-0 z-30 border-b border-white/10 pt-[var(--sat)]">
        <div className="mx-auto flex h-[52px] max-w-[1080px] items-center justify-between gap-6 px-6 min-[900px]:h-[64px] min-[900px]:px-10">
          <Link
            href={brandHref}
            className="text-[19px] font-semibold tracking-[-0.03em] text-[#f5f5f7] min-[900px]:text-[20px]"
          >
            Bookealo
          </Link>

          {/* Enlaces centrales en escritorio */}
          <nav
            aria-label="Navegación principal"
            className="hidden items-center gap-9 text-[14px] min-[900px]:flex"
          >
            {desktopNavItems.map((item) => {
              const active = isActivePath(pathname, item.href, item.matchExact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 transition-colors duration-300 ${
                    active
                      ? "font-medium text-[#f5f5f7]"
                      : "text-[#86868b] hover:text-[#f5f5f7]"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badgeCount && item.badgeCount > 0 ? (
                    <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#1d7f45] px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white tabular-nums">
                      {item.badgeCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          {/* Acción derecha */}
          <div className="flex items-center gap-2.5">
            {isAuthenticated && profile ? (
              <>
                <Link
                  href={
                    profile.role === "customer"
                      ? "/perfil"
                      : profile.role === "business_owner"
                        ? "/panel"
                        : "/admin"
                  }
                  className="bk-tx inline-flex h-[34px] items-center gap-2 rounded-full border border-white/10 bg-[#161618] pl-1.5 pr-3 text-[13px] font-medium text-[#f5f5f7] hover:bg-[#1f1f22]"
                  aria-label="Mi cuenta"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-[11px] font-semibold text-[#f5f5f7]">
                    {getInitials(profile.full_name, userEmail)}
                  </span>
                  <span className="hidden max-w-[140px] truncate sm:inline">
                    {profile.full_name || userEmail}
                  </span>
                </Link>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    aria-label="Cerrar sesión"
                    title="Cerrar sesión"
                    className="bk-tx grid h-[34px] w-[34px] cursor-pointer place-items-center rounded-full border border-white/10 bg-[#161618] text-[#86868b] hover:bg-[#1f1f22] hover:text-[#f5f5f7]"
                  >
                    <LogOutIcon className="h-4 w-4" />
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/registro"
                className="bk-cta h-[34px] px-4 text-[14px] min-[900px]:h-[36px] min-[900px]:px-5"
              >
                Crear cuenta
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Contenido principal centrado (max-w-1080px editorial) */}
      <main
        className={`mx-auto max-w-[1080px] px-6 pt-10 min-[900px]:px-10 min-[900px]:pb-32 min-[900px]:pt-20 ${
          showMiniBar
            ? "pb-[calc(172px+var(--sab))]"
            : "pb-[calc(112px+var(--sab))]"
        }`}
      >
        {children}
      </main>

      {/* Mini barra flotante de próxima reserva (clientes) */}
      {showMiniBar && nextBooking && (
        <div className="fixed inset-x-4 bottom-[calc(var(--sab)+74px)] z-25 min-[900px]:bottom-7 min-[900px]:left-auto min-[900px]:right-7 min-[900px]:w-[360px]">
          <Link
            href="/mis-reservas"
            className="bk-glass bk-tx flex w-full items-center gap-3 rounded-[18px] py-2 pl-2 pr-4 shadow-[0_12px_36px_rgba(0,0,0,0.65)] hover:border-white/20"
          >
            <Artwork
              src={nextBooking.businessCoverUrl}
              alt={nextBooking.businessName}
              seed={nextBooking.businessId ?? nextBooking.id}
              size="sm"
              className="h-11 w-11 rounded-[12px]"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold tracking-[-0.01em] text-[#f5f5f7]">
                {nextBooking.businessName} · {nextBooking.serviceName}
              </p>
              <p className="truncate text-[12px] capitalize text-[#86868b] tabular-nums">
                Próxima · {formatPanamaDate(nextBooking.startTime)} ·{" "}
                {formatPanamaTime(nextBooking.startTime)}
              </p>
            </div>
            <span className="shrink-0 text-[13px] font-medium text-[#34c470]">
              Ver
            </span>
          </Link>
        </div>
      )}

      {/* Bottom tab bar móvil glass (< 900px) */}
      <nav
        aria-label="Navegación móvil"
        className="bk-glass fixed inset-x-0 bottom-0 z-30 flex border-x-0 border-b-0 px-2 pb-[calc(var(--sab)+10px)] pt-2.5 min-[900px]:hidden"
      >
        {mobileTabItems.map((item) => {
          const active = isActivePath(pathname, item.href, item.matchExact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center gap-[3px] py-1 text-[11px] font-medium transition-colors duration-300 active:opacity-60 ${
                active ? "text-[#f5f5f7]" : "text-[#86868b]"
              }`}
            >
              <span className="relative">
                {item.icon}
                {item.badgeCount && item.badgeCount > 0 ? (
                  <span className="absolute -right-2 -top-1 grid min-w-4 place-items-center rounded-full bg-[#1d7f45] px-1 text-[9px] font-semibold text-white tabular-nums">
                    {item.badgeCount}
                  </span>
                ) : null}
              </span>
              <span>{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
