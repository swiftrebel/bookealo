import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "glass" | "surface";
  children: ReactNode;
};

const variantMap = {
  default: "bg-[#111113] border border-white/[0.09]",
  glass: "bk-glass",
  surface: "bg-[#161618] border border-white/[0.09]",
};

export function Card({
  variant = "default",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-[20px] ${variantMap[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
