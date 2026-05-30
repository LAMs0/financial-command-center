/*
  ProgressBar — barra de progreso reutilizable.

  Acepta `value` como número entre 0 y 1 (0% a 100%).
  El color se puede forzar con `color` (hex) o calcularse
  automáticamente con `autoColor` basado en el valor.

  autoColor:
  - 0–30%  → brand (verde, bien)
  - 31–70% → warning (amarillo, ojo)
  - 71–100% → negative (rojo, peligro)

  Útil para utilización de tarjetas donde alto es malo.
  Para metas financieras donde alto es bueno, usa `color` directo.
*/

type ProgressBarSize = "xs" | "sm" | "md";

const sizeClasses: Record<ProgressBarSize, string> = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2",
};

interface ProgressBarProps {
  /** Valor entre 0 y 1 */
  value: number;
  /** Color hex directo (ej: "#10b981"). Tiene prioridad sobre autoColor */
  color?: string;
  /** Calcula color automático según el nivel del valor */
  autoColor?: boolean;
  size?: ProgressBarSize;
  className?: string;
}

function resolveColor(value: number): string {
  if (value <= 0.3) return "var(--color-brand-500)";
  if (value <= 0.7) return "var(--color-warning-500)";
  return "var(--color-negative-500)";
}

export default function ProgressBar({
  value,
  color,
  autoColor = false,
  size = "sm",
  className = "",
}: ProgressBarProps) {
  const pct = Math.min(Math.max(value, 0), 1); // clamp 0–1
  const fillColor = color ?? (autoColor ? resolveColor(pct) : "var(--color-brand-500)");

  return (
    <div
      aria-label={`${Math.round(pct * 100)} percent`}
      className={[
        "w-full rounded-full bg-white/10",
        sizeClasses[size],
        className,
      ].join(" ")}
      role="progressbar"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(pct * 100)}
    >
      <div
        className={["rounded-full transition-all duration-500", sizeClasses[size]].join(" ")}
        style={{
          width: `${Math.round(pct * 100)}%`,
          backgroundColor: fillColor,
        }}
      />
    </div>
  );
}
