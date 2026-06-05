import { getGoals } from "@/lib/data";
import { calculateGoalProgress } from "@/lib/calculations";
import { formatCurrency, formatDate, formatPercent } from "@/lib/formatters";
import { Badge, Card, EmptyState, ProgressBar, SectionHeader, StatCard } from "@/components/ui";
import EmptyStateActions from "@/components/onboarding/EmptyStateActions";
import { tx } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { Flag } from "lucide-react";

export const metadata = { title: "Metas" };

export default async function GoalsPage() {
  const [goals, locale] = await Promise.all([getGoals(), getLocale()]);
  const t = (text: string) => tx(locale, text);

  // Pre-compute progress once — reused in filters and render loop
  const goalsWithProgress = goals.map((goal) => ({
    ...goal,
    progress: calculateGoalProgress(goal.currentAmount, goal.targetAmount),
  }));
  const active = goalsWithProgress.filter((g) => g.progress < 1);
  const completed = goalsWithProgress.filter((g) => g.progress >= 1);

  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const aggregateProgress = totalTarget === 0 ? 0 : totalSaved / totalTarget;

  return (
    <section className="flex flex-1 flex-col">
      <SectionHeader
        eyebrow={t("Planning")}
        eyebrowClassName="bg-gradient-to-r from-brand-300 to-warning-400 bg-clip-text text-transparent"
        title={t("Metas financieras")}
        actions={<Badge label={`${completed.length} ${t("completadas")}`} tone="positive" size="md" />}
      />

      <div className="space-y-8 px-4 py-6 md:px-8">
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label={t("Ahorrado")} value={formatCurrency(totalSaved)} detail={t("En todas las metas")} tone="positive" />
          <StatCard label={t("Objetivo")} value={formatCurrency(totalTarget)} detail={t("Capital planeado")} tone="brand" />
          <StatCard label={t("Progreso")} value={formatPercent(aggregateProgress, 0)} detail={`${active.length} ${t("metas activas")}`} tone="info" />
        </section>

        {goals.length === 0 ? (
          <Card padded={false}>
            <EmptyState
              icon={<Flag aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />}
              title={t("Aun no hay metas")}
              description={t("Tus objetivos de ahorro, pagos de deuda y metas importantes se organizaran aqui.")}
              action={<EmptyStateActions />}
            />
          </Card>
        ) : active.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.22em] text-text-muted">{t("En progreso")}</p>
              <Badge ariaLabel={`${active.length} ${t("metas activas")}`} label={`${active.length} ${t("activas")}`} tone="neutral" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {active.map((goal) => (
                <Card key={goal.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-text-primary">{goal.name}</p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {t("Objetivo ")}{formatDate(goal.targetDate)}
                      </p>
                    </div>
                    <Badge label={formatPercent(goal.progress, 0)} tone="info" />
                  </div>
                  <ProgressBar value={goal.progress} color={goal.color} size="md" className="mt-5" />
                  <div className="mt-3 flex justify-between text-sm tabular-nums text-text-secondary">
                    <span>{formatCurrency(goal.currentAmount, goal.currency)}</span>
                    <span>{formatCurrency(goal.targetAmount, goal.currency)}</span>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.22em] text-text-muted">{t("Completadas")}</p>
              <Badge label={t("Logradas")} tone="positive" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {completed.map((goal) => (
                <Card key={goal.id} className="border-positive-400/20">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-text-primary">{goal.name}</p>
                      <p className="mt-1 text-sm tabular-nums text-text-secondary">
                        {formatCurrency(goal.targetAmount, goal.currency)} {t("alcanzado")}
                      </p>
                    </div>
                    <Badge label={t("Lista")} tone="positive" />
                  </div>
                  <ProgressBar value={1} color={goal.color} size="md" className="mt-5" />
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
