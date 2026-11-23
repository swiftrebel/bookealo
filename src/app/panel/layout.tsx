import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";

export default async function PanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole(["business_owner"], "/panel");
  return <>{children}</>;
}
