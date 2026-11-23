"use client";

import { useState } from "react";
import {
  BookingSheet,
  type BookableBusiness,
  type BookableService,
  type BookingDayOption,
} from "@/components/booking/BookingSheet";
import { BusinessSchedulePreview } from "@/components/businesses/BusinessSchedulePreview";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ClockIcon } from "@/components/ui/Icons";
import { EmptyState } from "@/components/ui/States";
import { formatUSD } from "@/lib/currency";
import type { ScheduleRow, UserRole } from "@/types/database";

export type ServiceWithSchedules = BookableService & {
  schedules: ScheduleRow[];
};

type BusinessServicesSectionProps = {
  business: BookableBusiness;
  services: ServiceWithSchedules[];
  days: BookingDayOption[];
  userRole: UserRole | null;
  initialServiceId?: string | null;
  initialDateStr?: string | null;
  initialSlotTime?: string | null;
};

export function BusinessServicesSection({
  business,
  services,
  days,
  userRole,
  initialServiceId,
  initialDateStr,
  initialSlotTime,
}: BusinessServicesSectionProps) {
  const canReserve = userRole === null || userRole === "customer";
  const isNonCustomerRole =
    userRole === "business_owner" || userRole === "super_admin";

  const matchedInitialService =
    canReserve && initialServiceId
      ? (services.find((s) => s.id === initialServiceId) ?? null)
      : null;

  const [activeService, setActiveService] = useState<BookableService | null>(
    matchedInitialService,
  );
  const [sheetInitialDate, setSheetInitialDate] = useState<string | null>(
    matchedInitialService ? (initialDateStr ?? null) : null,
  );
  const [sheetInitialTime, setSheetInitialTime] = useState<string | null>(
    matchedInitialService ? (initialSlotTime ?? null) : null,
  );

  const handleOpenService = (service: BookableService) => {
    setSheetInitialDate(null);
    setSheetInitialTime(null);
    setActiveService(service);
  };

  return (
    <section className="space-y-4">
      {isNonCustomerRole && (
        <Card className="border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          Necesitas una cuenta de cliente para reservar.
        </Card>
      )}

      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-[23px] font-bold tracking-[-0.02em] text-white">
          Servicios disponibles
        </h2>
        <span className="text-xs font-semibold text-[#a99ec4]">
          {services.length} {services.length === 1 ? "servicio" : "servicios"}
        </span>
      </div>

      {services.length === 0 ? (
        <EmptyState
          icon="⚽"
          title="No hay servicios activos en este momento"
          description="Este negocio aún no tiene servicios habilitados para reservar."
        />
      ) : (
        <div className="grid gap-4">
          {services.map((service) => (
            <Card key={service.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-white">
                      {service.name}
                    </h3>
                    <Badge tone={service.is_roofed ? "info" : "neutral"}>
                      {service.is_roofed ? "Techado" : "Aire libre"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-[#a99ec4]">
                    <span className="inline-flex items-center gap-1.5">
                      <ClockIcon className="h-4 w-4 text-[#ff5e7e]" />
                      {service.slot_duration_minutes} min por turno
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-extrabold tracking-tight text-white">
                      {formatUSD(service.price)}
                    </p>
                    <p className="text-xs text-[#a99ec4]">
                      por turno ({service.slot_duration_minutes} min)
                    </p>
                  </div>

                  {canReserve && (
                    <Button
                      size="md"
                      onClick={() => handleOpenService(service)}
                    >
                      Reservar
                    </Button>
                  )}
                </div>
              </div>

              <BusinessSchedulePreview schedules={service.schedules} />
            </Card>
          ))}
        </div>
      )}

      {canReserve && activeService && (
        <BookingSheet
          key={`${activeService.id}-${sheetInitialDate ?? ""}-${sheetInitialTime ?? ""}`}
          onClose={() => setActiveService(null)}
          business={business}
          service={activeService}
          days={days}
          isAuthenticated={userRole === "customer"}
          initialDateStr={sheetInitialDate}
          initialSlotTime={sheetInitialTime}
        />
      )}
    </section>
  );
}
