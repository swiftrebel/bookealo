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
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={id}
          className="block text-[13px] font-medium text-[#f5f5f7]/80"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`h-12 w-full rounded-[14px] border bg-[#1a1a1c] px-4 text-[15px] text-[#f5f5f7] placeholder-[#86868b] outline-none transition duration-300 focus:border-white/25 focus:bg-[#222225] disabled:opacity-45 ${
          error ? "border-[#ff6961]/60" : "border-white/[0.09]"
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-xs font-medium text-[#ff6961]">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[#86868b]">{hint}</p>
      ) : null}
    </div>
  );
}
