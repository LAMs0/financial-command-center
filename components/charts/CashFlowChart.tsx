"use client";

/*
  CashFlowChart — ingresos vs gastos mensuales (últimos 6 meses).

  Reacciona a MonthContext: el mes seleccionado tiene barras a plena
  opacidad, los demás se atenúan al 35%.

  Técnica: en lugar de usar `fill` fijo en <Bar>, usamos un `Cell`
  por cada punto de datos con opacity dinámica.
*/

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompact, formatCurrency } from "@/lib/formatters";
import { useMonth } from "@/contexts/MonthContext";
import type { MonthlySnapshot } from "@/lib/mock-data";

interface CashFlowChartProps {
  data: MonthlySnapshot[];
}

interface ChartTooltipPayload {
  dataKey?: string | number;
  value?: number | string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipPayload[];
  label?: string | number;
}

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const income = payload.find((p) => p.dataKey === "income")?.value ?? 0;
  const expenses = payload.find((p) => p.dataKey === "expenses")?.value ?? 0;
  const savings = Number(income) - Number(expenses);

  return (
    <div className="min-w-[160px] rounded-xl border border-white/12 bg-surface-raised px-4 py-3 shadow-2xl shadow-black/40">
      <p className="mb-2 text-xs uppercase tracking-[0.18em] text-text-secondary">{label}</p>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between gap-6">
          <span className="text-text-secondary">Income</span>
          <span className="font-medium text-positive-400">{formatCurrency(Number(income))}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-text-secondary">Expenses</span>
          <span className="font-medium text-negative-400">{formatCurrency(Number(expenses))}</span>
        </div>
        <div className="mt-1 flex justify-between gap-6 border-t border-white/10 pt-1.5">
          <span className="text-text-secondary">Saved</span>
          <span className={`font-semibold ${savings >= 0 ? "text-positive-400" : "text-negative-400"}`}>
            {savings >= 0 ? "+" : ""}{formatCurrency(savings)}
          </span>
        </div>
      </div>
    </div>
  );
}

function CustomLegend() {
  return (
    <div className="flex justify-end gap-5 pb-1 pr-2 text-xs text-text-secondary">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-positive-500" /> Income
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-negative-500" /> Expenses
      </span>
    </div>
  );
}

export default function CashFlowChart({ data }: CashFlowChartProps) {
  const [mounted, setMounted] = useState(false);
  const { selectedMonth } = useMonth();

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!mounted) {
    return <div className="h-64 animate-pulse rounded-lg bg-white/[0.03]" />;
  }

  return (
    <ResponsiveContainer height={256} width="100%">
      <BarChart
        barCategoryGap="28%"
        barGap={4}
        data={data}
        margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
      >
        <CartesianGrid
          stroke="rgba(255,255,255,0.05)"
          strokeDasharray="3 3"
          vertical={false}
        />

        <XAxis
          axisLine={false}
          dataKey="label"
          tick={({ x, y, payload }) => {
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
          }}
          tickLine={false}
        />

        <YAxis
          axisLine={false}
          tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }}
          tickFormatter={(v) => formatCompact(v)}
          tickLine={false}
          width={72}
        />

        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />

        <Legend content={<CustomLegend />} verticalAlign="top" />

        {/* Income bars — plena opacidad en el mes activo, atenuadas en los demás */}
        <Bar dataKey="income" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell
              fill="var(--color-positive-500)"
              fillOpacity={entry.month === selectedMonth ? 1 : 0.3}
              key={entry.month}
            />
          ))}
        </Bar>

        {/* Expense bars — misma lógica */}
        <Bar dataKey="expenses" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell
              fill="var(--color-negative-500)"
              fillOpacity={entry.month === selectedMonth ? 1 : 0.3}
              key={entry.month}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
