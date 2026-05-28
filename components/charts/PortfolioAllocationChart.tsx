"use client";

/*
  PortfolioAllocationChart — composición del portafolio por tipo de activo.

  Este archivo es "use client" porque usa Recharts (necesita el DOM).
  La función buildAllocationData y el tipo AllocationDatum viven en
  lib/calculations.ts para que los Server Components puedan usarlos.
*/

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import type { AllocationDatum } from "@/lib/calculations";

interface PortfolioAllocationChartProps {
  data: AllocationDatum[];
  total: number;
}

interface PortfolioTooltipPayload {
  value?: number | string;
  payload: AllocationDatum;
}

interface PortfolioTooltipProps {
  active?: boolean;
  payload?: PortfolioTooltipPayload[];
}

function CustomTooltip({ active, payload }: PortfolioTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];

  return (
    <div className="rounded-xl border border-white/12 bg-surface-raised px-4 py-3 shadow-2xl shadow-black/40">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: item.payload.color }}
        />
        <p className="text-sm font-medium text-white">{item.payload.label}</p>
      </div>
      <p className="mt-1 text-lg font-semibold text-white">
        {formatCurrency(Number(item.value))}
      </p>
    </div>
  );
}

export default function PortfolioAllocationChart({
  data,
  total,
}: PortfolioAllocationChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="grid gap-6 p-5 lg:grid-cols-[minmax(240px,0.85fr)_1fr] lg:items-center">
      {/* Donut */}
      <div className="relative h-64 min-h-64">
        {mounted ? (
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius="66%"
                outerRadius="86%"
                paddingAngle={3}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={2}
              >
                {data.map((entry) => (
                  <Cell fill={entry.color} key={entry.type} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full rounded-full border-[28px] border-white/10 animate-pulse" />
        )}

        {/* Valor total en el centro */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">Total</p>
            <p className="mt-1.5 text-xl font-semibold text-white">
              {formatCurrency(total)}
            </p>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="space-y-3">
        {data.map((item) => {
          const pct = total > 0 ? item.value / total : 0;

          return (
            <div
              className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3"
              key={item.type}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <p className="truncate font-medium text-white">{item.label}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">
                  {formatCurrency(item.value)}
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
