import Link from "next/link";
import { EmptyState } from "@/components/ui/States";

export default function BusinessNotFound() {
  return (
    <div className="py-10">
      <EmptyState
        icon="🏟️"
        title="Negocio no encontrado"
        description="Este negocio no existe o ya no se encuentra activo en Bookealo."
        action={
          <Link
            href="/"
            className="bk-grad-shadow inline-flex h-11 items-center justify-center rounded-[14px] px-6 text-sm font-bold text-white"
          >
            Volver al inicio
          </Link>
        }
      />
    </div>
  );
}
