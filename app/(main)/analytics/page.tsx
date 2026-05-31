import { getTransactions, getMonthlyHistory } from "@/lib/data";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Badge, Card, CardHeader, EmptyState, ExportMenu, ProgressBar, SectionHeader, StatCard } from "@/components/ui";
import SpendingDonutChart from "@/components/dashboard/SpendingDonutChart";
import CashFlowChart from "@/components/charts/CashFlowChart";
import { ChartNoAxesCombined } from "lucide-react";

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

  return (
    <section className="flex flex-1 flex-col">
      <SectionHeader
        eyebrow="Insights"
        eyebrowClassName="bg-gradient-to-r from-info-400 to-brand-300 bg-clip-text text-transparent"
        title="Analytics"
        actions={
          <div className="flex items-center gap-3">
            <Badge label="Mock analysis" tone="neutral" size="md" />
            <ExportMenu
              datasets={["transactions", "accounts", "cards", "goals", "budgets"]}
              showReport
            />
          </div>
        }
      />

      <div className="space-y-6 px-4 py-6 md:px-8">
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Income" value={formatCurrency(totalIncome)} detail="Recorded inflow" tone="positive" />
          <StatCard label="Expenses" value={formatCurrency(totalExpenses)} detail="Categorized outflow" tone="negative" />
          <StatCard
            label="Savings rate"
            value={formatPercent(savingsRate, 1)}
            detail={largestCategory ? `Top spend: ${largestCategory[0]}` : "No expenses"}
            tone="info"
          />
        </section>

        <Card padded={false}>
          <CardHeader
            title="Cash Flow — 6 Months"
            subtitle="Monthly income vs expenses trend"
            action={<Badge label="Last 6 months" tone="neutral" />}
          />
          <div className="px-2 pb-5">
            <CashFlowChart data={monthlyHistory} />
          </div>
        </Card>

        <Card padded={false}>
          <CardHeader
            title="Expense Mix"
            subtitle="Donut view of spending concentration by category"
            action={<Badge label={`${categoryRows.length} categories`} tone="info" />}
          />
          {categoryRows.length === 0 ? (
            <EmptyState
              icon={<ChartNoAxesCombined aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />}
              title="No expense mix yet"
              description="Expense categories will appear here once spending data is available."
            />
          ) : (
            <SpendingDonutChart data={categoryChartData} total={totalExpenses} />
          )}
        </Card>

        <Card padded={false}>
          <CardHeader
            title="Spending by Category"
            subtitle="Expense concentration across the current mock period"
          />
          <div className="divide-y divide-white/10">
            {categoryRows.length === 0 ? (
              <EmptyState
                icon={<ChartNoAxesCombined aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />}
                title="No category breakdown"
                description="A ranked spending table will appear once categorized transactions exist."
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
