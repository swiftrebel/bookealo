import Link from "next/link";
import { EmptyState } from "@/components/ui/States";

export default function NotFound() {
  return (
    <div className="py-12">
      <EmptyState
        icon="🔍"
        title="Página no encontrada"
        description="La ruta que buscas no existe o fue movida."
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
