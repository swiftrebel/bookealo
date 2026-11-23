import { NextResponse, type NextRequest } from "next/server";
import {
  fetchAvailableSlotsForDate,
  isValidDateString,
  isWithinBookingWindow,
} from "@/lib/availability";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const serviceId = request.nextUrl.searchParams.get("serviceId")?.trim() ?? "";
  const dateStr = request.nextUrl.searchParams.get("date")?.trim() ?? "";
  const mode = request.nextUrl.searchParams.get("mode")?.trim() ?? "customer";

  if (!serviceId || !isValidDateString(dateStr)) {
    return NextResponse.json(
      { error: "Parámetros de servicio o fecha inválidos." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (mode === "customer" && !isWithinBookingWindow(dateStr, 14)) {
    return NextResponse.json(
      {
        error:
          "Solo puedes consultar disponibilidad para los próximos 14 días.",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const supabase = await createClient();
  const result = await fetchAvailableSlotsForDate(supabase, serviceId, dateStr, {
    allowInactiveService: mode === "owner",
  });

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(result, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
