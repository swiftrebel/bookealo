import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { getAuthContext } from "@/lib/auth";
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { user, profile } = await getAuthContext();

  return (
    <html lang="es" className={`${bricolage.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppShell userEmail={user?.email ?? null} profile={profile}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
