"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/auth";
import { translateError } from "@/lib/errors";
import { getOwnerBusinessAndServices } from "@/lib/owner";
import { createClient } from "@/lib/supabase/server";

export type ServiceMutationInput = {
  name: string;
  price: number;
  slotDurationMinutes: number;
  isRoofed: boolean;
  isActive: boolean;
};

export type ServiceActionResult =
  | { ok: true; serviceId?: string }
  | { ok: false; error: string };

function validateServiceInput(input: ServiceMutationInput): string | null {
  const name = input.name.trim();
  if (name.length < 2) {
    return "El nombre del servicio debe tener al menos 2 caracteres.";
  }
  if (name.length > 80) {
    return "El nombre del servicio es demasiado largo (máximo 80 caracteres).";
  }
  if (!Number.isFinite(input.price) || input.price < 0) {
    return "Ingresa un precio válido en USD (0 o mayor).";
  }
  if (
    !Number.isInteger(input.slotDurationMinutes) ||
    input.slotDurationMinutes < 15 ||
    input.slotDurationMinutes > 480
  ) {
    return "La duración del turno debe ser un número entero entre 15 y 480 minutos.";
  }
  return null;
}

function revalidateServicePaths(businessId: string) {
  revalidatePath("/panel/servicios");
  revalidatePath("/panel/horarios");
  revalidatePath("/panel");
  revalidatePath("/");
  revalidatePath(`/negocios/${businessId}`);
}

export async function createServiceAction(
  input: ServiceMutationInput,
): Promise<ServiceActionResult> {
  const { user, profile } = await getAuthContext();
  if (!user || !profile || profile.role !== "business_owner") {
    return { ok: false, error: "No tienes permisos para crear servicios." };
  }

  const validationError = validateServiceInput(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const { business, error: ownerError } = await getOwnerBusinessAndServices(
    user.id,
  );
  if (ownerError || !business) {
    return {
      ok: false,
      error: "No encontramos un negocio asignado a tu cuenta.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .insert({
      business_id: business.id,
      name: input.name.trim(),
      price: Math.round(input.price * 100) / 100,
      slot_duration_minutes: input.slotDurationMinutes,
      is_roofed: input.isRoofed,
      is_active: input.isActive,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: translateError(error, "No pudimos crear el servicio."),
    };
  }

  revalidateServicePaths(business.id);
  return { ok: true, serviceId: data.id };
}

export async function updateServiceAction(
  serviceId: string,
  input: ServiceMutationInput,
): Promise<ServiceActionResult> {
  const { user, profile } = await getAuthContext();
  if (!user || !profile || profile.role !== "business_owner") {
    return { ok: false, error: "No tienes permisos para editar servicios." };
  }

  const validationError = validateServiceInput(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const { business, services, error: ownerError } =
    await getOwnerBusinessAndServices(user.id);
  if (ownerError || !business) {
    return {
      ok: false,
      error: "No encontramos un negocio asignado a tu cuenta.",
    };
  }

  if (!services.some((s) => s.id === serviceId)) {
    return { ok: false, error: "Este servicio no pertenece a tu negocio." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({
      name: input.name.trim(),
      price: Math.round(input.price * 100) / 100,
      slot_duration_minutes: input.slotDurationMinutes,
      is_roofed: input.isRoofed,
      is_active: input.isActive,
    })
    .eq("id", serviceId)
    .eq("business_id", business.id);

  if (error) {
    return {
      ok: false,
      error: translateError(error, "No pudimos guardar los cambios del servicio."),
    };
  }

  revalidateServicePaths(business.id);
  return { ok: true, serviceId };
}

export async function toggleServiceActiveAction(
  serviceId: string,
  isActive: boolean,
): Promise<ServiceActionResult> {
  const { user, profile } = await getAuthContext();
  if (!user || !profile || profile.role !== "business_owner") {
    return { ok: false, error: "No tienes permisos para modificar este servicio." };
  }

  const { business, services, error: ownerError } =
    await getOwnerBusinessAndServices(user.id);
  if (ownerError || !business) {
    return {
      ok: false,
      error: "No encontramos un negocio asignado a tu cuenta.",
    };
  }

  if (!services.some((s) => s.id === serviceId)) {
    return { ok: false, error: "Este servicio no pertenece a tu negocio." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({ is_active: isActive })
    .eq("id", serviceId)
    .eq("business_id", business.id);

  if (error) {
    return {
      ok: false,
      error: translateError(error, "No pudimos actualizar el estado del servicio."),
    };
  }

  revalidateServicePaths(business.id);
  return { ok: true, serviceId };
}

export async function deleteServiceAction(
  serviceId: string,
): Promise<ServiceActionResult> {
  const { user, profile } = await getAuthContext();
  if (!user || !profile || profile.role !== "business_owner") {
    return { ok: false, error: "No tienes permisos para eliminar este servicio." };
  }

  const { business, services, error: ownerError } =
    await getOwnerBusinessAndServices(user.id);
  if (ownerError || !business) {
    return {
      ok: false,
      error: "No encontramos un negocio asignado a tu cuenta.",
    };
  }

  if (!services.some((s) => s.id === serviceId)) {
    return { ok: false, error: "Este servicio no pertenece a tu negocio." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", serviceId)
    .eq("business_id", business.id);

  if (error) {
    if (error.code === "23503") {
      return {
        ok: false,
        error:
          "Este servicio ya tiene reservas asociadas y no se puede eliminar. Puedes desactivarlo para que no reciba nuevas reservas.",
      };
    }
    return {
      ok: false,
      error: translateError(error, "No pudimos eliminar el servicio."),
    };
  }

  revalidateServicePaths(business.id);
  return { ok: true };
}
