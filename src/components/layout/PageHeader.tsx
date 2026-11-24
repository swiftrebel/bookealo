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
    <header className="bk-rise mb-10 flex flex-wrap items-end justify-between gap-4 min-[900px]:mb-12">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[rgba(245,245,247,0.44)]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[36px] font-semibold leading-[1.06] tracking-[-0.035em] text-[#f5f5f7] min-[900px]:text-[52px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 text-[16px] leading-[1.47] text-[#86868b] min-[900px]:text-[17px]">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
