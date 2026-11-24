"use client";

import { useEffect, type ReactNode } from "react";
import { Button } from "./Button";
import { CloseIcon } from "./Icons";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="bk-rise relative z-10 w-full max-w-md rounded-[24px] border border-white/10 bg-[#161618] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.65)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="modal-title"
              className="text-xl font-semibold tracking-[-0.025em] text-[#f5f5f7]"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-2 text-[14px] leading-relaxed text-[#86868b]">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="bk-tx grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full bg-white/[0.08] text-[#86868b] hover:bg-white/[0.14] hover:text-[#f5f5f7]"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {children && <div className="mt-5">{children}</div>}
        {footer && (
          <div className="mt-6 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
};

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Volver",
  variant = "danger",
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} size="sm" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
