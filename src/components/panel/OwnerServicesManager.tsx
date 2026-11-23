"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  createServiceAction,
  deleteServiceAction,
  toggleServiceActiveAction,
  updateServiceAction,
} from "@/actions/services";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ClockIcon, PlusIcon } from "@/components/ui/Icons";
import { Input } from "@/components/ui/Input";
import { ConfirmModal } from "@/components/ui/Modal";
import { Sheet } from "@/components/ui/Sheet";
import { EmptyState } from "@/components/ui/States";
import { formatUSD } from "@/lib/currency";
import type { ServiceRow } from "@/types/database";

type OwnerServicesManagerProps = {
  services: ServiceRow[];
};

const QUICK_DURATIONS = [30, 60, 90, 120] as const;

function ServiceFormSheet({
  service,
  onClose,
  onSaved,
}: {
  service: ServiceRow | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const isEditing = Boolean(service);
  const [name, setName] = useState(service?.name ?? "");
  const [price, setPrice] = useState(
    service ? String(Number(service.price)) : "",
  );
  const [duration, setDuration] = useState(
    service ? String(service.slot_duration_minutes) : "60",
  );
  const [isRoofed, setIsRoofed] = useState(service?.is_roofed ?? false);
  const [isActive, setIsActive] = useState(service?.is_active ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const parsedPrice = Number(price);
    const parsedDuration = Number(duration);

    const payload = {
      name,
      price: parsedPrice,
      slotDurationMinutes: parsedDuration,
      isRoofed,
      isActive,
    };

    const result = service
      ? await updateServiceAction(service.id, payload)
      : await createServiceAction(payload);

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onSaved(
      isEditing
        ? "Servicio actualizado correctamente."
        : "Servicio creado correctamente. Recuerda configurar sus horarios semanales.",
    );
  };

  return (
    <Sheet
      open
      onClose={submitting ? () => {} : onClose}
      title={isEditing ? "Editar servicio" : "Nuevo servicio"}
      subtitle={
        isEditing
          ? "Actualiza los datos visibles para tus clientes."
          : "Agrega una cancha o servicio reservable a tu negocio."
      }
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="service-form"
            loading={submitting}
            size="lg"
          >
            {isEditing ? "Guardar cambios" : "Crear servicio"}
          </Button>
        </div>
      }
    >
      <form id="service-form" onSubmit={handleSubmit} className="space-y-5 pt-3">
        {error && (
          <div
            role="alert"
            className="rounded-[14px] border border-[#ff3b6b]/40 bg-[#ff3b6b]/15 px-4 py-3 text-sm font-medium text-[#ff7a9b]"
          >
            {error}
          </div>
        )}

        <Input
          id="service-name"
          label="Nombre del servicio"
          placeholder="Ej. Cancha 3 (fútbol 7)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={80}
        />

        <Input
          id="service-price"
          type="number"
          step="0.01"
          min="0"
          label="Precio por turno (USD)"
          placeholder="Ej. 25"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <div className="space-y-2">
          <Input
            id="service-duration"
            type="number"
            step="5"
            min="15"
            max="480"
            label="Duración de cada franja (minutos)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
          />
          <div className="flex flex-wrap gap-1.5">
            {QUICK_DURATIONS.map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setDuration(String(mins))}
                className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  Number(duration) === mins
                    ? "bk-grad border-transparent text-white"
                    : "border-white/10 bg-white/[0.06] text-[#a99ec4] hover:text-white"
                }`}
              >
                {mins} min
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[14px] border border-white/10 bg-white/[0.06] px-4 py-3.5">
            <div>
              <p className="text-sm font-bold text-white">Espacio techado</p>
              <p className="text-xs text-[#a99ec4]">
                Muestra la etiqueta “Techado” en la página pública.
              </p>
            </div>
            <input
              type="checkbox"
              checked={isRoofed}
              onChange={(e) => setIsRoofed(e.target.checked)}
              className="h-5 w-5 accent-[#ff3b6b]"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[14px] border border-white/10 bg-white/[0.06] px-4 py-3.5">
            <div>
              <p className="text-sm font-bold text-white">Servicio activo</p>
              <p className="text-xs text-[#a99ec4]">
                Solo los servicios activos aparecen visibles para reservar.
              </p>
            </div>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-5 w-5 accent-[#ff3b6b]"
            />
          </label>
        </div>
      </form>
    </Sheet>
  );
}

export function OwnerServicesManager({ services }: OwnerServicesManagerProps) {
  const router = useRouter();
  const [sheetState, setSheetState] = useState<
    { open: false } | { open: true; service: ServiceRow | null }
  >({ open: false });
  const [serviceToDelete, setServiceToDelete] = useState<ServiceRow | null>(
    null,
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  const handleToggleActive = async (service: ServiceRow) => {
    setBusyId(service.id);
    setFeedback(null);

    const nextActive = !service.is_active;
    const result = await toggleServiceActiveAction(service.id, nextActive);
    setBusyId(null);

    if (!result.ok) {
      setFeedback({ type: "error", message: result.error });
      return;
    }

    setFeedback({
      type: "success",
      message: nextActive
        ? `“${service.name}” fue activado.`
        : `“${service.name}” fue desactivado.`,
    });
    router.refresh();
  };

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;
    setBusyId(serviceToDelete.id);
    setFeedback(null);

    const result = await deleteServiceAction(serviceToDelete.id);
    setBusyId(null);
    setServiceToDelete(null);

    if (!result.ok) {
      setFeedback({ type: "error", message: result.error });
      return;
    }

    setFeedback({
      type: "success",
      message: `“${serviceToDelete.name}” fue eliminado correctamente.`,
    });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#a99ec4]">
          {services.length}{" "}
          {services.length === 1
            ? "servicio configurado"
            : "servicios configurados"}
        </p>
        <Button onClick={() => setSheetState({ open: true, service: null })}>
          <PlusIcon className="h-4 w-4" />
          Nuevo servicio
        </Button>
      </div>

      {feedback && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={`rounded-[14px] border px-4 py-3 text-sm font-medium ${
            feedback.type === "error"
              ? "border-[#ff3b6b]/40 bg-[#ff3b6b]/15 text-[#ff7a9b]"
              : "border-emerald-400/35 bg-emerald-500/15 text-emerald-200"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {services.length === 0 ? (
        <EmptyState
          icon="⚽"
          title="Todavía no tienes servicios"
          description="Crea tu primera cancha o servicio para definir horarios y empezar a recibir reservas."
          action={
            <Button
              onClick={() => setSheetState({ open: true, service: null })}
            >
              <PlusIcon className="h-4 w-4" />
              Crear primer servicio
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {services.map((service) => {
            const isBusy = busyId === service.id;
            return (
              <Card key={service.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-white">
                        {service.name}
                      </h3>
                      <Badge tone={service.is_active ? "confirmed" : "cancelled"}>
                        {service.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                      <Badge tone={service.is_roofed ? "info" : "neutral"}>
                        {service.is_roofed ? "Techado" : "Aire libre"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#a99ec4]">
                      <span className="font-extrabold text-white">
                        {formatUSD(service.price)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="h-4 w-4 text-[#ff5e7e]" />
                        {service.slot_duration_minutes} min por turno
                      </span>
                      <Link
                        href={`/panel/horarios?servicio=${encodeURIComponent(service.id)}`}
                        className="font-semibold text-[#ff5e7e] transition hover:text-white"
                      >
                        Editar horarios →
                      </Link>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3 sm:border-t-0 sm:pt-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={Boolean(busyId)}
                      onClick={() => setSheetState({ open: true, service })}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={isBusy}
                      disabled={Boolean(busyId)}
                      onClick={() => handleToggleActive(service)}
                    >
                      {service.is_active ? "Desactivar" : "Activar"}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={Boolean(busyId)}
                      onClick={() => setServiceToDelete(service)}
                    >
                      Borrar
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {sheetState.open && (
        <ServiceFormSheet
          key={sheetState.service?.id ?? "new"}
          service={sheetState.service}
          onClose={() => setSheetState({ open: false })}
          onSaved={(message) => {
            setSheetState({ open: false });
            setFeedback({ type: "success", message });
            router.refresh();
          }}
        />
      )}

      <ConfirmModal
        open={Boolean(serviceToDelete)}
        onClose={() => setServiceToDelete(null)}
        onConfirm={handleConfirmDelete}
        loading={Boolean(serviceToDelete && busyId === serviceToDelete.id)}
        title="¿Borrar este servicio?"
        description={
          serviceToDelete
            ? `Vas a eliminar “${serviceToDelete.name}” junto con sus horarios. Si ya tiene reservas asociadas, el sistema te recomendará desactivarlo en su lugar.`
            : ""
        }
        confirmLabel="Sí, borrar"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
}
