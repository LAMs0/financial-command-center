import {
  mockAccounts,
  mockCards,
  mockGoals,
  mockInvestments,
  mockTransactions,
  mockMonthlyHistory,
} from "@/lib/mock-data";
import {
  calculateCardUtilization,
  calculateGoalProgress,
  calculateNetWorth,
} from "@/lib/calculations";
import {
  formatCompact,
  formatCurrency,
  formatDate,
  formatPercent,
} from "@/lib/formatters";
import {
  AnimateIn,
  Card,
  CardHeader,
  ProgressBar,
  SectionHeader,
  TransactionBadge,
} from "@/components/ui";
import DashboardStats from "@/components/dashboard/DashboardStats";
import NetWorthChart from "@/components/charts/NetWorthChart";
import type { Account } from "@/types/finance";

export const metadata = { title: "Dashboard" };

// Estos valores son estáticos (no cambian por mes en Phase 2)
const totalCreditBalance = mockCards.reduce((sum, card) => sum + card.balance, 0);
const totalCreditLimit = mockCards.reduce((sum, card) => sum + card.limit, 0);
const creditUtilization = totalCreditLimit === 0 ? 0 : totalCreditBalance / totalCreditLimit;
const netWorth = calculateNetWorth(mockAccounts, mockCards, mockInvestments);

const topAccounts = [...mockAccounts].sort((a, b) => b.balance - a.balance);
const recentTransactions = [...mockTransactions]
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, 6);

const accountNameById: Record<string, string> = Object.fromEntries(
  mockAccounts.map((account) => [account.id, account.name])
);

function accountTypeLabel(type: Account["type"]) {
  const labels: Record<Account["type"], string> = {
    checking: "Checking",
    savings: "Savings",
    cash: "Cash",
    investment: "Investment",
  };
  return labels[type];
}

function transactionAmountPrefix(type: string) {
  return type === "expense" ? "-" : "+";
}

function transactionTone(type: string) {
  if (type === "income") return "text-positive-400";
  if (type === "transfer") return "text-info-400";
  return "text-negative-400";
}

export default function DashboardPage() {
  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <SectionHeader
        eyebrow="Command Center"
        eyebrowClassName="bg-gradient-to-r from-brand-300 to-info-400 bg-clip-text text-transparent"
        title="Financial Overview"
        actions={
          <button className="rounded-lg border border-brand-400/40 bg-brand-500/15 px-4 py-2 text-sm font-medium text-brand-300 transition hover:bg-brand-500/25">
            Review portfolio
          </button>
        }
      />

      <div className="space-y-6 px-4 py-6 md:px-8">
        {/*
          DashboardStats es un Client Component que lee MonthContext.
          Le pasamos todos los datos históricos como props para que el servidor
          no tenga que volver a calcularlos cuando el usuario cambia de mes.
        */}
        <AnimateIn>
          <DashboardStats
            history={mockMonthlyHistory}
            staticData={{
              totalCreditBalance,
              creditUtilization,
              totalCreditLimit,
              numCards: mockCards.length,
            }}
          />
        </AnimateIn>

        <AnimateIn delay={0.04}>
          <Card padded={false}>
            <CardHeader
              title="Net Worth"
              subtitle="Patrimonio neto — selecciona un mes para resaltar"
              action={
                <p className="text-sm font-medium text-positive-400">
                  {formatCurrency(netWorth.netWorth)}
                </p>
              }
            />
            <div className="px-2 pb-5">
              <NetWorthChart data={mockMonthlyHistory} />
            </div>
          </Card>
        </AnimateIn>

        <AnimateIn className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]" delay={0.06}>
          <Card padded={false}>
            <CardHeader
              title="Accounts"
              subtitle="Liquid balances across institutions"
              action={<p className="text-sm text-text-secondary">{mockAccounts.length} connected</p>}
            />
            <div className="divide-y divide-white/10">
              {topAccounts.map((account) => (
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
                      <p className="truncate font-medium text-white">{account.name}</p>
                      <p className="text-sm text-text-secondary">
                        {account.institution} / {accountTypeLabel(account.type)} / Updated {formatDate(account.lastUpdated)}
                      </p>
                    </div>
                  </div>
                  <p className="text-left text-lg font-semibold text-white md:text-right">
                    {formatCurrency(account.balance, account.currency)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Credit Lines</h2>
                <p className="text-sm text-text-secondary">Utilization and due dates</p>
              </div>
              <p className="text-sm font-medium text-warning-400">{formatPercent(creditUtilization)}</p>
            </div>
            <div className="space-y-4">
              {mockCards.map((card) => {
                const utilization = calculateCardUtilization(card);

                return (
                  <Card variant="raised" className="shadow-none" key={card.id}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{card.name}</p>
                        <p className="text-sm text-text-secondary">
                          Ends {card.lastFourDigits} / Due day {card.paymentDueDay}
                        </p>
                      </div>
                      <p className="text-sm text-text-secondary">{formatPercent(utilization)}</p>
                    </div>
                    <ProgressBar value={utilization} autoColor size="md" className="mt-4" />
                    <div className="mt-3 flex justify-between text-sm text-text-secondary">
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
              subtitle="Latest activity from mock accounts"
            />
            <div className="divide-y divide-white/10">
              {recentTransactions.map((transaction) => (
                <div
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-4 transition hover:bg-white/[0.04]"
                  key={transaction.id}
                >
                  <TransactionBadge type={transaction.type} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{transaction.description}</p>
                    <p className="truncate text-sm text-text-secondary">
                      {accountNameById[transaction.accountId]} / {formatDate(transaction.date)}
                    </p>
                  </div>
                  <p className={`text-right text-sm font-semibold ${transactionTone(transaction.type)}`}>
                    {transactionAmountPrefix(transaction.type)}
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Financial Goals</h2>
                <p className="text-sm text-text-secondary">Progress toward priority targets</p>
              </div>
              <p className="text-sm text-text-secondary">{mockGoals.length} goals</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {mockGoals.map((goal) => {
                const progress = calculateGoalProgress(goal.currentAmount, goal.targetAmount);

                return (
                  <Card variant="raised" className="shadow-none" key={goal.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{goal.name}</p>
                        <p className="mt-1 text-sm text-text-secondary">
                          Target {formatDate(goal.targetDate)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {formatPercent(progress, 0)}
                      </p>
                    </div>
                    <ProgressBar value={progress} color={goal.color} size="md" className="mt-5" />
                    <div className="mt-3 flex justify-between text-sm text-text-secondary">
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
