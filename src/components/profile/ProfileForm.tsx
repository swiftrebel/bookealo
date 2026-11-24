"use client";

import { useActionState } from "react";
import {
  updateCustomerProfileAction,
  type ProfileActionState,
} from "@/actions/profile";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const initialState: ProfileActionState = {};

type ProfileFormProps = {
  initialFullName: string;
  initialPhone: string;
  email: string;
};

export function ProfileForm({
  initialFullName,
  initialPhone,
  email,
}: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateCustomerProfileAction,
    initialState,
  );

  return (
    <Card className="max-w-xl p-6 sm:p-7">
      <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-[#f5f5f7]">
        Editar datos de contacto
      </h2>
      <p className="mt-1.5 text-[13px] text-[#86868b]">
        Los negocios verán tu nombre y teléfono cuando solicites una reserva.
      </p>

      {state.error && (
        <div
          role="alert"
          className="mt-5 rounded-[14px] border border-[#ff6961]/30 bg-[rgba(255,69,58,0.14)] px-4 py-3 text-[13px] font-medium text-[#ff6961]"
        >
          {state.error}
        </div>
      )}

      {state.success && (
        <div
          role="status"
          className="mt-5 rounded-[14px] border border-[#34c470]/30 bg-[rgba(29,127,69,0.2)] px-4 py-3 text-[13px] font-medium text-[#34c470]"
        >
          {state.success}
        </div>
      )}

      <form action={formAction} className="mt-6 space-y-4">
        <Input
          id="profile-full-name"
          name="full_name"
          label="Nombre completo"
          defaultValue={initialFullName}
          placeholder="Ej. María González"
          autoComplete="name"
          required
        />

        <Input
          id="profile-phone"
          name="phone"
          type="tel"
          label="Teléfono"
          defaultValue={initialPhone}
          placeholder="Ej. 6123-4567"
          autoComplete="tel"
          required
        />

        <Input
          id="profile-email"
          type="email"
          label="Correo electrónico"
          value={email}
          disabled
          hint="El correo de acceso no se puede cambiar desde aquí."
        />

        <div className="pt-3">
          <Button type="submit" size="lg" loading={isPending}>
            {isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
