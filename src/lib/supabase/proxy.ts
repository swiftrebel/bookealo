import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database, UserRole } from "@/types/database";
import { getSupabaseEnv } from "./env";

const AUTH_ROUTES = ["/login", "/registro"];
const CUSTOMER_ROUTES = ["/mis-reservas", "/perfil"];
const OWNER_PREFIX = "/panel";
const ADMIN_PREFIX = "/admin";

function isPathOrChild(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

function getDefaultRouteForRole(role: UserRole): string {
  if (role === "business_owner") return "/panel";
  if (role === "super_admin") return "/admin";
  return "/";
}

function redirectWithCookies(
  url: URL,
  sourceResponse: NextResponse,
): NextResponse {
  const redirectResponse = NextResponse.redirect(url);
  sourceResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { url, publishableKey } = getSupabaseEnv();

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = AUTH_ROUTES.some((route) => isPathOrChild(pathname, route));
  const isCustomerRoute = CUSTOMER_ROUTES.some((route) =>
    isPathOrChild(pathname, route),
  );
  const isOwnerRoute = isPathOrChild(pathname, OWNER_PREFIX);
  const isAdminRoute = isPathOrChild(pathname, ADMIN_PREFIX);
  const isProtectedRoute = isCustomerRoute || isOwnerRoute || isAdminRoute;

  // 1. Usuario sin sesión intentando entrar a ruta protegida
  if (!user && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    const fullNext = `${pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("next", fullNext);
    return redirectWithCookies(loginUrl, supabaseResponse);
  }

  // 2. Usuario autenticado en rutas de auth o protegidas: verificar rol
  if (user && (isAuthRoute || isProtectedRoute)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role: UserRole = profile?.role ?? "customer";

    if (isAuthRoute) {
      return redirectWithCookies(
        new URL(getDefaultRouteForRole(role), request.url),
        supabaseResponse,
      );
    }

    if (isCustomerRoute && role !== "customer") {
      return redirectWithCookies(
        new URL(getDefaultRouteForRole(role), request.url),
        supabaseResponse,
      );
    }

    if (isOwnerRoute && role !== "business_owner") {
      return redirectWithCookies(
        new URL(getDefaultRouteForRole(role), request.url),
        supabaseResponse,
      );
    }

    if (isAdminRoute && role !== "super_admin") {
      return redirectWithCookies(
        new URL(getDefaultRouteForRole(role), request.url),
        supabaseResponse,
      );
    }
  }

  return supabaseResponse;
}
