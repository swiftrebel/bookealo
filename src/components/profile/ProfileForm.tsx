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
    <Card className="max-w-xl p-6">
      <h2 className="text-lg font-bold text-white">Editar datos de contacto</h2>
      <p className="mt-1 text-xs text-[#a99ec4]">
        Los negocios verán tu nombre y teléfono cuando solicites una reserva.
      </p>

      {state.error && (
        <div
          role="alert"
          className="mt-4 rounded-[14px] border border-[#ff3b6b]/40 bg-[#ff3b6b]/15 px-4 py-3 text-sm font-medium text-[#ff7a9b]"
        >
          {state.error}
        </div>
      )}

      {state.success && (
        <div
          role="status"
          className="mt-4 rounded-[14px] border border-emerald-400/35 bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-200"
        >
          {state.success}
        </div>
      )}

      <form action={formAction} className="mt-5 space-y-4">
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

        <div className="pt-2">
          <Button type="submit" size="lg" loading={isPending}>
            {isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
