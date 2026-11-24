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
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-x-0 bottom-0 top-[calc(var(--sat)+16px)] mx-auto flex max-w-[600px] flex-col overflow-hidden rounded-t-[24px] border border-white/10 bg-[#111113] shadow-[0_24px_80px_rgba(0,0,0,0.8)] min-[900px]:inset-y-0 min-[900px]:left-auto min-[900px]:right-0 min-[900px]:top-0 min-[900px]:mx-0 min-[900px]:w-[480px] min-[900px]:max-w-full min-[900px]:rounded-l-[24px] min-[900px]:rounded-tr-none min-[900px]:border-y-0 min-[900px]:border-r-0">
        <div className="relative border-b border-white/[0.09] bg-[#161618] px-6 pb-5 pt-3.5 min-[900px]:pt-6">
          <div className="mx-auto mb-3.5 h-[4px] w-9 rounded-full bg-white/25 min-[900px]:hidden" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="bk-tx absolute right-5 top-5 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-white/[0.08] text-[#86868b] hover:bg-white/[0.14] hover:text-[#f5f5f7]"
          >
            <CloseIcon className="h-4 w-4" />
          </button>

          {headerExtra}
          {title && (
            <h3 className="pr-10 text-2xl font-semibold tracking-[-0.028em] text-[#f5f5f7]">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="mt-1 text-[14px] text-[#86868b]">{subtitle}</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8">{children}</div>

        {footer && (
          <div className="bk-glass-nav border-t border-white/[0.09] px-6 pb-[calc(var(--sab)+16px)] pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
