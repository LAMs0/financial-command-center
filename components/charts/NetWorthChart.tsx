"use client";

/*
  NetWorthChart — evolución del patrimonio neto a lo largo de 6 meses.

  Lee MonthContext para resaltar el mes activo con un punto (dot) especial.
  Cuando el usuario cambia el mes en MonthSelector, el punto se mueve.

  Técnicas importantes:
  - `useEffect + requestAnimationFrame` para evitar hidratación SSR/client.
  - `ResponsiveContainer` adapta el chart al ancho disponible.
  - `defs + linearGradient` crea el degradado del área bajo la curva.
  - `activeDot` personalizado resalta el mes seleccionado permanentemente.
*/

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Dot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatCompact } from "@/lib/formatters";
import { useMonth } from "@/contexts/MonthContext";
import type { MonthlySnapshot } from "@/types/finance";
import { ActiveMonthTick, type ChartTooltipProps } from "./_chartUtils";

interface NetWorthChartProps {
  data: MonthlySnapshot[];
}

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const netWorth = payload.find((p) => p.dataKey === "netWorth")?.value ?? 0;
  const assets = payload.find((p) => p.dataKey === "assets")?.value ?? 0;
  const liabilities = payload.find((p) => p.dataKey === "liabilities")?.value ?? 0;

  return (
    <div className="rounded-xl border border-white/12 bg-surface-raised px-4 py-3 shadow-2xl shadow-black/40">
      <p className="mb-2 text-xs uppercase tracking-[0.18em] text-text-secondary">{label}</p>
      <p className="text-lg font-semibold tabular-nums text-text-primary">{formatCurrency(Number(netWorth))}</p>
      <div className="mt-2 space-y-1 text-xs tabular-nums text-text-secondary">
        <p>Assets: <span className="text-positive-400">{formatCurrency(Number(assets))}</span></p>
        <p>Liabilities: <span className="text-negative-400">{formatCurrency(Number(liabilities))}</span></p>
      </div>
    </div>
  );
}

export default function NetWorthChart({ data }: NetWorthChartProps) {
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const { selectedMonth } = useMonth();
  const isReady = mounted || shouldReduceMotion;

  useEffect(() => {
    if (shouldReduceMotion) {
      return;
    }

    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, [shouldReduceMotion]);

  const minValue = Math.min(...data.map((d) => d.netWorth));
  const maxValue = Math.max(...data.map((d) => d.netWorth));
  const yMin = Math.floor((minValue * 0.97) / 10_000) * 10_000;
  const yMax = Math.ceil((maxValue * 1.02) / 10_000) * 10_000;

  if (!isReady) {
    return <div className="h-64 animate-pulse rounded-lg bg-white/[0.03]" />;
  }

  return (
    <div aria-label="Net worth chart showing monthly net worth trend" role="img">
    <ResponsiveContainer height={256} width="100%">
      <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="netWorthGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-positive-500)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-positive-500)" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid
          stroke="color-mix(in oklab, var(--color-text-primary) 8%, transparent)"
          strokeDasharray="3 3"
          vertical={false}
        />

        <XAxis
          axisLine={false}
          dataKey="label"
          tick={ActiveMonthTick(data, selectedMonth)}
          tickLine={false}
        />

        <YAxis
          axisLine={false}
          domain={[yMin, yMax]}
          tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }}
          tickFormatter={(value) => formatCompact(value)}
          tickLine={false}
          width={72}
        />

        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: "color-mix(in oklab, var(--color-text-primary) 16%, transparent)", strokeWidth: 1 }}
        />

        <Area
          dataKey="netWorth"
          isAnimationActive={!shouldReduceMotion}
          dot={(props) => {
            // Solo dibuja un dot visible para el mes seleccionado
            const isSelected = props.payload?.month === selectedMonth;
            if (!isSelected) return <Dot key={props.key} r={0} cx={props.cx} cy={props.cy} fill="transparent" />;
            return (
              <Dot
                key={props.key}
                cx={props.cx}
                cy={props.cy}
                fill="var(--color-positive-500)"
                r={5}
                stroke="var(--color-surface-base)"
                strokeWidth={2}
              />
            );
          }}
          fill="url(#netWorthGradient)"
          fillOpacity={1}
          stroke="var(--color-positive-500)"
          strokeWidth={2.5}
          type="monotone"
        />
      </AreaChart>
    </ResponsiveContainer>
    </div>
  );
}
