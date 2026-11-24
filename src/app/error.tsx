"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ShieldIcon } from "@/components/ui/Icons";
import { EmptyState } from "@/components/ui/States";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="py-12">
      <EmptyState
        icon={<ShieldIcon className="h-5 w-5" />}
        title="Ocurrió un problema inesperado"
        description="No pudimos cargar esta pantalla. Puedes intentar recargar o volver al inicio."
        action={
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={reset}>Intentar de nuevo</Button>
            <Link
              href="/"
              className="bk-tx inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-[#1a1a1c] px-6 text-[14px] font-medium text-[#f5f5f7] hover:bg-[#222225]"
            >
              Volver al inicio
            </Link>
          </div>
        }
      />
    </div>
  );
}
