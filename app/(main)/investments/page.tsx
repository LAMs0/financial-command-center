import { getInvestments } from "@/lib/data";
import { calculateInvestmentGain, calculatePortfolioSummary, buildAllocationData } from "@/lib/calculations";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Badge, Card, CardHeader, EmptyState, SectionHeader, StatCard } from "@/components/ui";
import PortfolioAllocationChart from "@/components/charts/PortfolioAllocationChart";
import EmptyStateActions from "@/components/onboarding/EmptyStateActions";
import { LineChart } from "lucide-react";

export const metadata = { title: "Inversiones" };

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
        title="Inversiones"
        actions={<Badge label={`${investments.length} posiciones`} tone="info" size="md" />}
      />

      <div className="space-y-6 px-4 py-6 md:px-8">
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Valor del portafolio" value={formatCurrency(totalValue)} detail="Valuado con precios actuales" tone="info" />
          <StatCard
            label="Ganancia no realizada"
            value={formatCurrency(totalGain)}
            detail={formatPercent(totalGainPercent)}
            tone={totalGain >= 0 ? "positive" : "negative"}
          />
          <StatCard label="Costo base" value={formatCurrency(costBasis)} detail="Capital invertido" tone="brand" />
        </section>

        {investments.length === 0 ? (
          <Card padded={false}>
            <EmptyState
              icon={<LineChart aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />}
              title="No hay inversiones registradas"
              description="Las posiciones, costos base y graficas de asignacion apareceran aqui."
              action={<EmptyStateActions />}
            />
          </Card>
        ) : (
        <Card padded={false}>
          <CardHeader
            title="Asignacion del portafolio"
            subtitle="Composición del portafolio por tipo de activo"
            action={<Badge label={`${allocationData.length} tipos de activo`} tone="info" />}
          />
          <PortfolioAllocationChart data={allocationData} total={totalValue} />
        </Card>
        )}

        <Card padded={false}>
          <CardHeader title="Posiciones" subtitle="Activos, instituciones y rendimiento no realizado" />
          <div className="divide-y divide-white/10">
            {investments.length === 0 ? (
              <EmptyState
                icon={<LineChart aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />}
                title="No hay posiciones"
                description="Tus activos apareceran aqui con institucion y rendimiento no realizado."
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
                      {investment.institution} / {investment.quantity} unidades / Prom. {formatCurrency(investment.purchasePrice, investment.currency)}
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
