import type { ReactNode } from "react";
import type { BookingStatus } from "@/types/database";

type BadgeTone =
  | "neutral"
  | "pending"
  | "confirmed"
  | "blocked"
  | "cancelled"
  | "accent"
  | "info";

type BadgeProps = {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
};

const toneStyles: Record<BadgeTone, string> = {
  neutral: "bg-white/[0.09] text-white/90 border-white/10",
  pending: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  confirmed: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  blocked: "bg-violet-500/20 text-violet-200 border-violet-400/30",
  cancelled: "bg-[#ff3b6b]/15 text-[#ff6b8f] border-[#ff3b6b]/30",
  accent: "bk-grad text-white border-transparent",
  info: "bg-sky-500/15 text-sky-300 border-sky-400/30",
};

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-tight ${toneStyles[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

const statusLabelMap: Record<BookingStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  blocked: "Bloqueado",
  cancelled: "Cancelada",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge tone={status}>{statusLabelMap[status]}</Badge>;
}
