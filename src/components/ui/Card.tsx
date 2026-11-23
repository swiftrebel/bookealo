import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "glass" | "surface";
  children: ReactNode;
};

const variantMap = {
  default: "bk-card",
  glass: "bk-glass border border-white/10",
  surface: "bg-[#130a22] border border-white/10",
};

export function Card({
  variant = "default",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-[16px] ${variantMap[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
