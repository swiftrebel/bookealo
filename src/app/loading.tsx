import { CardGridSkeleton } from "@/components/ui/States";

export default function HomeLoading() {
  return (
    <div className="space-y-7">
      <div className="animate-pulse space-y-2">
        <div className="h-10 w-44 rounded-xl bg-white/10" />
        <div className="h-4 w-72 rounded-md bg-white/[0.07]" />
      </div>

      <div className="h-11 w-full animate-pulse rounded-[14px] bg-white/[0.07]" />

      <div className="h-[340px] w-full animate-pulse rounded-[24px] bg-white/[0.07]" />

      <CardGridSkeleton count={4} />
    </div>
  );
}
