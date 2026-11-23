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
    "bk-grad-shadow text-white hover:brightness-110 active:scale-[0.98] disabled:opacity-35 disabled:shadow-none",
  secondary:
    "bk-card text-white hover:bg-white/[0.12] active:scale-[0.98] disabled:opacity-40",
  ghost:
    "bg-transparent text-[#a99ec4] hover:bg-white/[0.07] hover:text-white active:scale-[0.98] disabled:opacity-40",
  danger:
    "border border-[#ff3b6b]/40 bg-[#ff3b6b]/15 text-[#ff5e7e] hover:bg-[#ff3b6b]/25 active:scale-[0.98] disabled:opacity-40",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm rounded-xl gap-1.5",
  md: "h-11 px-5 text-[15px] rounded-[14px] gap-2",
  lg: "h-[52px] px-7 text-base rounded-[14px] gap-2",
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
      className={`inline-flex cursor-pointer items-center justify-center font-bold transition duration-200 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
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
