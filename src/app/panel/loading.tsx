import { ListSkeleton } from "@/components/ui/States";

export default function PanelLoading() {
  return (
    <div className="space-y-8">
      <div className="animate-pulse space-y-3">
        <div className="h-3 w-28 rounded bg-[#161618]" />
        <div className="h-12 w-64 rounded-xl bg-[#1a1a1c]" />
      </div>
      <div className="flex gap-3">
        <div className="h-11 w-40 animate-pulse rounded-full bg-[#1a1a1c]" />
        <div className="h-11 w-40 animate-pulse rounded-full bg-[#161618]" />
      </div>
      <ListSkeleton count={3} />
    </div>
  );
}
