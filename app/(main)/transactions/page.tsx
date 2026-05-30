/*
  Transactions page — Server Component.

  Responsabilidades de este archivo (servidor):
  1. Calcular los totales para los StatCards
  2. Ordenar las transacciones por fecha
  3. Construir el mapa de cuentas (id → nombre)
  4. Pasar los datos al Client Component (TransactionsList)

  ¿Por qué no hacer todo aquí?
  Los filtros interactivos necesitan useState — solo funciona en el
  cliente. Delegamos la interactividad a TransactionsList y mantenemos
  este archivo como Server Component para que los cálculos ocurran
  en el servidor (sin costo de JS para el usuario).
*/

import { getAccounts, getTransactions } from "@/lib/data";
import { formatCurrency } from "@/lib/formatters";
import { Badge, SectionHeader, StatCard } from "@/components/ui";
import TransactionsList from "@/components/dashboard/TransactionsList";

export const metadata = { title: "Transactions" };

// ── Página (Server Component async) ──────────────────────────────────
export default async function TransactionsPage() {
  const [transactions, accounts] = await Promise.all([
    getTransactions(),
    getAccounts(),
  ]);

  // ── Cálculos en el servidor ──────────────────────────────────────
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const transferCount = transactions.filter((t) => t.type === "transfer").length;

  /*
    Convertimos a Record<string, string> porque los props que se
    pasan a Client Components deben ser serializables (JSON-safe).
  */
  const accountNameById = Object.fromEntries(
    accounts.map((a) => [a.id, a.name])
  );

  return (
    <section className="flex flex-1 flex-col">
      <SectionHeader
        eyebrow="Activity"
        eyebrowClassName="bg-gradient-to-r from-info-400 to-warning-400 bg-clip-text text-transparent"
        title="Transactions"
        actions={
          <Badge
            label={`${transactions.length} records`}
            tone="info"
            size="md"
          />
        }
      />

      <div className="space-y-6 px-4 py-6 md:px-8">
        {/* Resumen calculado en servidor */}
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Income"
            value={formatCurrency(income)}
            detail="This mock period"
            tone="positive"
          />
          <StatCard
            label="Expenses"
            value={formatCurrency(expenses)}
            detail="Excluding transfers"
            tone="negative"
          />
          <StatCard
            label="Transfers"
            value={String(transferCount)}
            detail="Internal account movement"
            tone="info"
          />
        </section>

        {/*
          TransactionsList es Client Component — recibe los datos
          ya ordenados y el mapa de cuentas como props serializables.
          Gestiona el estado de filtros internamente.
        */}
        <TransactionsList
          transactions={sortedTransactions}
          accountNameById={accountNameById}
        />
      </div>
    </section>
  );
}
