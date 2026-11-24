import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { OwnerSchedulesManager } from "@/components/panel/OwnerSchedulesManager";
import { ClockIcon } from "@/components/ui/Icons";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { requireRole } from "@/lib/auth";
import { translateError } from "@/lib/errors";
import { getOwnerBusinessAndServices } from "@/lib/owner";
import { createClient } from "@/lib/supabase/server";
import type { ScheduleRow } from "@/types/database";

export const metadata: Metadata = {
  title: "Horarios",
};

export default async function PanelHorariosPage({
  searchParams,
}: {
  searchParams: Promise<{ servicio?: string | string[] }>;
}) {
  const [{ user }, resolvedSearchParams] = await Promise.all([
    requireRole(["business_owner"], "/panel/horarios"),
    searchParams,
  ]);

  const { business, services, error } = await getOwnerBusinessAndServices(
    user.id,
  );

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Panel del dueño"
          title="Horarios"
          subtitle="Configura los días y horas de apertura para cada servicio."
        />
        <ErrorState
          title="No pudimos cargar tus horarios"
          message={translateError(error)}
        />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Panel del dueño"
          title="Horarios"
          subtitle="Configura los días y horas de apertura para cada servicio."
        />
        <EmptyState
          icon={<ClockIcon className="h-5 w-5" />}
          title="Aún no tienes un negocio asignado"
          description="Cuando el administrador asigne un negocio a tu cuenta, podrás configurar los horarios de tus servicios aquí."
        />
      </div>
    );
  }

  const schedulesByService: Record<string, ScheduleRow[]> = {};
  if (services.length > 0) {
    const supabase = await createClient();
    const { data: schedules } = await supabase
      .from("schedules")
      .select("id, service_id, day_of_week, open_time, close_time, is_closed")
      .in(
        "service_id",
        services.map((s) => s.id),
      );

    (schedules ?? []).forEach((row) => {
      if (!schedulesByService[row.service_id]) {
        schedulesByService[row.service_id] = [];
      }
      schedulesByService[row.service_id].push(row);
    });
  }

  const initialServiceId = Array.isArray(resolvedSearchParams.servicio)
    ? (resolvedSearchParams.servicio[0] ?? null)
    : (resolvedSearchParams.servicio ?? null);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={business.name}
        title="Horarios"
        subtitle="Define los días abiertos y horas de apertura y cierre por servicio."
      />
      <OwnerSchedulesManager
        services={services}
        schedulesByService={schedulesByService}
        initialServiceId={initialServiceId}
      />
    </div>
  );
}
