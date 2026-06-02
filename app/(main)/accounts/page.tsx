import { getAccounts } from "@/lib/data";
import { formatAccountType, formatCurrency, formatDate } from "@/lib/formatters";
import { AnimateIn, Badge, Card, CardHeader, EmptyState, SectionHeader, StatCard } from "@/components/ui";
import Link from "next/link";
import { Landmark, Upload } from "lucide-react";

export const metadata = { title: "Accounts" };

export default async function AccountsPage() {
  const accounts = await getAccounts();
  const total = accounts.reduce((sum, account) => sum + account.balance, 0);
  const liquid = accounts
    .filter((account) => account.type !== "investment")
    .reduce((sum, account) => sum + account.balance, 0);
  const largestAccount = [...accounts].sort((a, b) => b.balance - a.balance)[0];

  return (
    <section className="flex flex-1 flex-col">
      <SectionHeader
        eyebrow="Finances"
        eyebrowClassName="bg-gradient-to-r from-info-400 to-brand-300 bg-clip-text text-transparent"
        title="Accounts"
        actions={<Badge label={`${accounts.length} connected`} tone="info" size="md" />}
      />

      <div className="space-y-6 px-4 py-6 md:px-8">
        <AnimateIn className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total balance" value={formatCurrency(total)} detail="Across all accounts" tone="positive" />
          <StatCard label="Liquid cash" value={formatCurrency(liquid)} detail="Checking, savings and cash" tone="brand" />
          <StatCard
            label="Largest account"
            value={largestAccount?.name ?? "No accounts"}
            detail={largestAccount ? formatCurrency(largestAccount.balance, largestAccount.currency) : undefined}
            tone="info"
          />
        </AnimateIn>

        <AnimateIn delay={0.05}>
        <Card padded={false}>
          <CardHeader
            title="Account Register"
            subtitle="Balances, institution metadata and last refresh"
          />
          <div className="divide-y divide-white/10">
            {accounts.length === 0 ? (
              <EmptyState
                icon={<Landmark aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />}
                title="No accounts connected"
                description="Bank, cash and investment accounts will appear here once a data source is connected."
                action={
                  <Link
                    className="inline-flex items-center gap-2 rounded-lg border border-brand-400/40 bg-brand-500/15 px-4 py-2 text-sm font-medium text-brand-300 transition hover:bg-brand-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50"
                    href="/import"
                  >
                    <Upload aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                    Import data
                  </Link>
                }
              />
            ) : accounts.map((account, index) => (
              <AnimateIn
                className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.04] md:grid-cols-[1fr_auto]"
                delay={Math.min(index, 8) * 0.025}
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
              </AnimateIn>
            ))}
          </div>
        </Card>
        </AnimateIn>
      </div>
    </section>
  );
}
