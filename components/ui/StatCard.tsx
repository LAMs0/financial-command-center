/*
  StatCard — card de una sola métrica financiera.

  Estructura:
  ┌─────────────────────────────┐
  │ ████████████████░░░░ (bar)  │
  │ label                       │
  │ $28,450.75          (value) │
  │ +3.4% vs last month (detail)│
  └─────────────────────────────┘

  El `accentBar` es la línea de color superior que categoriza visualmente
  cada card (verde para positivo, rojo para deuda, etc.).
*/

type StatCardTone = "positive" | "negative" | "warning" | "info" | "brand";

const toneTextClass: Record<StatCardTone, string> = {
  positive: "text-positive-400",
  negative: "text-negative-400",
  warning:  "text-warning-400",
  info:     "text-info-400",
  brand:    "text-brand-400",
};

const toneBarClass: Record<StatCardTone, string> = {
  positive: "from-positive-500 to-info-500",
  negative: "from-negative-500 to-warning-500",
  warning:  "from-warning-500 to-negative-500",
  info:     "from-info-500 to-brand-400",
  brand:    "from-brand-500 to-info-500",
};

const toneStroke: Record<StatCardTone, string> = {
  positive: "var(--color-positive-400)",
  negative: "var(--color-negative-400)",
  warning: "var(--color-warning-400)",
  info: "var(--color-info-400)",
  brand: "var(--color-brand-400)",
};

interface StatCardProps {
  label: string;
  value: string;
  detail?: string;
  tone?: StatCardTone;
  /** Muestra la barra de color superior */
  accentBar?: boolean;
  /** Valores compactos para dibujar un sparkline en la card */
  sparkline?: number[];
}

export default function StatCard({
  label,
  value,
  detail,
  tone = "brand",
  accentBar = true,
  sparkline,
}: StatCardProps) {
  const sparklinePoints = buildSparklinePoints(sparkline);

  return (
    <article className="rounded-xl border border-white/10 bg-surface-card p-5 shadow-2xl shadow-black/20">
      {accentBar && (
        <div
          className={`mb-5 h-1 rounded-full bg-gradient-to-r ${toneBarClass[tone]}`}
        />
      )}
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-normal text-white">
        {value}
      </p>
      {detail && (
        <p className={`mt-2 text-sm ${toneTextClass[tone]}`}>{detail}</p>
      )}
      {sparklinePoints && (
        <svg
          aria-hidden="true"
          className="mt-5 h-10 w-full overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 100 32"
        >
          <path
            d={`M ${sparklinePoints.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L ")}`}
            fill="none"
            stroke={toneStroke[tone]}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
          />
          <path
            d={`M ${sparklinePoints.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L ")} L 100 32 L 0 32 Z`}
            fill={toneStroke[tone]}
            opacity="0.08"
          />
        </svg>
      )}
    </article>
  );
}

function buildSparklinePoints(values?: number[]) {
  if (!values || values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const lastIndex = values.length - 1;

  return values.map((value, index) => {
    const x = (index / lastIndex) * 100;
    const y = 28 - ((value - min) / range) * 24;
    return [x, y] as const;
  });
}
