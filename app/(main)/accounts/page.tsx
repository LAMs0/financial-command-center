import { getAccounts } from "@/lib/data";
import { formatAccountType, formatCurrency, formatDate } from "@/lib/formatters";
import { AnimateIn, Badge, Card, CardHeader, EmptyState, SectionHeader, StatCard } from "@/components/ui";
import EmptyStateActions from "@/components/onboarding/EmptyStateActions";
import ConnectBank from "@/components/banking/ConnectBank";
import { getBankProvider } from "@/lib/banking";
import { tx } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { Landmark } from "lucide-react";

export const metadata = { title: "Cuentas" };

export default async function AccountsPage() {
  const [accounts, locale] = await Promise.all([getAccounts(), getLocale()]);
  const t = (text: string) => tx(locale, text);

  // Conectividad bancaria: instituciones disponibles (del proveedor activo) y
  // las ya conectadas, derivadas agrupando las cuentas por institución.
  const provider = getBankProvider();
  const institutions = await provider.listInstitutions().catch(() => []);
  const connectedMap = new Map<string, { name: string; color: string; accountCount: number }>();
  for (const acc of accounts) {
    const entry = connectedMap.get(acc.institution);
    if (entry) entry.accountCount += 1;
    else connectedMap.set(acc.institution, { name: acc.institution, color: acc.color, accountCount: 1 });
  }
  const connected = [...connectedMap.values()];
  const total = accounts.reduce((sum, account) => sum + account.balance, 0);
  const liquid = accounts
    .filter((account) => account.type !== "investment")
    .reduce((sum, account) => sum + account.balance, 0);
  const largestAccount = [...accounts].sort((a, b) => b.balance - a.balance)[0];

  return (
    <section className="flex flex-1 flex-col">
      <SectionHeader
        eyebrow={t("Finances")}
        eyebrowClassName="bg-gradient-to-r from-info-400 to-brand-300 bg-clip-text text-transparent"
        title={t("Cuentas")}
        actions={<Badge label={`${accounts.length} ${t("conectadas")}`} tone="info" size="md" />}
      />

      <div className="space-y-6 px-4 py-6 md:px-8">
        <AnimateIn className="grid gap-4 md:grid-cols-3">
          <StatCard label={t("Balance total")} value={formatCurrency(total)} detail={t("En todas las cuentas")} tone="positive" />
          <StatCard label={t("Liquidez")} value={formatCurrency(liquid)} detail={t("Cheques, ahorro y efectivo")} tone="brand" />
          <StatCard
            label={t("Cuenta principal")}
            value={largestAccount?.name ?? t("Sin cuentas")}
            detail={largestAccount ? formatCurrency(largestAccount.balance, largestAccount.currency) : undefined}
            tone="info"
          />
        </AnimateIn>

        <AnimateIn delay={0.04}>
          <ConnectBank
            institutions={institutions}
            connected={connected}
            providerId={provider.id}
            mode={provider.mode}
          />
        </AnimateIn>

        <AnimateIn delay={0.08}>
        <Card padded={false}>
          <CardHeader
            title={t("Registro de cuentas")}
            subtitle={t("Balances, instituciones y ultima actualizacion")}
          />
          <div className="divide-y divide-white/10">
            {accounts.length === 0 ? (
              <EmptyState
                icon={<Landmark aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />}
                title={t("No hay cuentas conectadas")}
                description={t("Las cuentas bancarias, efectivo e inversiones apareceran aqui cuando conectes una fuente de datos.")}
                action={<EmptyStateActions />}
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
                      {account.institution} / {formatAccountType(account.type)} / Actualizado {formatDate(account.lastUpdated)}
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
