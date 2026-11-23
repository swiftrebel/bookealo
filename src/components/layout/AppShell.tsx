"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { logoutAction } from "@/actions/auth";
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
import type { ProfileRow } from "@/types/database";

type AppShellProps = {
  userEmail: string | null;
  profile: ProfileRow | null;
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: ReactNode;
  matchExact?: boolean;
};

function isActivePath(pathname: string, href: string, matchExact?: boolean): boolean {
  if (matchExact || href === "/") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(fullName: string | null | undefined, email: string | null | undefined): string {
  const source = fullName?.trim() || email?.trim() || "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function getRoleBadgeText(role: ProfileRow["role"]): string {
  if (role === "business_owner") return "Dueño de negocio";
  if (role === "super_admin") return "Super Admin";
  return "Cliente";
}

export function AppShell({ userEmail, profile, children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/registro";

  const role = profile?.role ?? null;
  const isAuthenticated = Boolean(userEmail && profile);

  const navItems: NavItem[] = (() => {
    if (role === "business_owner") {
      return [
        {
          href: "/panel",
          label: "Reservas",
          shortLabel: "Reservas",
          icon: <CalendarIcon className="h-5 w-5" />,
          matchExact: true,
        },
        {
          href: "/panel/servicios",
          label: "Servicios",
          shortLabel: "Servicios",
          icon: <GridIcon className="h-5 w-5" />,
        },
        {
          href: "/panel/horarios",
          label: "Horarios",
          shortLabel: "Horarios",
          icon: <ClockIcon className="h-5 w-5" />,
        },
        {
          href: "/",
          label: "Explorar",
          shortLabel: "Explorar",
          icon: <HomeIcon className="h-5 w-5" />,
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
          icon: <ShieldIcon className="h-5 w-5" />,
        },
        {
          href: "/",
          label: "Explorar",
          shortLabel: "Explorar",
          icon: <HomeIcon className="h-5 w-5" />,
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
          icon: <HomeIcon className="h-5 w-5" />,
          matchExact: true,
        },
        {
          href: "/mis-reservas",
          label: "Mis reservas",
          shortLabel: "Reservas",
          icon: <BookingsIcon className="h-5 w-5" />,
        },
        {
          href: "/perfil",
          label: "Mi perfil",
          shortLabel: "Perfil",
          icon: <UserIcon className="h-5 w-5" />,
        },
      ];
    }

    return [
      {
        href: "/",
        label: "Inicio",
        shortLabel: "Inicio",
        icon: <HomeIcon className="h-5 w-5" />,
        matchExact: true,
      },
      {
        href: "/login",
        label: "Iniciar sesión",
        shortLabel: "Entrar",
        icon: <LogInIcon className="h-5 w-5" />,
      },
      {
        href: "/registro",
        label: "Crear cuenta",
        shortLabel: "Registro",
        icon: <UserIcon className="h-5 w-5" />,
      },
    ];
  })();

  if (isAuthPage) {
    return (
      <div className="min-h-screen px-5 pb-[calc(32px+var(--sab))] pt-[calc(24px+var(--sat))]">
        <div className="mx-auto flex max-w-md flex-col">
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-[22px] font-extrabold tracking-[-0.03em] text-white"
            >
              <span className="bk-grad grid h-9 w-9 place-items-center rounded-[10px] text-lg font-bold text-white shadow-[0_8px_20px_rgba(255,45,149,0.3)]">
                ◐
              </span>
              Bookealo
            </Link>
            <Link
              href="/"
              className="text-sm font-semibold text-[#a99ec4] transition hover:text-white"
            >
              Explorar
            </Link>
          </div>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Sidebar escritorio (>= 900px), fiel a #side en design-reference */}
      <aside className="bk-sidebar fixed inset-y-0 left-0 z-25 hidden w-[264px] flex-col border-r border-white/10 px-4 py-7 min-[900px]:flex">
        <Link
          href={role === "business_owner" ? "/panel" : role === "super_admin" ? "/admin" : "/"}
          className="mx-2 mb-6 flex items-center gap-2.5 text-[22px] font-extrabold tracking-[-0.03em] text-white"
        >
          <span className="bk-grad grid h-[34px] w-[34px] place-items-center rounded-[10px] text-lg font-bold text-white shadow-[0_8px_20px_rgba(255,45,149,0.3)]">
            ◐
          </span>
          Bookealo
        </Link>

        <nav className="flex flex-1 flex-col gap-1" aria-label="Navegación principal">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href, item.matchExact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[15px] font-semibold transition ${
                  active
                    ? "bk-grad text-white shadow-[0_8px_22px_rgba(255,45,149,0.3)]"
                    : "text-[#d9d0ee] hover:bg-white/[0.07] hover:text-white"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 border-t border-white/10 pt-4">
          {isAuthenticated && profile ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-2">
                <div className="bk-grad grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white">
                  {getInitials(profile.full_name, userEmail)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">
                    {profile.full_name || userEmail}
                  </p>
                  <p className="truncate text-xs text-[#a99ec4]">
                    {getRoleBadgeText(profile.role)}
                  </p>
                </div>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-[12px] px-3 py-2 text-sm font-semibold text-[#a99ec4] transition hover:bg-white/[0.07] hover:text-white"
                >
                  <LogOutIcon className="h-4 w-4" />
                  <span>Cerrar sesión</span>
                </button>
              </form>
            </div>
          ) : (
            <p className="px-2 text-xs text-[#a99ec4]">
              Inicia sesión para reservar tus horarios favoritos en Panamá.
            </p>
          )}
        </div>
      </aside>

      {/* Barra superior móvil compacta */}
      <header className="bk-glass sticky top-0 z-20 flex items-center justify-between border-b border-white/10 px-5 pb-3 pt-[calc(var(--sat)+10px)] min-[900px]:hidden">
        <Link
          href={role === "business_owner" ? "/panel" : role === "super_admin" ? "/admin" : "/"}
          className="flex items-center gap-2 text-lg font-extrabold tracking-[-0.03em] text-white"
        >
          <span className="bk-grad grid h-7 w-7 place-items-center rounded-[8px] text-sm font-bold text-white">
            ◐
          </span>
          Bookealo
        </Link>

        {isAuthenticated && profile ? (
          <div className="flex items-center gap-2">
            <Link
              href={
                profile.role === "customer"
                  ? "/perfil"
                  : profile.role === "business_owner"
                    ? "/panel"
                    : "/admin"
              }
              className="bk-grad grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white"
              aria-label="Mi cuenta"
            >
              {getInitials(profile.full_name, userEmail)}
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                aria-label="Cerrar sesión"
                className="grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-white/10 bg-white/[0.07] text-[#a99ec4] transition hover:text-white"
              >
                <LogOutIcon className="h-4 w-4" />
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/login"
            className="bk-grad rounded-full px-3.5 py-1.5 text-xs font-bold text-white"
          >
            Entrar
          </Link>
        )}
      </header>

      {/* Contenido principal */}
      <main className="min-h-screen px-5 pb-[calc(112px+var(--sab))] pt-6 min-[900px]:ml-[264px] min-[900px]:px-14 min-[900px]:pb-24 min-[900px]:pt-12">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>

      {/* Bottom tab bar móvil (< 900px), fiel a #tabs en design-reference */}
      <nav
        aria-label="Navegación móvil"
        className="bk-glass fixed inset-x-0 bottom-0 z-20 flex border-t border-white/10 pb-[calc(var(--sab)+6px)] pt-2 min-[900px]:hidden"
      >
        {navItems.map((item) => {
          const active = isActivePath(pathname, item.href, item.matchExact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 text-[10px] font-semibold transition ${
                active ? "text-[#ff3b6b]" : "text-[#a99ec4]"
              }`}
            >
              {item.icon}
              <span>{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
