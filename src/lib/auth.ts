import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow, UserRole } from "@/types/database";

export type AuthUser = {
  id: string;
  email: string | null;
};

export type AuthContext = {
  user: AuthUser | null;
  profile: ProfileRow | null;
};

export function getRedirectPathByRole(role: UserRole): string {
  switch (role) {
    case "business_owner":
      return "/panel";
    case "super_admin":
      return "/admin";
    case "customer":
    default:
      return "/";
  }
}

export function sanitizeNextPath(next: string | null | undefined): string | null {
  if (!next) return null;
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }
  if (trimmed.startsWith("/login") || trimmed.startsWith("/registro")) {
    return null;
  }
  return trimmed;
}

export function getPostAuthRedirect(role: UserRole, next: string | null | undefined): string {
  const safeNext = sanitizeNextPath(next);

  if (role === "super_admin") {
    return "/admin";
  }

  if (role === "business_owner") {
    if (safeNext && (safeNext.startsWith("/panel") || safeNext.startsWith("/negocios"))) {
      return safeNext;
    }
    return "/panel";
  }

  // customer
  if (safeNext && !safeNext.startsWith("/panel") && !safeNext.startsWith("/admin")) {
    return safeNext;
  }
  return "/";
}

export async function getAuthContext(): Promise<AuthContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, created_at")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user: { id: user.id, email: user.email ?? null },
    profile: profile ?? null,
  };
}

export async function requireRole(
  allowedRoles: UserRole[],
  currentPath?: string,
): Promise<{ user: AuthUser; profile: ProfileRow }> {
  const { user, profile } = await getAuthContext();

  if (!user || !profile) {
    const loginUrl = currentPath
      ? `/login?next=${encodeURIComponent(currentPath)}`
      : "/login";
    redirect(loginUrl);
  }

  if (!allowedRoles.includes(profile.role)) {
    redirect(getRedirectPathByRole(profile.role));
  }

  return { user, profile };
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case "business_owner":
      return "Dueño de negocio";
    case "super_admin":
      return "Administrador";
    case "customer":
    default:
      return "Cliente";
  }
}

export function getUserInitials(fullName: string | null | undefined, email: string | null | undefined): string {
  const source = fullName?.trim() || email?.trim() || "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
