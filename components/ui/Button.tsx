import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonTone = "brand" | "neutral" | "danger";
type ButtonSize = "sm" | "md";

const toneClasses: Record<ButtonTone, string> = {
  brand:
    "border-brand-400/40 bg-brand-500/15 text-brand-300 hover:bg-brand-500/25 active:bg-brand-500/30 disabled:border-white/10 disabled:bg-white/[0.03] disabled:text-text-muted",
  neutral:
    "border-white/10 bg-white/[0.04] text-text-secondary hover:bg-white/[0.08] hover:text-white active:bg-white/[0.1] disabled:text-text-muted",
  danger:
    "border-negative-400/30 bg-negative-900 text-negative-400 hover:bg-negative-900/80 active:bg-negative-900 disabled:text-text-muted",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  tone?: ButtonTone;
  size?: ButtonSize;
}

export default function Button({
  children,
  className = "",
  disabled,
  icon,
  loading = false,
  size = "md",
  tone = "brand",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition disabled:cursor-not-allowed disabled:opacity-70",
        toneClasses[tone],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 rounded-full border-2 border-current border-r-transparent animate-spin"
        />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
