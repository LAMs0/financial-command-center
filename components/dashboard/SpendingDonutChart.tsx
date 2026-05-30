"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatCurrency, formatPercent } from "@/lib/formatters";

interface SpendingDonutDatum {
  category: string;
  amount: number;
}

interface SpendingDonutChartProps {
  data: SpendingDonutDatum[];
  total: number;
}

const chartColors = [
  "var(--color-positive-500)",
  "var(--color-info-500)",
  "var(--color-warning-500)",
  "var(--color-negative-500)",
  "var(--color-brand-400)",
  "var(--color-brand-500)",
  "#8b5cf6",
];

export default function SpendingDonutChart({
  data,
  total,
}: SpendingDonutChartProps) {
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const chartData = data.map((item) => ({
    ...item,
    label: item.category.charAt(0).toUpperCase() + item.category.slice(1),
  }));

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="grid gap-6 p-5 lg:grid-cols-[minmax(260px,0.9fr)_1fr] lg:items-center">
      <div className="relative h-72 min-h-72">
        {mounted ? (
          <div aria-label="Expense mix donut chart by category" className="h-full" role="img">
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="amount"
                innerRadius="68%"
                isAnimationActive={!shouldReduceMotion}
                outerRadius="88%"
                paddingAngle={3}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    fill={chartColors[index % chartColors.length]}
                    key={entry.category}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface-raised)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 10,
                  color: "var(--color-text-primary)",
                }}
                formatter={(value) => [formatCurrency(Number(value)), "Spent"]}
                itemStyle={{ color: "var(--color-text-primary)" }}
                labelStyle={{ color: "var(--color-text-secondary)" }}
              />
            </PieChart>
          </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-full rounded-full border-[28px] border-white/10" />
        )}

        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
              Total spend
            </p>
            <p className="mt-2 text-2xl font-semibold text-white tabular-nums">
              {formatCurrency(total)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {chartData.map((item, index) => {
          const pct = total > 0 ? item.amount / total : 0;

          return (
            <div
              className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3"
              key={item.category}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: chartColors[index % chartColors.length] }}
                />
                <p className="truncate font-medium text-white">{item.label}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">
                  {formatCurrency(item.amount)}
                </p>
                <p className="text-xs text-text-secondary">
                  {formatPercent(pct, 1)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
