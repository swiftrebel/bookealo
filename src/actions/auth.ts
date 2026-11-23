"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPostAuthRedirect } from "@/lib/auth";
import { translateError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export type AuthActionState = {
  error?: string;
  success?: string;
};

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "").trim() || null;

  if (!email || !password) {
    return { error: "Ingresa tu correo electrónico y contraseña." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return {
      error: translateError(error, "No pudimos iniciar sesión. Verifica tus credenciales."),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  const role: UserRole = profile?.role ?? "customer";

  revalidatePath("/", "layout");
  redirect(getPostAuthRedirect(role, next));
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");
  const next = String(formData.get("next") ?? "").trim() || null;

  if (fullName.length < 2) {
    return { error: "Ingresa tu nombre completo." };
  }
  if (phone.length < 7) {
    return { error: "Ingresa un número de teléfono válido." };
  }
  if (!email || !email.includes("@")) {
    return { error: "Ingresa un correo electrónico válido." };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }
  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
      },
    },
  });

  if (error) {
    return {
      error: translateError(error, "No pudimos crear tu cuenta. Intenta nuevamente."),
    };
  }

  if (!data.session) {
    return {
      success:
        "Cuenta creada correctamente. Revisa tu correo electrónico para confirmar tu cuenta e iniciar sesión.",
    };
  }

  const role: UserRole = "customer";
  revalidatePath("/", "layout");
  redirect(getPostAuthRedirect(role, next));
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
