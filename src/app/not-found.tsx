import Link from "next/link";
import { SearchIcon } from "@/components/ui/Icons";
import { EmptyState } from "@/components/ui/States";

export default function NotFound() {
  return (
    <div className="py-12">
      <EmptyState
        icon={<SearchIcon className="h-5 w-5" />}
        title="Página no encontrada"
        description="La ruta que buscas no existe o fue movida."
        action={
          <Link href="/" className="bk-cta h-11 px-6 text-[14px]">
            Volver al inicio
          </Link>
        }
      />
    </div>
  );
}
