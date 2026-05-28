import { mockAccounts } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Badge, Card, CardHeader, SectionHeader, StatCard } from "@/components/ui";
import type { Account } from "@/types/finance";

export const metadata = { title: "Accounts" };

function accountTypeLabel(type: Account["type"]) {
  const labels: Record<Account["type"], string> = {
    checking: "Checking",
    savings: "Savings",
    cash: "Cash",
    investment: "Investment",
  };

  return labels[type];
}

export default function AccountsPage() {
  const total = mockAccounts.reduce((sum, account) => sum + account.balance, 0);
  const liquid = mockAccounts
    .filter((account) => account.type !== "investment")
    .reduce((sum, account) => sum + account.balance, 0);
  const largestAccount = [...mockAccounts].sort((a, b) => b.balance - a.balance)[0];

  return (
    <section className="flex flex-1 flex-col">
      <SectionHeader
        eyebrow="Finances"
        eyebrowClassName="bg-gradient-to-r from-info-400 to-brand-300 bg-clip-text text-transparent"
        title="Accounts"
        actions={<Badge label={`${mockAccounts.length} connected`} tone="info" size="md" />}
      />

      <div className="space-y-6 px-4 py-6 md:px-8">
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total balance" value={formatCurrency(total)} detail="Across all accounts" tone="positive" />
          <StatCard label="Liquid cash" value={formatCurrency(liquid)} detail="Checking, savings and cash" tone="brand" />
          <StatCard
            label="Largest account"
            value={largestAccount?.name ?? "No accounts"}
            detail={largestAccount ? formatCurrency(largestAccount.balance, largestAccount.currency) : undefined}
            tone="info"
          />
        </section>

        <Card padded={false}>
          <CardHeader
            title="Account Register"
            subtitle="Balances, institution metadata and last refresh"
          />
          <div className="divide-y divide-white/10">
            {mockAccounts.map((account) => (
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
      </div>
    </section>
  );
}
