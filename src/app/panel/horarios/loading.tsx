import { ListSkeleton } from "@/components/ui/States";

export default function PanelHorariosLoading() {
  return (
    <div className="space-y-8">
      <div className="animate-pulse space-y-3">
        <div className="h-3 w-28 rounded bg-[#161618]" />
        <div className="h-12 w-48 rounded-xl bg-[#1a1a1c]" />
      </div>
      <ListSkeleton count={5} />
    </div>
  );
}
