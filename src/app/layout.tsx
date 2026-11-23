import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import {
  AppShell,
  type NextBookingPreview,
} from "@/components/layout/AppShell";
import { getAuthContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Bookealo",
    template: "%s · Bookealo",
  },
  description:
    "Reserva canchas y servicios por franjas horarias en Panamá de forma rápida y sencilla.",
};

export const viewport: Viewport = {
  themeColor: "#0a0612",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

type RawNextBooking = {
  id: string;
  start_time: string;
  services: {
    name: string;
    businesses: {
      id: string;
      name: string;
      cover_image_url: string | null;
    } | null;
  } | null;
};

async function loadShellExtras(
  userId: string | null,
  profile: ProfileRow | null,
): Promise<{ navBadgeCount: number; nextBooking: NextBookingPreview | null }> {
  if (!userId || !profile) {
    return { navBadgeCount: 0, nextBooking: null };
  }

  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  if (profile.role === "customer") {
    const { data } = await supabase
      .from("bookings")
      .select(
        `
        id,
        start_time,
        services (
          name,
          businesses (
            id,
            name,
            cover_image_url
          )
        )
      `,
      )
      .eq("customer_id", userId)
      .in("status", ["pending", "confirmed"])
      .gte("start_time", nowIso)
      .order("start_time", { ascending: true });

    const list = (data ?? []) as unknown as RawNextBooking[];
    const first = list[0];
    return {
      navBadgeCount: list.length,
      nextBooking: first
        ? {
            id: first.id,
            businessId: first.services?.businesses?.id ?? null,
            businessName: first.services?.businesses?.name ?? "Negocio",
            businessCoverUrl:
              first.services?.businesses?.cover_image_url ?? null,
            serviceName: first.services?.name ?? "Servicio",
            startTime: first.start_time,
          }
        : null,
    };
  }

  if (profile.role === "business_owner") {
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();

    if (!business) return { navBadgeCount: 0, nextBooking: null };

    const { data: services } = await supabase
      .from("services")
      .select("id")
      .eq("business_id", business.id);

    const serviceIds = (services ?? []).map((s) => s.id);
    if (serviceIds.length === 0) return { navBadgeCount: 0, nextBooking: null };

    const { count } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("service_id", serviceIds)
      .eq("status", "pending")
      .gte("end_time", nowIso);

    return { navBadgeCount: count ?? 0, nextBooking: null };
  }

  return { navBadgeCount: 0, nextBooking: null };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { user, profile } = await getAuthContext();
  const { navBadgeCount, nextBooking } = await loadShellExtras(
    user?.id ?? null,
    profile,
  );

  return (
    <html lang="es" className={`${bricolage.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppShell
          userEmail={user?.email ?? null}
          profile={profile}
          navBadgeCount={navBadgeCount}
          nextBooking={nextBooking}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
