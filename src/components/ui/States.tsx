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
    <div className="flex flex-col items-center justify-center rounded-[24px] border border-white/[0.09] bg-[#111113] px-6 py-16 text-center">
      {icon && (
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-white/[0.08] bg-[#1a1a1c] text-xl text-[#86868b]">
          {icon}
        </div>
      )}
      <p className="text-[18px] font-semibold tracking-[-0.02em] text-[#f5f5f7]">
        {title}
      </p>
      {description && (
        <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[#86868b]">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
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
    <Card className="border-[#ff6961]/25 bg-[rgba(255,69,58,0.1)] p-6">
      <p className="text-[15px] font-semibold text-[#ff6961]">{title}</p>
      <p className="mt-1.5 text-[14px] text-[#f5f5f7]/75">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 min-[900px]:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse space-y-3">
          <div className="aspect-square w-full rounded-[18px] bg-[#161618]" />
          <div className="h-4 w-3/4 rounded-md bg-[#1a1a1c]" />
          <div className="h-3 w-1/2 rounded-md bg-[#161618]" />
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
          className="flex animate-pulse items-center gap-4 rounded-[20px] border border-white/[0.08] bg-[#111113] p-4"
        >
          <div className="h-12 w-12 shrink-0 rounded-[12px] bg-[#1a1a1c]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 rounded bg-[#1a1a1c]" />
            <div className="h-3 w-1/3 rounded bg-[#161618]" />
          </div>
        </div>
      ))}
    </div>
  );
}
