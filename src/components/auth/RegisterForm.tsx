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
    <Card className="bk-rise rounded-[24px] p-7 sm:p-8">
      <div className="mb-7">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[rgba(245,245,247,0.44)]">
          Nueva cuenta
        </p>
        <h1 className="text-[30px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#f5f5f7]">
          Crear cuenta
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#86868b]">
          Regístrate como cliente para reservar canchas y servicios en segundos.
        </p>
      </div>

      {state.error && (
        <div
          role="alert"
          className="mb-5 rounded-[14px] border border-[#ff6961]/30 bg-[rgba(255,69,58,0.14)] px-4 py-3 text-[13px] font-medium text-[#ff6961]"
        >
          {state.error}
        </div>
      )}

      {state.success && (
        <div
          role="status"
          className="mb-5 rounded-[14px] border border-[#34c470]/30 bg-[rgba(29,127,69,0.2)] px-4 py-3 text-[13px] font-medium text-[#34c470]"
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

        <div className="pt-3">
          <Button type="submit" fullWidth size="lg" loading={isPending}>
            {isPending ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </div>
      </form>

      <p className="mt-7 text-center text-[14px] text-[#86868b]">
        ¿Ya tienes cuenta?{" "}
        <Link href={loginHref} className="bk-ul font-medium">
          Inicia sesión
        </Link>
      </p>
    </Card>
  );
}
