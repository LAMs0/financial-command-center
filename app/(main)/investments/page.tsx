import { getInvestments } from "@/lib/data";
import { calculateInvestmentGain, calculatePortfolioSummary, buildAllocationData } from "@/lib/calculations";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Badge, Card, CardHeader, EmptyState, SectionHeader, StatCard } from "@/components/ui";
import PortfolioAllocationChart from "@/components/charts/PortfolioAllocationChart";
import EmptyStateActions from "@/components/onboarding/EmptyStateActions";
import { LineChart } from "lucide-react";

export const metadata = { title: "Investments" };

export default async function InvestmentsPage() {
  const investments = await getInvestments();
  const { totalValue, totalGain, costBasis, totalGainPercent } = calculatePortfolioSummary(investments);

  // Pre-compute gains once — reused in the summary stats and the positions list
  const gainsById = new Map(
    investments.map((inv) => [inv.id, calculateInvestmentGain(inv)])
  );

  const allocationData = buildAllocationData(investments);

  return (
    <section className="flex flex-1 flex-col">
      <SectionHeader
        eyebrow="Portfolio"
        eyebrowClassName="bg-gradient-to-r from-info-400 to-positive-400 bg-clip-text text-transparent"
        title="Investments"
        actions={<Badge label={`${investments.length} positions`} tone="info" size="md" />}
      />

      <div className="space-y-6 px-4 py-6 md:px-8">
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Portfolio value" value={formatCurrency(totalValue)} detail="Marked to mock prices" tone="info" />
          <StatCard
            label="Unrealized gain"
            value={formatCurrency(totalGain)}
            detail={formatPercent(totalGainPercent)}
            tone={totalGain >= 0 ? "positive" : "negative"}
          />
          <StatCard label="Cost basis" value={formatCurrency(costBasis)} detail="Original capital deployed" tone="brand" />
        </section>

        {investments.length === 0 ? (
          <Card padded={false}>
            <EmptyState
              icon={<LineChart aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />}
              title="No investments tracked"
              description="Positions, cost basis and allocation charts will appear here when investments are added."
              action={<EmptyStateActions />}
            />
          </Card>
        ) : (
        <Card padded={false}>
          <CardHeader
            title="Portfolio Allocation"
            subtitle="Composición del portafolio por tipo de activo"
            action={<Badge label={`${allocationData.length} asset types`} tone="info" />}
          />
          <PortfolioAllocationChart data={allocationData} total={totalValue} />
        </Card>
        )}

        <Card padded={false}>
          <CardHeader title="Positions" subtitle="Holdings, institutions and unrealized return" />
          <div className="divide-y divide-white/10">
            {investments.length === 0 ? (
              <EmptyState
                icon={<LineChart aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />}
                title="No positions"
                description="Holdings will be listed here with institution metadata and unrealized return."
                action={<EmptyStateActions />}
              />
            ) : investments.map((investment) => {
              const { absoluteGain, percentageGain } = gainsById.get(investment.id)!;
              const isPositive = absoluteGain >= 0;
              const currentValue = investment.quantity * investment.currentPrice;

              return (
                <div
                  className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.04] md:grid-cols-[1fr_auto]"
                  key={investment.id}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-text-primary">{investment.name}</p>
                      <Badge label={investment.ticker ?? investment.type} tone="neutral" />
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">
                      {investment.institution} / {investment.quantity} units / Avg {formatCurrency(investment.purchasePrice, investment.currency)}
                    </p>
                  </div>
                  <div className="text-left tabular-nums md:text-right">
                    <p className="font-semibold text-text-primary">
                      {formatCurrency(currentValue, investment.currency)}
                    </p>
                    <p className={`text-sm ${isPositive ? "text-positive-400" : "text-negative-400"}`}>
                      {isPositive ? "+" : ""}
                      {formatCurrency(absoluteGain, investment.currency)} ({formatPercent(percentageGain)})
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </section>
  );
}
