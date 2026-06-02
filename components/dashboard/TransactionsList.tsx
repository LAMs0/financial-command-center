"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { RotateCcw, Search, SearchX } from "lucide-react";
import { Button, EmptyState, TransactionBadge } from "@/components/ui";
import EmptyStateActions from "@/components/onboarding/EmptyStateActions";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { Transaction, TransactionType } from "@/types/finance";

type FilterType = TransactionType | "all";

const filterOptions: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expenses" },
  { value: "transfer", label: "Transfers" },
];

interface TransactionsListProps {
  transactions: Transaction[];
  accountNameById: Record<string, string>;
}

function amountTone(type: TransactionType): string {
  if (type === "income") return "text-positive-400";
  if (type === "transfer") return "text-info-400";
  return "text-negative-400";
}

function amountPrefix(type: TransactionType): string {
  return type === "expense" ? "-" : "+";
}

export default function TransactionsList({
  transactions,
  accountNameById,
}: TransactionsListProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const shouldReduceMotion = useReducedMotion();

  const filtered = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesType =
        activeFilter === "all" || transaction.type === activeFilter;
      const matchesSearch =
        normalizedSearch === "" ||
        transaction.description.toLowerCase().includes(normalizedSearch) ||
        transaction.category.toLowerCase().includes(normalizedSearch);

      return matchesType && matchesSearch;
    });
  }, [transactions, activeFilter, searchQuery]);

  function resetFilters() {
    setActiveFilter("all");
    setSearchQuery("");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              aria-pressed={activeFilter === option.value}
              className={`rounded-lg border px-3 py-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50 ${
                activeFilter === option.value
                  ? "border-brand-400/40 bg-brand-500/15 text-brand-300"
                  : "border-white/10 bg-white/[0.03] text-text-secondary hover:bg-white/[0.06] hover:text-text-primary"
              }`}
              key={option.value}
              onClick={() => setActiveFilter(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            strokeWidth={1.8}
          />
          <input
            aria-label="Search transactions"
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] py-1.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted transition focus:border-brand-400/40 focus:bg-brand-500/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search transactions..."
            type="search"
            value={searchQuery}
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-surface-card">
        {transactions.length === 0 ? (
          <EmptyState
            icon={<SearchX aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />}
            title="No transactions yet"
            description="Once activity is connected, incoming, outgoing and transfer records will appear here."
            action={<EmptyStateActions />}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<SearchX aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />}
            title="No matching transactions"
            description="Try a broader search term or switch back to all activity to restore the full ledger."
            action={
              <Button
                icon={<RotateCcw aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />}
                onClick={resetFilters}
              >
                Reset filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="border-b border-white/10 px-5 py-3">
              <p className="text-xs text-text-muted">
                {filtered.length} of {transactions.length} transactions
              </p>
            </div>

            <div className="divide-y divide-white/10">
              {filtered.map((transaction, index) => (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 transition hover:bg-white/[0.04]"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  key={transaction.id}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { duration: 0.24, delay: Math.min(index, 8) * 0.025 }
                  }
                >
                  <TransactionBadge type={transaction.type} />

                  <div className="min-w-0">
                    <p className="truncate font-medium text-text-primary">
                      {transaction.description}
                    </p>
                    <p className="truncate text-sm text-text-secondary">
                      {accountNameById[transaction.accountId] ?? transaction.accountId}
                      {" / "}
                      {formatDate(transaction.date)}
                      {" / "}
                      <span className="capitalize">{transaction.category}</span>
                    </p>
                  </div>

                  <p className={`text-right text-sm font-semibold tabular-nums ${amountTone(transaction.type)}`}>
                    {amountPrefix(transaction.type)}
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
