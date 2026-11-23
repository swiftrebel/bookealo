import { ListSkeleton } from "@/components/ui/States";

export default function PanelLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-2">
        <div className="h-4 w-28 rounded bg-white/10" />
        <div className="h-10 w-64 rounded-xl bg-white/10" />
      </div>
      <div className="flex gap-3">
        <div className="h-11 w-40 animate-pulse rounded-[14px] bg-white/10" />
        <div className="h-11 w-40 animate-pulse rounded-[14px] bg-white/[0.07]" />
      </div>
      <ListSkeleton count={3} />
    </div>
  );
}
