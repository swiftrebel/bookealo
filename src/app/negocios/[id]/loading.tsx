import { ListSkeleton } from "@/components/ui/States";

export default function BusinessDetailLoading() {
  return (
    <div className="space-y-12">
      <div className="animate-pulse space-y-5">
        <div className="h-4 w-24 rounded bg-[#161618]" />
        <div className="h-5 w-36 rounded bg-[#161618]" />
        <div className="h-14 w-80 max-w-full rounded-xl bg-[#1a1a1c]" />
        <div className="h-5 w-64 rounded bg-[#161618]" />
      </div>
      <div className="h-[260px] w-full animate-pulse rounded-[24px] bg-[#161618] min-[900px]:h-[460px]" />
      <div className="space-y-4">
        <div className="h-9 w-56 animate-pulse rounded-xl bg-[#1a1a1c]" />
        <ListSkeleton count={2} />
      </div>
    </div>
  );
}
