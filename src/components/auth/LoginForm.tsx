"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthActionState } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const initialState: AuthActionState = {};

export function LoginForm({ nextPath }: { nextPath: string | null }) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  const registerHref = nextPath
    ? `/registro?next=${encodeURIComponent(nextPath)}`
    : "/registro";

  return (
    <Card className="bk-rise rounded-[24px] p-7 sm:p-8">
      <div className="mb-7">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[rgba(245,245,247,0.44)]">
          Acceso
        </p>
        <h1 className="text-[30px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#f5f5f7]">
          Iniciar sesión
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#86868b]">
          Accede a tu cuenta de Bookealo para reservar o gestionar tu negocio.
        </p>
      </div>

      {nextPath && (
        <div className="mb-5 rounded-[14px] border border-white/10 bg-[#1a1a1c] px-4 py-3 text-[13px] text-[#f5f5f7]/80">
          Inicia sesión para continuar con tu reserva.
        </div>
      )}

      {state.error && (
        <div
          role="alert"
          className="mb-5 rounded-[14px] border border-[#ff6961]/30 bg-[rgba(255,69,58,0.14)] px-4 py-3 text-[13px] font-medium text-[#ff6961]"
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

        <div className="pt-3">
          <Button type="submit" fullWidth size="lg" loading={isPending}>
            {isPending ? "Ingresando..." : "Iniciar sesión"}
          </Button>
        </div>
      </form>

      <p className="mt-7 text-center text-[14px] text-[#86868b]">
        ¿Aún no tienes cuenta?{" "}
        <Link href={registerHref} className="bk-ul font-medium">
          Regístrate aquí
        </Link>
      </p>
    </Card>
  );
}
