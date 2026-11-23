import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import {
  getAuthContext,
  getRedirectPathByRole,
  sanitizeNextPath,
} from "@/lib/auth";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { user, profile } = await getAuthContext();
  if (user && profile) {
    redirect(getRedirectPathByRole(profile.role));
  }

  const resolvedSearchParams = await searchParams;
  const rawNext = Array.isArray(resolvedSearchParams.next)
    ? resolvedSearchParams.next[0]
    : resolvedSearchParams.next;
  const safeNext = sanitizeNextPath(rawNext);

  return <RegisterForm nextPath={safeNext} />;
}
