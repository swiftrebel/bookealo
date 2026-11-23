import { ListSkeleton } from "@/components/ui/States";

export default function MisReservasLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-2">
        <div className="h-4 w-24 rounded bg-white/10" />
        <div className="h-10 w-56 rounded-xl bg-white/10" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-28 animate-pulse rounded-full bg-white/10" />
        <div className="h-9 w-28 animate-pulse rounded-full bg-white/[0.07]" />
      </div>
      <ListSkeleton count={3} />
    </div>
  );
}
