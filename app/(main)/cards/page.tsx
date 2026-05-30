import { getCards } from "@/lib/data";
import { calculateCardUtilization } from "@/lib/calculations";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Badge, Card, EmptyState, ProgressBar, SectionHeader, StatCard } from "@/components/ui";
import { CreditCard } from "lucide-react";

export const metadata = { title: "Cards" };
export const dynamic = "force-dynamic";

function daysUntilPayment(paymentDueDay: number) {
  const today = new Date();
  const candidate = new Date(today.getFullYear(), today.getMonth(), paymentDueDay);

  if (candidate < startOfDay(today)) {
    candidate.setMonth(candidate.getMonth() + 1);
  }

  const diff = candidate.getTime() - startOfDay(today).getTime();
  return Math.ceil(diff / 86_400_000);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function paymentTone(days: number) {
  if (days <= 3) return "negative";
  if (days <= 7) return "warning";
  return "info";
}

export default async function CardsPage() {
  const cards = await getCards();
  const totalDebt = cards.reduce((sum, card) => sum + card.balance, 0);
  const totalLimit = cards.reduce((sum, card) => sum + card.limit, 0);
  const aggregateUtilization = totalLimit === 0 ? 0 : totalDebt / totalLimit;
  const totalMinimumPayment = cards.reduce((sum, card) => sum + card.minimumPayment, 0);

  return (
    <section className="flex flex-1 flex-col">
      <SectionHeader
        eyebrow="Finances"
        eyebrowClassName="bg-gradient-to-r from-info-400 to-brand-300 bg-clip-text text-transparent"
        title="Credit Cards"
        actions={<Badge label={`${formatPercent(aggregateUtilization)} utilization`} tone={aggregateUtilization > 0.3 ? "warning" : "positive"} size="md" />}
      />

      <div className="space-y-6 px-4 py-6 md:px-8">
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total debt" value={formatCurrency(totalDebt)} detail={`${cards.length} active credit lines`} tone="warning" />
          <StatCard label="Total limit" value={formatCurrency(totalLimit)} detail="Available credit ceiling" tone="info" />
          <StatCard label="Minimum due" value={formatCurrency(totalMinimumPayment)} detail="Next payment cycle" tone="brand" />
        </section>

        {cards.length === 0 ? (
          <Card padded={false}>
            <EmptyState
              icon={<CreditCard aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />}
              title="No credit cards connected"
              description="Credit lines, payment dates and utilization alerts will appear here once cards are connected."
            />
          </Card>
        ) : (
        <section className="grid gap-4 xl:grid-cols-3">
          {cards.map((card) => {
            const utilization = calculateCardUtilization(card);
            const daysRemaining = daysUntilPayment(card.paymentDueDay);

            return (
              <Card key={card.id}>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-text-primary">{card.name}</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {card.institution} / Ends {card.lastFourDigits}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      label={formatPercent(utilization)}
                      tone={utilization > 0.3 ? "warning" : "positive"}
                    />
                    <Badge
                      label={`Next payment in ${daysRemaining}d`}
                      tone={paymentTone(daysRemaining)}
                    />
                  </div>
                </div>

                <ProgressBar value={utilization} autoColor size="md" />

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-white/[0.03] p-3">
                    <p className="text-text-secondary">Used</p>
                    <p className="mt-1 font-semibold tabular-nums text-text-primary">{formatCurrency(card.balance, card.currency)}</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] p-3">
                    <p className="text-text-secondary">Limit</p>
                    <p className="mt-1 font-semibold tabular-nums text-text-primary">{formatCurrency(card.limit, card.currency)}</p>
                  </div>
                </div>

                <div className="mt-4 flex justify-between text-sm tabular-nums text-text-secondary">
                  <span>Cutoff day {card.cutoffDay}</span>
                  <span>Due day {card.paymentDueDay}</span>
                </div>
              </Card>
            );
          })}
        </section>
        )}
      </div>
    </section>
  );
}
