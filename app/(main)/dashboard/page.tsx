import {
  getAccounts,
  getCards,
  getGoals,
  getInvestments,
  getTransactions,
  getMonthlyHistory,
  getOnboardingState,
} from "@/lib/data";
import { auth } from "@/auth";
import WelcomeOnboarding from "@/components/onboarding/WelcomeOnboarding";
import SampleDataBanner from "@/components/onboarding/SampleDataBanner";
import EmptyStateActions from "@/components/onboarding/EmptyStateActions";
import {
  calculateCardUtilization,
  calculateGoalProgress,
  calculateNetWorth,
} from "@/lib/calculations";
import {
  formatAccountType,
  formatCompact,
  formatCurrency,
  formatDate,
  formatPercent,
  transactionPrefix,
  transactionTone,
} from "@/lib/formatters";
import {
  AnimateIn,
  Card,
  CardHeader,
  EmptyState,
  ProgressBar,
  SectionHeader,
  TransactionBadge,
} from "@/components/ui";
import Link from "next/link";
import { CreditCard, Flag, Landmark, ReceiptText } from "lucide-react";
import DashboardStats from "@/components/dashboard/DashboardStats";
import NetWorthChart from "@/components/charts/NetWorthChart";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  /*
    Server Component async: pedimos los datos a la capa de datos (lib/data).
    Promise.all corre todas las queries en paralelo en vez de en serie —
    más rápido que await uno por uno.
  */
  /*
    Onboarding: si el usuario no tiene NINGÚN dato todavía, mostramos la
    pantalla de bienvenida en lugar de un dashboard lleno de tarjetas vacías.
  */
  const onboarding = await getOnboardingState();
  if (!onboarding.hasData) {
    const session = await auth();
    return <WelcomeOnboarding userName={session?.user?.name} />;
  }

  const [accounts, cards, goals, investments, transactions, monthlyHistory] =
    await Promise.all([
      getAccounts(),
      getCards(),
      getGoals(),
      getInvestments(),
      getTransactions(),
      getMonthlyHistory(),
    ]);

  // Valores derivados (antes vivían a nivel de módulo con los mocks)
  const { totalCreditBalance, totalCreditLimit } = cards.reduce(
    (acc, card) => ({
      totalCreditBalance: acc.totalCreditBalance + card.balance,
      totalCreditLimit: acc.totalCreditLimit + card.limit,
    }),
    { totalCreditBalance: 0, totalCreditLimit: 0 }
  );
  const creditUtilization =
    totalCreditLimit === 0 ? 0 : totalCreditBalance / totalCreditLimit;
  const netWorth = calculateNetWorth(accounts, cards, investments);

  const topAccounts = [...accounts].sort((a, b) => b.balance - a.balance);
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  const accountNameById: Record<string, string> = Object.fromEntries(
    accounts.map((account) => [account.id, account.name])
  );

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <SectionHeader
        eyebrow="Command Center"
        eyebrowClassName="bg-gradient-to-r from-brand-300 to-info-400 bg-clip-text text-transparent"
        title="Financial Overview"
        actions={
          <Link
            className="rounded-lg border border-brand-400/40 bg-brand-500/15 px-4 py-2 text-sm font-medium text-brand-300 transition hover:bg-brand-500/25"
            href="/investments"
          >
            Review portfolio
          </Link>
        }
      />

      <div className="space-y-6 px-4 py-6 md:px-8">
        {onboarding.usingSampleData && (
          <AnimateIn>
            <SampleDataBanner />
          </AnimateIn>
        )}
        {/*
          DashboardStats es un Client Component que lee MonthContext.
          Le pasamos todos los datos históricos como props para que el servidor
          no tenga que volver a calcularlos cuando el usuario cambia de mes.
        */}
        <AnimateIn>
          <DashboardStats
            history={monthlyHistory}
            staticData={{
              totalCreditBalance,
              creditUtilization,
              totalCreditLimit,
              numCards: cards.length,
            }}
          />
        </AnimateIn>

        <AnimateIn delay={0.04}>
          <Card padded={false}>
            <CardHeader
              title="Net Worth"
              subtitle="Patrimonio neto — selecciona un mes para resaltar"
              action={
                <p className="text-sm font-medium tabular-nums text-positive-400">
                  {formatCurrency(netWorth.netWorth)}
                </p>
              }
            />
            <div className="px-2 pb-5">
              <NetWorthChart data={monthlyHistory} />
            </div>
          </Card>
        </AnimateIn>

        <AnimateIn className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]" delay={0.06}>
          <Card padded={false}>
            <CardHeader
              title="Accounts"
              subtitle="Liquid balances across institutions"
              action={<p className="text-sm text-text-secondary">{accounts.length} connected</p>}
            />
            <div className="divide-y divide-white/10">
              {topAccounts.length === 0 ? (
                <EmptyState
                  icon={<Landmark aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />}
                  title="No accounts connected"
                  description="Connected accounts will populate this balance register."
                  action={<EmptyStateActions />}
                />
              ) : topAccounts.map((account) => (
                <div
                  className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.04] md:grid-cols-[1fr_auto]"
                  key={account.id}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span
                      className="h-10 w-2 rounded-full"
                      style={{ backgroundColor: account.color }}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text-primary">{account.name}</p>
                      <p className="text-sm text-text-secondary">
                        {account.institution} / {formatAccountType(account.type)} / Updated {formatDate(account.lastUpdated)}
                      </p>
                    </div>
                  </div>
                  <p className="text-left text-lg font-semibold tabular-nums text-text-primary md:text-right">
                    {formatCurrency(account.balance, account.currency)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Credit Lines"
              subtitle="Utilization and due dates"
              action={<p className="text-sm font-medium tabular-nums text-warning-400">{formatPercent(creditUtilization)}</p>}
            />
            <div className="space-y-4">
              {cards.length === 0 ? (
                <EmptyState
                  icon={<CreditCard aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />}
                  title="No credit lines"
                  description="Credit utilization and due date cards will appear here."
                  action={<EmptyStateActions />}
                />
              ) : cards.map((card) => {
                const utilization = calculateCardUtilization(card);

                return (
                  <Card variant="raised" className="shadow-none" key={card.id}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-text-primary">{card.name}</p>
                        <p className="text-sm text-text-secondary">
                          Ends {card.lastFourDigits} / Due day {card.paymentDueDay}
                        </p>
                      </div>
                      <p className="text-sm tabular-nums text-text-secondary">{formatPercent(utilization)}</p>
                    </div>
                    <ProgressBar value={utilization} autoColor size="md" className="mt-4" />
                    <div className="mt-3 flex justify-between text-sm tabular-nums text-text-secondary">
                      <span>{formatCompact(card.balance, card.currency)} used</span>
                      <span>{formatCompact(card.limit, card.currency)} limit</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>
        </AnimateIn>

        <AnimateIn className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]" delay={0.12}>
          <Card padded={false}>
            <CardHeader
              title="Recent Transactions"
              subtitle="Latest activity across accounts"
            />
            <div className="divide-y divide-white/10">
              {recentTransactions.length === 0 ? (
                <EmptyState
                  icon={<ReceiptText aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />}
                  title="No recent activity"
                  description="Incoming, outgoing and transfer records will appear in this feed."
                  action={<EmptyStateActions />}
                />
              ) : recentTransactions.map((transaction) => (
                <div
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-4 transition hover:bg-white/[0.04]"
                  key={transaction.id}
                >
                  <TransactionBadge type={transaction.type} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text-primary">{transaction.description}</p>
                    <p className="truncate text-sm text-text-secondary">
                      {accountNameById[transaction.accountId]} / {formatDate(transaction.date)}
                    </p>
                  </div>
                  <p className={`text-right text-sm font-semibold tabular-nums ${transactionTone(transaction.type)}`}>
                    {transactionPrefix(transaction.type)}
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Financial Goals"
              subtitle="Progress toward priority targets"
              action={<p className="text-sm text-text-secondary">{goals.length} goals</p>}
            />

            <div className="grid gap-4 md:grid-cols-2">
              {goals.length === 0 ? (
                <EmptyState
                  icon={<Flag aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />}
                  title="No goals yet"
                  description="Priority savings goals will appear here once planning starts."
                  action={<EmptyStateActions />}
                />
              ) : goals.map((goal) => {
                const progress = calculateGoalProgress(goal.currentAmount, goal.targetAmount);

                return (
                  <Card variant="raised" className="shadow-none" key={goal.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-text-primary">{goal.name}</p>
                        <p className="mt-1 text-sm text-text-secondary">
                          Target {formatDate(goal.targetDate)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold tabular-nums text-text-primary">
                        {formatPercent(progress, 0)}
                      </p>
                    </div>
                    <ProgressBar value={progress} color={goal.color} size="md" className="mt-5" />
                    <div className="mt-3 flex justify-between text-sm tabular-nums text-text-secondary">
                      <span>{formatCompact(goal.currentAmount, goal.currency)}</span>
                      <span>{formatCompact(goal.targetAmount, goal.currency)}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>
        </AnimateIn>
      </div>
    </section>
  );
}
