import { getTransactions, getMonthlyHistory } from "@/lib/data";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Badge, Card, CardHeader, EmptyState, ExportMenu, ProgressBar, SectionHeader, StatCard } from "@/components/ui";
import SpendingDonutChart from "@/components/dashboard/SpendingDonutChart";
import CashFlowChart from "@/components/charts/CashFlowChart";
import { ChartNoAxesCombined } from "lucide-react";
import EmptyStateActions from "@/components/onboarding/EmptyStateActions";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const [transactions, monthlyHistory] = await Promise.all([
    getTransactions(),
    getMonthlyHistory(),
  ]);

  const expensesByCategory = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce<Record<string, number>>((acc, transaction) => {
      acc[transaction.category] = (acc[transaction.category] ?? 0) + transaction.amount;
      return acc;
    }, {});

  const categoryRows = Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a);
  const categoryChartData = categoryRows.map(([category, amount]) => ({
    category,
    amount,
  }));
  const totalExpenses = categoryRows.reduce((sum, [, value]) => sum + value, 0);
  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const savingsRate = totalIncome === 0 ? 0 : (totalIncome - totalExpenses) / totalIncome;

  const largestCategory = categoryRows[0];
  const hasTransactions = transactions.length > 0;

  return (
    <section className="flex flex-1 flex-col">
      <SectionHeader
        eyebrow="Insights"
        eyebrowClassName="bg-gradient-to-r from-info-400 to-brand-300 bg-clip-text text-transparent"
        title="Analytics"
        actions={
          <div className="flex items-center gap-3">
            <Badge
              label={hasTransactions ? "Analisis activo" : "Sin analisis"}
              tone={hasTransactions ? "info" : "neutral"}
              size="md"
            />
            <ExportMenu
              datasets={["transactions", "accounts", "cards", "goals", "budgets"]}
              showReport
            />
          </div>
        }
      />

      <div className="space-y-6 px-4 py-6 md:px-8">
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Ingresos" value={formatCurrency(totalIncome)} detail="Entradas registradas" tone="positive" />
          <StatCard label="Gastos" value={formatCurrency(totalExpenses)} detail="Salidas categorizadas" tone="negative" />
          <StatCard
            label="Tasa de ahorro"
            value={formatPercent(savingsRate, 1)}
            detail={largestCategory ? `Mayor gasto: ${largestCategory[0]}` : "Sin gastos"}
            tone="info"
          />
        </section>

        <Card padded={false}>
          <CardHeader
            title="Flujo de caja - 6 meses"
            subtitle="Tendencia mensual de ingresos vs gastos"
            action={<Badge label="Ultimos 6 meses" tone="neutral" />}
          />
          <div className="px-2 pb-5">
            <CashFlowChart data={monthlyHistory} />
          </div>
        </Card>

        <Card padded={false}>
          <CardHeader
            title="Mezcla de gastos"
            subtitle="Concentracion de gastos por categoria"
            action={<Badge label={`${categoryRows.length} categorias`} tone="info" />}
          />
          {categoryRows.length === 0 ? (
            <EmptyState
              icon={<ChartNoAxesCombined aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />}
              title="Aun no hay mezcla de gastos"
              description="Las categorias de gasto apareceran aqui cuando tengas datos disponibles."
              action={<EmptyStateActions />}
            />
          ) : (
            <SpendingDonutChart data={categoryChartData} total={totalExpenses} />
          )}
        </Card>

        <Card padded={false}>
          <CardHeader
            title="Gasto por categoria"
            subtitle="Concentracion de gasto del periodo actual"
          />
          <div className="divide-y divide-white/10">
            {categoryRows.length === 0 ? (
              <EmptyState
                icon={<ChartNoAxesCombined aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />}
                title="No hay desglose por categoria"
                description="La tabla de gastos por categoria aparecera cuando existan transacciones categorizadas."
                action={<EmptyStateActions />}
              />
            ) : categoryRows.map(([category, amount]) => {
              const pct = totalExpenses > 0 ? amount / totalExpenses : 0;

              return (
                <div className="px-5 py-4" key={category}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="font-medium capitalize text-text-primary">{category}</p>
                    <p className="text-sm tabular-nums text-text-secondary">
                      {formatCurrency(amount)} / {formatPercent(pct, 1)}
                    </p>
                  </div>
                  <ProgressBar value={pct} color="var(--color-brand-500)" />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </section>
  );
}
