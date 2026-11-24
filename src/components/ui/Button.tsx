import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#1d7f45] text-white hover:bg-[#22914e] hover:scale-[1.01] active:scale-[0.97] disabled:opacity-35 disabled:hover:scale-100 disabled:hover:bg-[#1d7f45]",
  secondary:
    "border border-white/10 bg-[#1a1a1c] text-[#f5f5f7] hover:bg-[#222225] hover:border-white/18 active:scale-[0.97] disabled:opacity-40",
  ghost:
    "bg-transparent text-[#86868b] hover:bg-white/[0.06] hover:text-[#f5f5f7] active:scale-[0.97] disabled:opacity-40",
  danger:
    "border border-[#ff6961]/25 bg-[rgba(255,69,58,0.14)] text-[#ff6961] hover:bg-[rgba(255,69,58,0.22)] active:scale-[0.97] disabled:opacity-40",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[13px] rounded-full gap-1.5",
  md: "h-11 px-6 text-[15px] rounded-full gap-2",
  lg: "h-12 px-7 text-[15px] rounded-full gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`bk-tx inline-flex cursor-pointer items-center justify-center font-medium disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
