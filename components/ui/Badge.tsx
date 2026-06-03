/*
  Badge — etiqueta de estado semántico.

  Usamos "tone" en lugar de "variant" para dejar claro que
  la intención es financiera (positivo/negativo/warning/info),
  no visual (primary/secondary/etc.).
*/

type BadgeTone = "positive" | "negative" | "warning" | "info" | "neutral";
type BadgeSize = "sm" | "md";

const toneClasses: Record<BadgeTone, string> = {
  positive: "bg-positive-900 text-positive-400 border border-positive-400/20",
  negative: "bg-negative-900 text-negative-400 border border-negative-400/20",
  warning:  "bg-warning-900  text-warning-400  border border-warning-400/20",
  info:     "bg-info-900     text-info-400     border border-info-400/20",
  neutral:  "bg-white/[0.04] text-text-secondary border border-white/10",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  size?: BadgeSize;
  ariaLabel?: string;
}

export default function Badge({
  label,
  ariaLabel,
  tone = "neutral",
  size = "sm",
}: BadgeProps) {
  return (
    <span
      aria-label={ariaLabel}
      className={[
        "inline-flex items-center rounded-md font-mono font-semibold uppercase tracking-wide",
        toneClasses[tone],
        sizeClasses[size],
      ].join(" ")}
    >
      {label}
    </span>
  );
}

/*
  TransactionBadge — badge especializado para el tipo de transacción.
  Convierte TransactionType directamente a Badge con el tone correcto.
*/
import type { TransactionType } from "@/types/finance";

const typeConfig: Record<TransactionType, { label: string; tone: BadgeTone }> = {
  income:   { label: "IN",  tone: "positive" },
  expense:  { label: "OUT", tone: "negative" },
  transfer: { label: "TR",  tone: "info" },
};

export function TransactionBadge({ type }: { type: TransactionType }) {
  const { label, tone } = typeConfig[type];
  return <Badge label={label} tone={tone} size="sm" />;
}
