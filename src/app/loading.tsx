import { CardGridSkeleton } from "@/components/ui/States";

export default function HomeLoading() {
  return (
    <div className="space-y-16 min-[900px]:space-y-24">
      <div className="animate-pulse space-y-4">
        <div className="h-3 w-28 rounded bg-[#161618]" />
        <div className="h-12 w-72 rounded-xl bg-[#1a1a1c] min-[900px]:h-14 min-[900px]:w-96" />
        <div className="h-5 w-80 max-w-full rounded bg-[#161618]" />
        <div className="mt-8 h-12 max-w-[580px] rounded-[14px] bg-[#1a1a1c]" />
        <div className="flex gap-2 pt-1">
          <div className="h-8 w-28 rounded-full bg-[#1a1a1c]" />
          <div className="h-8 w-24 rounded-full bg-[#161618]" />
        </div>
      </div>

      <div className="h-[420px] w-full animate-pulse rounded-[24px] bg-[#161618] min-[900px]:h-[460px]" />

      <CardGridSkeleton count={4} />
    </div>
  );
}
