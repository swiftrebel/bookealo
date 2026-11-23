import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
};

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  action,
}: PageHeaderProps) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#ff3b6b]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[32px] font-extrabold leading-[1.08] tracking-[-0.03em] text-white min-[900px]:text-[44px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm text-[#a99ec4] min-[900px]:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
