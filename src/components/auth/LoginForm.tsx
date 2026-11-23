"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthActionState } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const initialState: AuthActionState = {};

export function LoginForm({ nextPath }: { nextPath: string | null }) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  const registerHref = nextPath
    ? `/registro?next=${encodeURIComponent(nextPath)}`
    : "/registro";

  return (
    <Card variant="surface" className="rounded-[24px] p-6 sm:p-7">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-white">
          Iniciar sesión
        </h1>
        <p className="mt-1.5 text-sm text-[#a99ec4]">
          Accede a tu cuenta de Bookealo para reservar o gestionar tu negocio.
        </p>
      </div>

      {nextPath && (
        <div className="mb-5 rounded-[14px] border border-white/10 bg-white/[0.06] px-4 py-3 text-xs text-[#d9d0ee]">
          Inicia sesión para continuar con tu reserva.
        </div>
      )}

      {state.error && (
        <div
          role="alert"
          className="mb-5 rounded-[14px] border border-[#ff3b6b]/40 bg-[#ff3b6b]/15 px-4 py-3 text-sm font-medium text-[#ff7092]"
        >
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {nextPath && <input type="hidden" name="next" value={nextPath} />}

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
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />

        <div className="pt-2">
          <Button type="submit" fullWidth size="lg" loading={isPending}>
            {isPending ? "Ingresando..." : "Iniciar sesión"}
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-[#a99ec4]">
        ¿Aún no tienes cuenta?{" "}
        <Link
          href={registerHref}
          className="font-bold text-[#ff5e7e] transition hover:text-white"
        >
          Regístrate aquí
        </Link>
      </p>
    </Card>
  );
}
