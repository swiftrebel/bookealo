type ErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
} | null;

export function translateError(error: unknown, fallback = "Ocurrió un error inesperado. Intenta de nuevo."): string {
  if (!error) return fallback;

  const errObj: ErrorLike =
    typeof error === "string"
      ? { message: error }
      : typeof error === "object"
        ? (error as ErrorLike)
        : null;

  const rawMessage = errObj?.message?.trim() ?? "";
  const msg = rawMessage.toLowerCase();
  const code = errObj?.code ?? "";

  // Mensajes de negocio enviados directamente desde la base de datos en español
  if (rawMessage.includes("Ese horario ya está ocupado")) {
    return "Ese horario ya está ocupado. Por favor elige otra franja disponible.";
  }
  if (rawMessage.includes("Este servicio no está disponible")) {
    return "Este servicio ya no está disponible para reservar.";
  }
  if (rawMessage.includes("El servicio no existe")) {
    return "El servicio seleccionado no existe o fue eliminado.";
  }

  // Errores de autenticación de Supabase
  if (msg.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (msg.includes("email not confirmed")) {
    return "Tu correo aún no ha sido confirmado. Revisa tu bandeja de entrada.";
  }
  if (msg.includes("user already registered") || msg.includes("already been registered")) {
    return "Ya existe una cuenta registrada con este correo electrónico.";
  }
  if (msg.includes("password should be at least")) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  if (msg.includes("unable to validate email address") || msg.includes("invalid email")) {
    return "Ingresa un correo electrónico válido.";
  }
  if (msg.includes("rate limit") || msg.includes("too many requests") || code === "over_request_rate_limit") {
    return "Has realizado demasiados intentos. Espera un momento e intenta de nuevo.";
  }
  if (msg.includes("weak password")) {
    return "La contraseña es muy débil. Usa al menos 6 caracteres combinando letras y números.";
  }
  if (msg.includes("network") || msg.includes("failed to fetch")) {
    return "No pudimos conectarnos con el servidor. Verifica tu conexión a internet.";
  }

  // Errores de Postgres / RLS
  if (code === "42501" || msg.includes("row-level security") || msg.includes("permission denied")) {
    return "No tienes permisos para realizar esta acción.";
  }
  if (code === "23505" || msg.includes("duplicate key")) {
    return "Ya existe un registro con esos mismos datos.";
  }
  if (code === "23503" || msg.includes("foreign key")) {
    return "No se puede completar esta acción porque existen registros asociados (por ejemplo, reservas existentes).";
  }
  if (code === "23514" || msg.includes("check constraint")) {
    return "Los datos ingresados no cumplen con las reglas permitidas.";
  }
  if (code === "PGRST116") {
    return "No encontramos el registro solicitado.";
  }

  // Si el mensaje ya viene en español desde un trigger o validación propia
  if (
    rawMessage &&
    /[áéíóúñ¿¡]/i.test(rawMessage) &&
    !msg.includes("violates") &&
    !msg.includes("syntax") &&
    !msg.includes("relation")
  ) {
    return rawMessage;
  }

  return fallback;
}
