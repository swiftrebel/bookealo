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
  neutral: "bg-white/[0.06] text-[#f5f5f7]/80 border-white/10",
  pending: "bg-[rgba(255,159,10,0.16)] text-[#ffa530] border-[#ffa530]/20",
  confirmed: "bg-[rgba(29,127,69,0.22)] text-[#34c470] border-[#34c470]/20",
  blocked: "bg-[rgba(155,109,255,0.16)] text-[#b996ff] border-[#b996ff]/20",
  cancelled: "bg-[rgba(255,69,58,0.16)] text-[#ff6961] border-[#ff6961]/20",
  accent: "bg-[#1d7f45] text-white border-transparent",
  info: "bg-[rgba(100,210,255,0.14)] text-[#64d2ff] border-[#64d2ff]/20",
};

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.02em] leading-tight ${toneStyles[tone]} ${className}`}
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
