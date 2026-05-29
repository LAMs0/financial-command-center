import { mockInvestments } from "@/lib/mock-data";
import { calculateInvestmentGain, buildAllocationData } from "@/lib/calculations";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Badge, Card, CardHeader, SectionHeader, StatCard } from "@/components/ui";
import PortfolioAllocationChart from "@/components/charts/PortfolioAllocationChart";

export const metadata = { title: "Investments" };

export default function InvestmentsPage() {
  const totalValue = mockInvestments.reduce(
    (sum, investment) => sum + investment.quantity * investment.currentPrice,
    0
  );
  const totalGain = mockInvestments.reduce(
    (sum, investment) => sum + calculateInvestmentGain(investment).absoluteGain,
    0
  );
  const costBasis = totalValue - totalGain;
  const totalGainPercent = costBasis === 0 ? 0 : totalGain / costBasis;

  const allocationData = buildAllocationData(mockInvestments);

  return (
    <section className="flex flex-1 flex-col">
      <SectionHeader
        eyebrow="Portfolio"
        eyebrowClassName="bg-gradient-to-r from-info-400 to-positive-400 bg-clip-text text-transparent"
        title="Investments"
        actions={<Badge label={`${mockInvestments.length} positions`} tone="info" size="md" />}
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

        <Card padded={false}>
          <CardHeader
            title="Portfolio Allocation"
            subtitle="Composición del portafolio por tipo de activo"
            action={<Badge label={`${allocationData.length} asset types`} tone="info" />}
          />
          <PortfolioAllocationChart data={allocationData} total={totalValue} />
        </Card>

        <Card padded={false}>
          <CardHeader title="Positions" subtitle="Holdings, institutions and unrealized return" />
          <div className="divide-y divide-white/10">
            {mockInvestments.map((investment) => {
              const { absoluteGain, percentageGain } = calculateInvestmentGain(investment);
              const isPositive = absoluteGain >= 0;
              const currentValue = investment.quantity * investment.currentPrice;

              return (
                <div
                  className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.04] md:grid-cols-[1fr_auto]"
                  key={investment.id}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-white">{investment.name}</p>
                      <Badge label={investment.ticker ?? investment.type} tone="neutral" />
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">
                      {investment.institution} / {investment.quantity} units / Avg {formatCurrency(investment.purchasePrice, investment.currency)}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="font-semibold text-white">
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
