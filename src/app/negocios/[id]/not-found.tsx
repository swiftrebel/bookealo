import Link from "next/link";
import { SearchIcon } from "@/components/ui/Icons";
import { EmptyState } from "@/components/ui/States";

export default function BusinessNotFound() {
  return (
    <div className="py-12">
      <EmptyState
        icon={<SearchIcon className="h-5 w-5" />}
        title="Negocio no encontrado"
        description="Este negocio no existe o ya no se encuentra activo en Bookealo."
        action={
          <Link href="/" className="bk-cta h-11 px-6 text-[14px]">
            Volver al inicio
          </Link>
        }
      />
    </div>
  );
}
