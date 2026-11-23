import { ListSkeleton } from "@/components/ui/States";

export default function PanelServiciosLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-2">
        <div className="h-4 w-28 rounded bg-white/10" />
        <div className="h-10 w-48 rounded-xl bg-white/10" />
      </div>
      <ListSkeleton count={3} />
    </div>
  );
}
