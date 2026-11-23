"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type AuthActionState } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const initialState: AuthActionState = {};

export function RegisterForm({ nextPath }: { nextPath: string | null }) {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState,
  );

  const loginHref = nextPath
    ? `/login?next=${encodeURIComponent(nextPath)}`
    : "/login";

  return (
    <Card variant="surface" className="rounded-[24px] p-6 sm:p-7">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-white">
          Crear cuenta
        </h1>
        <p className="mt-1.5 text-sm text-[#a99ec4]">
          Regístrate como cliente para reservar canchas y servicios en segundos.
        </p>
      </div>

      {state.error && (
        <div
          role="alert"
          className="mb-5 rounded-[14px] border border-[#ff3b6b]/40 bg-[#ff3b6b]/15 px-4 py-3 text-sm font-medium text-[#ff7092]"
        >
          {state.error}
        </div>
      )}

      {state.success && (
        <div
          role="status"
          className="mb-5 rounded-[14px] border border-emerald-400/35 bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-200"
        >
          {state.success}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {nextPath && <input type="hidden" name="next" value={nextPath} />}

        <Input
          id="full_name"
          name="full_name"
          type="text"
          label="Nombre completo"
          placeholder="Ej. María González"
          autoComplete="name"
          required
        />

        <Input
          id="phone"
          name="phone"
          type="tel"
          label="Teléfono"
          placeholder="Ej. 6123-4567"
          autoComplete="tel"
          required
        />

        <Input
          id="email"
          name="email"
          type="email"
          label="Correo electrónico"
          placeholder="tu@correo.com"
          autoComplete="email"
          required
        />

        <Input
          id="password"
          name="password"
          type="password"
          label="Contraseña"
          placeholder="Mínimo 6 caracteres"
          autoComplete="new-password"
          minLength={6}
          required
        />

        <Input
          id="confirm_password"
          name="confirm_password"
          type="password"
          label="Confirmar contraseña"
          placeholder="Repite tu contraseña"
          autoComplete="new-password"
          minLength={6}
          required
        />

        <div className="pt-2">
          <Button type="submit" fullWidth size="lg" loading={isPending}>
            {isPending ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-[#a99ec4]">
        ¿Ya tienes cuenta?{" "}
        <Link
          href={loginHref}
          className="font-bold text-[#ff5e7e] transition hover:text-white"
        >
          Inicia sesión
        </Link>
      </p>
    </Card>
  );
}
