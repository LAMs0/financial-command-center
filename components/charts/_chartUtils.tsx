import type { MonthlySnapshot } from "@/types/finance";

export interface ChartTooltipPayload {
  dataKey?: string | number;
  value?: number | string;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipPayload[];
  label?: string | number;
}

/** Render the XAxis label with the selected month highlighted. */
export function ActiveMonthTick(
  data: MonthlySnapshot[],
  selectedMonth: string
) {
  function ActiveMonthTickRenderer({
    x,
    y,
    payload,
  }: {
    x: string | number;
    y: string | number;
    payload: { value: string };
  }) {
    const snapshot = data.find((d) => d.label === payload.value);
    const isActive = snapshot?.month === selectedMonth;
    const label = String(payload.value);

    const tickY = Number(y) + 18;

    return (
      <text
        fill={isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)"}
        fontSize={isActive ? 12 : 11}
        fontWeight={isActive ? 600 : 400}
        textAnchor="middle"
        x={Number(x)}
        y={tickY}
      >
        {label}
      </text>
    );
  }

  return ActiveMonthTickRenderer;
}
