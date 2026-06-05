import { getBudgets } from "@/lib/data";
import {
  Car,
  Dumbbell,
  Home,
  ShoppingBag,
  Tv2,
  Utensils,
  Zap,
  type LucideIcon,
} from "lucide-react";
import EmptyStateActions from "@/components/onboarding/EmptyStateActions";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import {
  Badge,
  Card,
  EmptyState,
  ProgressBar,
  SectionHeader,
  StatCard,
} from "@/components/ui";
import { tx, type Locale } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import type { Budget } from "@/types/finance";

export const metadata = { title: "Presupuesto" };

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

function budgetStatusLabel(ratio: number, locale: Locale): string {
  if (ratio >= 1) return tx(locale, "Rebasado");
  if (ratio >= 0.9) return tx(locale, "Critico");
  if (ratio >= 0.7) return tx(locale, "Atencion");
  return tx(locale, "En rango");
}

const budgetIcons: Record<string, LucideIcon> = {
  Car,
  Dumbbell,
  Home,
  ShoppingBag,
  Tv2,
  Utensils,
  Zap,
};

function BudgetCard({ budget, locale }: { budget: Budget; locale: Locale }) {
  const t = (text: string) => tx(locale, text);
  const ratio = budget.allocated === 0 ? 0 : budget.spent / budget.allocated;
  const remaining = budget.allocated - budget.spent;
  const tone = budgetTone(ratio);
  const isOver = ratio >= 1;
  const Icon = budgetIcons[budget.icon] ?? Zap;

  return (
    <Card>
      {/* Header de la card */}
      <div className="mb-4 flex items-start gap-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="h-10 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: budget.color }}
          />
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.03]"
            style={{ color: budget.color }}
          >
            <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          </span>
        </div>
        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-text-primary">{budget.label}</p>
            <p className="mt-0.5 text-sm tabular-nums text-text-secondary">
              {formatCurrency(budget.spent, budget.currency)} {t("de")}{" "}
              {formatCurrency(budget.allocated, budget.currency)}
            </p>
          </div>
          <Badge
            label={budgetStatusLabel(ratio, locale)}
            tone={tone}
            size="sm"
          />
        </div>
      </div>

      {/* Barra de progreso con color semáforo */}
      <ProgressBar value={Math.min(ratio, 1)} autoColor size="md" />

      {/* Footer: porcentaje y restante/exceso */}
      <div className="mt-3 flex items-center justify-between text-sm tabular-nums">
        <span className="font-medium text-text-primary">{formatPercent(ratio, 1)}</span>
        {isOver ? (
          <span className="text-negative-400">
            +{formatCurrency(Math.abs(remaining), budget.currency)} {t("excedido")}
          </span>
        ) : (
          <span className="text-text-secondary">
            {formatCurrency(remaining, budget.currency)} {t("disponible")}
          </span>
        )}
      </div>
    </Card>
  );
}

export default async function BudgetPage() {
  const [budgets, locale] = await Promise.all([getBudgets(), getLocale()]);
  const t = (text: string) => tx(locale, text);
  const totalAllocated = budgets.reduce((s, b) => s + b.allocated, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalAllocated - totalSpent;
  const overallRatio = totalAllocated === 0 ? 0 : totalSpent / totalAllocated;

  const budgetsWithRatio = budgets.map((b) => ({
    ...b,
    ratio: b.allocated === 0 ? 0 : b.spent / b.allocated,
  }));
  const onTrack = budgetsWithRatio.filter((b) => b.ratio < 0.7);
  const atRisk = budgetsWithRatio.filter((b) => b.ratio >= 0.7 && b.ratio < 1);
  const overBudget = budgetsWithRatio.filter((b) => b.ratio >= 1);

  if (budgets.length === 0) {
    return (
      <section className="flex flex-1 flex-col">
        <SectionHeader
          eyebrow={t("Planning")}
          eyebrowClassName="bg-gradient-to-r from-brand-300 to-warning-400 bg-clip-text text-transparent"
          title={t("Presupuesto")}
          actions={<Badge label={t("Sin categorias")} tone="neutral" size="md" />}
        />

        <div className="px-4 py-6 md:px-8">
          <Card padded={false}>
            <EmptyState
              icon={<Zap aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />}
              title={t("No hay categorias de presupuesto")}
              description={t("Tus presupuestos mensuales por categoria apareceran aqui cuando importes transacciones o cargues datos de ejemplo.")}
              action={<EmptyStateActions />}
            />
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col">
      <SectionHeader
        eyebrow={t("Planning")}
        eyebrowClassName="bg-gradient-to-r from-brand-300 to-warning-400 bg-clip-text text-transparent"
        title={t("Presupuesto")}
        actions={
          <Badge
            label={
              overBudget.length > 0
                ? `${overBudget.length} ${t("rebasadas")}`
                : t("Todo en rango")
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
            label={t("Presupuesto total")}
            value={formatCurrency(totalAllocated)}
            detail={`${budgets.length} ${t("categorias")}`}
            tone="brand"
          />
          <StatCard
            label={t("Gastado")}
            value={formatCurrency(totalSpent)}
            detail={`${formatPercent(overallRatio, 1)} ${t("del presupuesto")}`}
            tone={overallRatio >= 1 ? "negative" : overallRatio >= 0.7 ? "warning" : "positive"}
          />
          <StatCard
            label={t("Disponible")}
            value={formatCurrency(Math.abs(totalRemaining))}
            detail={totalRemaining < 0 ? t("Presupuesto rebasado") : t("Disponible para gastar")}
            tone={totalRemaining < 0 ? "negative" : "positive"}
          />
          <StatCard
            label={t("Categorias en riesgo")}
            value={String(atRisk.length + overBudget.length)}
            detail={`${onTrack.length} ${t("en rango")}`}
            tone={overBudget.length > 0 ? "negative" : "warning"}
          />
        </section>

        {/* ── Progress global ── */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-text-primary">{t("Gasto total")}</p>
            <p className="text-sm tabular-nums text-text-secondary">{formatPercent(overallRatio, 1)}</p>
          </div>
          <ProgressBar value={Math.min(overallRatio, 1)} autoColor size="md" />
          <div className="mt-3 flex justify-between text-xs tabular-nums text-text-muted">
            <span>{formatCurrency(totalSpent)} {t("gastado")}</span>
            <span>{formatCurrency(totalAllocated)} {t("presupuestado")}</span>
          </div>
        </Card>

        {/* ── Over budget ── */}
        {overBudget.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.22em] text-text-muted">
                {t("Rebasado")}
              </p>
              <Badge label={`${overBudget.length} ${t("categorias")}`} tone="negative" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {overBudget.map((b) => (
                <BudgetCard budget={b} key={b.id} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {/* ── At risk ── */}
        {atRisk.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.22em] text-text-muted">
                {t("Cerca del limite")}
              </p>
              <Badge label={`${atRisk.length} ${t("categorias")}`} tone="warning" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {atRisk.map((b) => (
                <BudgetCard budget={b} key={b.id} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {/* ── On track ── */}
        {onTrack.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.22em] text-text-muted">
                {t("En rango")}
              </p>
              <Badge label={`${onTrack.length} ${t("categorias")}`} tone="positive" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {onTrack.map((b) => (
                <BudgetCard budget={b} key={b.id} locale={locale} />
              ))}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
