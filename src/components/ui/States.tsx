import type { ReactNode } from "react";
import { Card } from "./Card";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[24px] border border-white/10 bg-white/[0.04] px-6 py-14 text-center">
      {icon && (
        <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.08] text-2xl text-[#a99ec4]">
          {icon}
        </div>
      )}
      <p className="text-lg font-bold text-white">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-md text-sm text-[#a99ec4]">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

type ErrorStateProps = {
  title?: string;
  message: string;
  action?: ReactNode;
};

export function ErrorState({
  title = "Algo salió mal",
  message,
  action,
}: ErrorStateProps) {
  return (
    <Card className="border-[#ff3b6b]/35 bg-[#ff3b6b]/10 p-5">
      <p className="font-bold text-[#ff5e7e]">{title}</p>
      <p className="mt-1 text-sm text-white/80">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 min-[900px]:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse space-y-2.5">
          <div className="aspect-square w-full rounded-[16px] bg-white/[0.08]" />
          <div className="h-4 w-3/4 rounded-md bg-white/[0.08]" />
          <div className="h-3 w-1/2 rounded-md bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-3.5 rounded-[16px] border border-white/10 bg-white/[0.06] p-3.5"
        >
          <div className="h-14 w-14 shrink-0 rounded-[12px] bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 rounded bg-white/10" />
            <div className="h-3 w-1/3 rounded bg-white/[0.07]" />
          </div>
        </div>
      ))}
    </div>
  );
}
