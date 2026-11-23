import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({
  label,
  hint,
  error,
  id,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-white/90"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`h-11 w-full rounded-[14px] border bg-[rgba(26,15,44,0.72)] px-4 text-[15px] text-white placeholder-[#a99ec4]/70 outline-none backdrop-blur-xl transition focus:border-[#ff3b6b] disabled:opacity-50 ${
          error ? "border-[#ff3b6b]" : "border-white/10"
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-xs font-medium text-[#ff5e7e]">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[#a99ec4]">{hint}</p>
      ) : null}
    </div>
  );
}
