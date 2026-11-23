"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/auth";
import { translateError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export type ProfileActionState = {
  error?: string;
  success?: string;
};

export async function updateCustomerProfileAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const { user, profile } = await getAuthContext();

  if (!user || !profile || profile.role !== "customer") {
    return { error: "No tienes permisos para editar este perfil." };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (fullName.length < 2) {
    return { error: "Ingresa tu nombre completo (mínimo 2 caracteres)." };
  }

  if (phone.length < 7) {
    return { error: "Ingresa un número de teléfono válido." };
  }

  const supabase = await createClient();

  // Por reglas de RLS, customer solo edita full_name y phone de su propio perfil
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone,
    })
    .eq("id", user.id);

  if (error) {
    return {
      error: translateError(
        error,
        "No pudimos guardar los cambios de tu perfil.",
      ),
    };
  }

  revalidatePath("/perfil");
  revalidatePath("/", "layout");
  return { success: "Perfil actualizado correctamente." };
}
