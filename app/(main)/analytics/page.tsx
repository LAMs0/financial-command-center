import { mockTransactions } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/formatters";
import { Badge, Card, CardHeader, ProgressBar, SectionHeader, StatCard } from "@/components/ui";
import SpendingDonutChart from "@/components/dashboard/SpendingDonutChart";

export const metadata = { title: "Analytics" };

const expensesByCategory = mockTransactions
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
const totalIncome = mockTransactions
  .filter((transaction) => transaction.type === "income")
  .reduce((sum, transaction) => sum + transaction.amount, 0);
const savingsRate = totalIncome === 0 ? 0 : (totalIncome - totalExpenses) / totalIncome;

export default function AnalyticsPage() {
  const largestCategory = categoryRows[0];

  return (
    <section className="flex flex-1 flex-col">
      <SectionHeader
        eyebrow="Insights"
        title="Analytics"
        actions={<Badge label="Mock analysis" tone="neutral" size="md" />}
      />

      <div className="space-y-6 px-4 py-6 md:px-8">
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Income" value={formatCurrency(totalIncome)} detail="Recorded inflow" tone="positive" />
          <StatCard label="Expenses" value={formatCurrency(totalExpenses)} detail="Categorized outflow" tone="negative" />
          <StatCard
            label="Savings rate"
            value={`${(savingsRate * 100).toFixed(1)}%`}
            detail={largestCategory ? `Top spend: ${largestCategory[0]}` : "No expenses"}
            tone="info"
          />
        </section>

        <Card padded={false}>
          <CardHeader
            title="Expense Mix"
            subtitle="Donut view of spending concentration by category"
            action={<Badge label={`${categoryRows.length} categories`} tone="info" />}
          />
          <SpendingDonutChart data={categoryChartData} total={totalExpenses} />
        </Card>

        <Card padded={false}>
          <CardHeader
            title="Spending by Category"
            subtitle="Expense concentration across the current mock period"
          />
          <div className="divide-y divide-white/10">
            {categoryRows.map(([category, amount]) => {
              const pct = totalExpenses > 0 ? amount / totalExpenses : 0;

              return (
                <div className="px-5 py-4" key={category}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="font-medium capitalize text-white">{category}</p>
                    <p className="text-sm text-text-secondary">
                      {formatCurrency(amount)} / {(pct * 100).toFixed(1)}%
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
