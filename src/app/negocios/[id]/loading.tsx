import { ListSkeleton } from "@/components/ui/States";

export default function BusinessDetailLoading() {
  return (
    <div className="space-y-8">
      <div className="h-5 w-36 animate-pulse rounded bg-white/10" />
      <div className="h-[320px] w-full animate-pulse rounded-[24px] bg-white/[0.07]" />
      <div className="space-y-3">
        <div className="h-7 w-52 animate-pulse rounded bg-white/10" />
        <ListSkeleton count={2} />
      </div>
    </div>
  );
}
