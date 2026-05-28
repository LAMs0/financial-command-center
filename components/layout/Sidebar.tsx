"use client";

/*
  ¿Por qué "use client"?
  usePathname() es un hook de React que lee la URL actual.
  Los hooks solo funcionan en Client Components.
  El resto de las páginas siguen siendo Server Components — solo
  este archivo necesita ser cliente porque usa estado del navegador.
*/
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  Flag,
  Landmark,
  LayoutDashboard,
  LineChart,
  PiggyBank,
  ReceiptText,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui";
import { formatCompact } from "@/lib/formatters";
import { mockTransactions } from "@/lib/mock-data";

/*
  Calculamos el cash flow una sola vez aquí.
  Cuando conectemos APIs reales, este valor vendrá como prop desde
  el layout (server component) que lo habrá fetched del servidor.
*/
const netCashFlow = mockTransactions.reduce((sum, txn) => {
  if (txn.type === "income") return sum + txn.amount;
  if (txn.type === "expense") return sum - txn.amount;
  return sum;
}, 0);

const navItems: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Overview",     href: "/dashboard",     icon: LayoutDashboard },
  { label: "Accounts",     href: "/accounts",      icon: Landmark },
  { label: "Cards",        href: "/cards",         icon: CreditCard },
  { label: "Investments",  href: "/investments",   icon: LineChart },
  { label: "Transactions", href: "/transactions",  icon: ReceiptText },
  { label: "Goals",        href: "/goals",         icon: Flag },
  { label: "Budget",       href: "/budget",        icon: PiggyBank },
  { label: "Analytics",    href: "/analytics",     icon: BarChart3 },
];

export default function Sidebar() {
  /*
    usePathname() devuelve la ruta actual, ej: "/dashboard" o "/accounts".
    Lo comparamos con cada item del nav para saber cuál marcar como activo.
    Esto es automático — no hay que tocar el código al navegar entre páginas.
  */
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-surface-base/80 px-5 py-6 backdrop-blur xl:block">
      {/* Logo + nombre */}
      <div className="mb-9 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg border border-brand-400/30 bg-brand-500/15 text-sm font-bold text-brand-300">
          FC
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide">Financial Command</p>
          <p className="text-xs text-text-secondary">Personal CFO workspace</p>
        </div>
      </div>

      {/* Navegación principal */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`group relative flex items-center justify-between overflow-hidden rounded-lg px-3 py-2.5 text-sm transition duration-200 before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-brand-400 before:transition-opacity ${
                isActive
                  ? "bg-white/10 text-white before:opacity-100"
                  : "text-text-secondary before:opacity-0 hover:bg-white/[0.08] hover:text-white hover:before:opacity-70"
                }`}
            >
              <span className="relative flex items-center gap-3">
                <Icon
                  aria-hidden="true"
                  className={`h-4 w-4 transition ${
                    isActive
                      ? "text-brand-300"
                      : "text-text-muted group-hover:text-brand-300"
                  }`}
                  strokeWidth={1.8}
                />
                <span>{item.label}</span>
              </span>
              {isActive && (
                <span className="relative h-1.5 w-1.5 rounded-full bg-brand-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Widget de cash flow mensual */}
      <Card className="mt-10" padded>
        <p className="text-xs uppercase tracking-[0.22em] text-text-muted">
          Monthly pulse
        </p>
        <p className="mt-3 text-2xl font-semibold">
          {formatCompact(netCashFlow)}
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          Projected free cash after recurring expenses.
        </p>
      </Card>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-white/10 bg-surface-base/90 px-4 py-3 backdrop-blur xl:hidden">
      <div className="mb-3 flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg border border-brand-400/30 bg-brand-500/15 text-xs font-bold text-brand-300">
          FC
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Financial Command</p>
          <p className="text-xs text-text-secondary">Personal CFO workspace</p>
        </div>
      </div>

      <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                isActive
                  ? "border-brand-400/30 bg-brand-500/15 text-brand-300"
                  : "border-white/10 bg-white/[0.03] text-text-secondary"
              }`}
              href={item.href}
              key={item.label}
            >
              <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
