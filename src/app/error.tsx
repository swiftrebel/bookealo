"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
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
        icon="⚠️"
        title="Ocurrió un problema inesperado"
        description="No pudimos cargar esta pantalla. Puedes intentar recargar o volver al inicio."
        action={
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={reset}>Intentar de nuevo</Button>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.07] px-5 text-sm font-bold text-white transition hover:bg-white/[0.12]"
            >
              Volver al inicio
            </Link>
          </div>
        }
      />
    </div>
  );
}
