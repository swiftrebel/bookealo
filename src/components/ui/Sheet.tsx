"use client";

import { useEffect, type ReactNode } from "react";
import { CloseIcon } from "./Icons";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  accentColor?: string;
  headerExtra?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  accentColor = "#7c3aed",
  headerExtra,
  footer,
  children,
}: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Panel de detalles"}
    >
      <div
        className="fixed inset-0 bg-[rgba(5,2,12,0.65)] backdrop-blur-[4px] transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-x-0 bottom-0 top-[calc(var(--sat)+16px)] mx-auto flex max-w-[600px] flex-col overflow-hidden rounded-t-[24px] border border-white/10 bg-[#130a22] shadow-2xl min-[900px]:inset-y-0 min-[900px]:left-auto min-[900px]:right-0 min-[900px]:top-0 min-[900px]:mx-0 min-[900px]:w-[480px] min-[900px]:max-w-full min-[900px]:rounded-l-[28px] min-[900px]:rounded-tr-none">
        <div
          className="relative px-5 pb-5 pt-3 min-[900px]:pt-6"
          style={{
            background: `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 50%, #130a22), #130a22)`,
          }}
        >
          <div className="mx-auto mb-3 h-[5px] w-9 rounded-full bg-white/35 min-[900px]:hidden" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-4 top-4 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-black/35 text-white backdrop-blur-md transition hover:bg-black/55"
          >
            <CloseIcon className="h-4 w-4" />
          </button>

          {headerExtra}
          {title && (
            <h3 className="pr-10 text-2xl font-extrabold tracking-[-0.02em] text-white">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-white/75">{subtitle}</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8">{children}</div>

        {footer && (
          <div className="bk-glass border-t border-white/10 px-5 pb-[calc(var(--sab)+14px)] pt-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
