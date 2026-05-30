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
    const isActive = data.find((d) => d.label === payload.value)?.month === selectedMonth;
    return (
      <text
        fill={isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)"}
        fontSize={isActive ? 13 : 12}
        fontWeight={isActive ? 600 : 400}
        textAnchor="middle"
        x={Number(x)}
        y={Number(y) + 12}
      >
        {payload.value}
      </text>
    );
  }

  return ActiveMonthTickRenderer;
}
