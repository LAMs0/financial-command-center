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
import { CountUpValue, StatCard, MonthSelector } from "@/components/ui";
import { formatCurrency, formatPercent, formatCompact } from "@/lib/formatters";
import { tx, type Locale } from "@/lib/i18n/config";
import type { MonthlySnapshot } from "@/types/finance";

interface DashboardStatsProps {
  history: MonthlySnapshot[];
  locale?: Locale;
  /** Valores estáticos (deuda, utilización) que no cambian por mes */
  staticData: {
    totalCreditBalance: number;
    creditUtilization: number;
    totalCreditLimit: number;
    numCards: number;
  };
}

export default function DashboardStats({ history, locale = "es", staticData }: DashboardStatsProps) {
  const t = (text: string) => tx(locale, text);
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
  const sparklineDebt = Array<number>(history.length).fill(staticData.totalCreditBalance);
  const sparklineUtil = Array<number>(history.length).fill(staticData.creditUtilization);

  return (
    <div className="space-y-4">
      {/* Selector de mes */}
      <MonthSelector months={history} />

      {/* StatCards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          className="xl:col-span-2"
          label={t("Patrimonio")}
          value={<CountUpValue value={current.netWorth} format={formatCurrency} />}
          detail={`${netWorthTrend >= 0 ? "+" : ""}${formatPercent(netWorthTrend)} ${t("vs mes anterior")}`}
          tone={netWorthTrend >= 0 ? "positive" : "negative"}
          sparkline={sparklineNetWorth}
        />
        <StatCard
          label={t("Flujo de caja")}
          value={<CountUpValue value={netCashFlow} format={formatCurrency} />}
          detail={`${formatCompact(current.income)} ${t("ingresos")} / ${formatCompact(current.expenses)} ${t("gastos")} - ${formatPercent(savingsRate, 0)} ${t("ahorrado")}`}
          tone={netCashFlow >= 0 ? "positive" : "negative"}
          sparkline={sparklineCashFlow}
        />
        <StatCard
          label={t("Deuda")}
          value={<CountUpValue value={staticData.totalCreditBalance} format={formatCurrency} />}
          detail={`${staticData.numCards} ${t("lineas de credito activas")}`}
          tone="warning"
          sparkline={sparklineDebt}
        />
        <StatCard
          label={t("Uso de credito")}
          value={
            <CountUpValue
              value={staticData.creditUtilization}
              format={(value) => formatPercent(value)}
            />
          }
          detail={`${formatCompact(staticData.totalCreditLimit)} ${t("limite total")}`}
          tone={staticData.creditUtilization > 0.3 ? "warning" : "positive"}
          sparkline={sparklineUtil}
        />
      </div>
    </div>
  );
}
