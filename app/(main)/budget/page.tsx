import { mockBudgets } from "@/lib/mock-data";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import {
  Badge,
  Card,
  ProgressBar,
  SectionHeader,
  StatCard,
} from "@/components/ui";
import type { Budget } from "@/lib/mock-data";

export const metadata = { title: "Budget" };

/*
  Semáforo de presupuesto:
  - Verde  (positive): < 70% gastado — bien encaminado
  - Amarillo (warning): 70–99% gastado — casi al límite
  - Rojo  (negative): ≥ 100% gastado — presupuesto rebasado
*/
function budgetTone(ratio: number): "positive" | "warning" | "negative" {
  if (ratio >= 1) return "negative";
  if (ratio >= 0.7) return "warning";
  return "positive";
}

function budgetStatusLabel(ratio: number): string {
  if (ratio >= 1) return "Over budget";
  if (ratio >= 0.9) return "Critical";
  if (ratio >= 0.7) return "Warning";
  return "On track";
}

const toneBadge: Record<ReturnType<typeof budgetTone>, "positive" | "warning" | "negative"> = {
  positive: "positive",
  warning: "warning",
  negative: "negative",
};

function BudgetCard({ budget }: { budget: Budget }) {
  const ratio = budget.allocated === 0 ? 0 : budget.spent / budget.allocated;
  const remaining = budget.allocated - budget.spent;
  const tone = budgetTone(ratio);
  const isOver = ratio >= 1;

  return (
    <Card>
      {/* Header de la card */}
      <div className="mb-4 flex items-start gap-4">
        <span
          aria-hidden="true"
          className="mt-0.5 h-10 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: budget.color }}
        />
        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-white">{budget.label}</p>
            <p className="mt-0.5 text-sm text-text-secondary">
              {formatCurrency(budget.spent, budget.currency)} of{" "}
              {formatCurrency(budget.allocated, budget.currency)}
            </p>
          </div>
          <Badge
            label={budgetStatusLabel(ratio)}
            tone={toneBadge[tone]}
            size="sm"
          />
        </div>
      </div>

      {/* Barra de progreso con color semáforo */}
      <ProgressBar value={Math.min(ratio, 1)} autoColor size="md" />

      {/* Footer: porcentaje y restante/exceso */}
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-medium text-white">{formatPercent(ratio, 1)}</span>
        {isOver ? (
          <span className="text-negative-400">
            +{formatCurrency(Math.abs(remaining), budget.currency)} over
          </span>
        ) : (
          <span className="text-text-secondary">
            {formatCurrency(remaining, budget.currency)} left
          </span>
        )}
      </div>
    </Card>
  );
}

export default function BudgetPage() {
  const totalAllocated = mockBudgets.reduce((s, b) => s + b.allocated, 0);
  const totalSpent = mockBudgets.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalAllocated - totalSpent;
  const overallRatio = totalAllocated === 0 ? 0 : totalSpent / totalAllocated;

  const onTrack = mockBudgets.filter(
    (b) => b.spent / b.allocated < 0.7
  );
  const atRisk = mockBudgets.filter((b) => {
    const r = b.spent / b.allocated;
    return r >= 0.7 && r < 1;
  });
  const overBudget = mockBudgets.filter((b) => b.spent >= b.allocated);

  return (
    <section className="flex flex-1 flex-col">
      <SectionHeader
        eyebrow="Planning"
        eyebrowClassName="bg-gradient-to-r from-brand-300 to-warning-400 bg-clip-text text-transparent"
        title="Budget"
        actions={
          <Badge
            label={
              overBudget.length > 0
                ? `${overBudget.length} over budget`
                : "All on track"
            }
            tone={overBudget.length > 0 ? "negative" : "positive"}
            size="md"
          />
        }
      />

      <div className="space-y-8 px-4 py-6 md:px-8">
        {/* ── Resumen global ── */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total budget"
            value={formatCurrency(totalAllocated)}
            detail={`${mockBudgets.length} categories`}
            tone="brand"
          />
          <StatCard
            label="Spent"
            value={formatCurrency(totalSpent)}
            detail={formatPercent(overallRatio, 1) + " of budget"}
            tone={overallRatio >= 1 ? "negative" : overallRatio >= 0.7 ? "warning" : "positive"}
          />
          <StatCard
            label="Remaining"
            value={formatCurrency(Math.abs(totalRemaining))}
            detail={totalRemaining < 0 ? "Over budget" : "Available to spend"}
            tone={totalRemaining < 0 ? "negative" : "positive"}
          />
          <StatCard
            label="Categories at risk"
            value={String(atRisk.length + overBudget.length)}
            detail={`${onTrack.length} on track`}
            tone={overBudget.length > 0 ? "negative" : "warning"}
          />
        </section>

        {/* ── Progress global ── */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-white">Overall spending</p>
            <p className="text-sm text-text-secondary">{formatPercent(overallRatio, 1)}</p>
          </div>
          <ProgressBar value={Math.min(overallRatio, 1)} autoColor size="md" />
          <div className="mt-3 flex justify-between text-xs text-text-muted">
            <span>{formatCurrency(totalSpent)} spent</span>
            <span>{formatCurrency(totalAllocated)} budget</span>
          </div>
        </Card>

        {/* ── Over budget ── */}
        {overBudget.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.22em] text-text-muted">
                Over budget
              </p>
              <Badge label={`${overBudget.length} categories`} tone="negative" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {overBudget.map((b) => (
                <BudgetCard budget={b} key={b.id} />
              ))}
            </div>
          </section>
        )}

        {/* ── At risk ── */}
        {atRisk.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.22em] text-text-muted">
                Approaching limit
              </p>
              <Badge label={`${atRisk.length} categories`} tone="warning" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {atRisk.map((b) => (
                <BudgetCard budget={b} key={b.id} />
              ))}
            </div>
          </section>
        )}

        {/* ── On track ── */}
        {onTrack.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.22em] text-text-muted">
                On track
              </p>
              <Badge label={`${onTrack.length} categories`} tone="positive" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {onTrack.map((b) => (
                <BudgetCard budget={b} key={b.id} />
              ))}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
