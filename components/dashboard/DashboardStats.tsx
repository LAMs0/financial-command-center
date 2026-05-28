"use client";

/*
  DashboardStats — fila de StatCards reactiva al mes seleccionado.

  ¿Por qué este componente existe separado del dashboard page?
  ──────────────────────────────────────────────────────────────
  El dashboard page es un Server Component (no puede leer Context).
  Las StatCards necesitan el mes seleccionado, que vive en MonthContext.
  Solución: el server page pasa todos los datos históricos como props,
  y este Client Component elige los del mes activo.

  Patrón: "Server passes all data → Client picks what to show"
  Es más eficiente que hacer un fetch desde el cliente.
*/

import { useMonth } from "@/contexts/MonthContext";
import { StatCard, MonthSelector } from "@/components/ui";
import { formatCurrency, formatPercent, formatCompact } from "@/lib/formatters";
import type { MonthlySnapshot } from "@/lib/mock-data";

interface DashboardStatsProps {
  history: MonthlySnapshot[];
  /** Valores estáticos (deuda, utilización) que no cambian por mes */
  staticData: {
    totalCreditBalance: number;
    creditUtilization: number;
    totalCreditLimit: number;
    numCards: number;
  };
}

export default function DashboardStats({ history, staticData }: DashboardStatsProps) {
  const { snapshot } = useMonth();

  // Si no hay snapshot del mes seleccionado, usamos el último disponible
  const current = snapshot ?? history[history.length - 1];

  // Calculamos la variación vs el mes anterior
  const currentIndex = history.findIndex((h) => h.month === current.month);
  const previous = currentIndex > 0 ? history[currentIndex - 1] : null;

  const netWorthTrend = previous
    ? (current.netWorth - previous.netWorth) / previous.netWorth
    : 0;

  const netCashFlow = current.income - current.expenses;
  const savingsRate = current.income === 0 ? 0 : netCashFlow / current.income;

  const sparklineNetWorth = history.map((h) => h.netWorth);
  const sparklineCashFlow = history.map((h) => h.income - h.expenses);
  const sparklineDebt = history.map(() => staticData.totalCreditBalance);
  const sparklineUtil = history.map(() => staticData.creditUtilization);

  return (
    <div className="space-y-4">
      {/* Selector de mes */}
      <MonthSelector months={history} />

      {/* StatCards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Net worth"
          value={formatCurrency(current.netWorth)}
          detail={`${netWorthTrend >= 0 ? "+" : ""}${formatPercent(netWorthTrend)} vs prev month`}
          tone={netWorthTrend >= 0 ? "positive" : "negative"}
          sparkline={sparklineNetWorth}
        />
        <StatCard
          label="Cash flow"
          value={formatCurrency(netCashFlow)}
          detail={`${formatCompact(current.income)} in / ${formatCompact(current.expenses)} out — ${formatPercent(savingsRate, 0)} saved`}
          tone={netCashFlow >= 0 ? "positive" : "negative"}
          sparkline={sparklineCashFlow}
        />
        <StatCard
          label="Debt"
          value={formatCurrency(staticData.totalCreditBalance)}
          detail={`${staticData.numCards} active credit lines`}
          tone="warning"
          sparkline={sparklineDebt}
        />
        <StatCard
          label="Credit utilization"
          value={formatPercent(staticData.creditUtilization)}
          detail={`${formatCompact(staticData.totalCreditLimit)} total limit`}
          tone={staticData.creditUtilization > 0.3 ? "warning" : "positive"}
          sparkline={sparklineUtil}
        />
      </div>
    </div>
  );
}
