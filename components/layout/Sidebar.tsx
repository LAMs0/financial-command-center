"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  Flag,
  Landmark,
  LayoutDashboard,
  LineChart,
  LogOut,
  PiggyBank,
  ReceiptText,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { Card, NotificationCenter, ThemeToggle } from "@/components/ui";
import { useMonth } from "@/contexts/MonthContext";
import { formatCompact } from "@/lib/formatters";
import type { AppNotification, MonthlySnapshot } from "@/types/finance";

const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50";

type UserInfo = {
  name: string | null;
  email: string | null;
  image: string | null;
} | null;

const navItems: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Accounts", href: "/accounts", icon: Landmark },
  { label: "Cards", href: "/cards", icon: CreditCard },
  { label: "Investments", href: "/investments", icon: LineChart },
  { label: "Transactions", href: "/transactions", icon: ReceiptText },
  { label: "Goals", href: "/goals", icon: Flag },
  { label: "Budget", href: "/budget", icon: PiggyBank },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Import", href: "/import", icon: Upload },
];

interface SidebarProps {
  history: MonthlySnapshot[];
  user: UserInfo;
  signOutAction: () => Promise<void>;
  notifications: AppNotification[];
}

export default function Sidebar({ history, user, signOutAction, notifications }: SidebarProps) {
  const pathname = usePathname();
  const { snapshot } = useMonth();
  const currentSnapshot = snapshot ?? history[history.length - 1];
  const netCashFlow = currentSnapshot.income - currentSnapshot.expenses;

  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-surface-base/80 px-5 py-6 backdrop-blur xl:block">
      <div className="mb-9 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg border border-brand-400/30 bg-brand-500/15 text-sm font-bold text-brand-300">
            FC
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-wide">Financial Command</p>
            <p className="text-xs text-text-secondary">Personal CFO workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationCenter notifications={notifications} panelAlign="left" />
          <ThemeToggle />
        </div>
      </div>

      <nav aria-label="Primary navigation" className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={`group flex items-center justify-between rounded-lg border-l-2 px-3 py-2.5 text-sm transition duration-200 ${FOCUS_RING} ${
                isActive
                  ? "border-brand-400 bg-white/10 text-text-primary"
                  : "border-transparent text-text-secondary hover:border-white/20 hover:bg-white/[0.08] hover:text-text-primary"
              }`}
              href={item.href}
              key={item.label}
            >
              <span className="flex items-center gap-3">
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
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
              )}
            </Link>
          );
        })}
      </nav>

      <Card className="mt-10" padded>
        <p className="text-xs uppercase tracking-[0.22em] text-text-muted">
          Monthly pulse
        </p>
        <p className="mt-3 text-2xl font-semibold tabular-nums">
          {formatCompact(netCashFlow)}
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          {currentSnapshot.label} free cash after expenses.
        </p>
      </Card>

      {user && (
        <div className="mt-6 border-t border-white/10 pt-5">
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3 transition hover:border-brand-400/20 hover:bg-white/[0.055]">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                {user.image ? (
                  <div
                    aria-label={user.name ?? "User"}
                    className="h-10 w-10 rounded-full bg-cover bg-center ring-1 ring-white/15"
                    role="img"
                    style={{ backgroundImage: `url(${user.image})` }}
                  />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-full border border-brand-400/25 bg-brand-500/20 text-xs font-semibold text-brand-300">
                    {(user.name ?? user.email ?? "U")[0].toUpperCase()}
                  </div>
                )}
                <span
                  aria-label="Active session"
                  className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface-card bg-positive-400"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">{user.name ?? user.email}</p>
                {user.name && <p className="truncate text-xs text-text-muted">{user.email}</p>}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
              <span className="text-xs text-text-muted">Session active</span>
              <form action={signOutAction}>
                <button
                  className={`inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:border-negative-400/30 hover:bg-negative-900 hover:text-negative-400 ${FOCUS_RING}`}
                  type="submit"
                >
                  <LogOut aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

interface MobileNavProps {
  user: UserInfo;
  signOutAction: () => Promise<void>;
  notifications: AppNotification[];
}

export function MobileNav({ user, signOutAction, notifications }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <div className="border-b border-white/10 bg-surface-base/90 px-4 py-3 backdrop-blur xl:hidden">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg border border-brand-400/30 bg-brand-500/15 text-xs font-bold text-brand-300">
            FC
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">Financial Command</p>
            <p className="truncate text-xs text-text-secondary">Personal CFO workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationCenter notifications={notifications} />
          <ThemeToggle />
        </div>
      </div>

      <nav aria-label="Mobile primary navigation" className="flex max-w-full gap-1.5 overflow-x-auto overscroll-x-contain px-1 pb-1 [scrollbar-width:none] sm:gap-2 [&::-webkit-scrollbar]:hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition hover:bg-white/[0.08] sm:px-3 ${FOCUS_RING} ${
                isActive
                  ? "border-brand-400/30 bg-brand-500/15 text-brand-300"
                  : "border-white/10 bg-white/[0.03] text-text-secondary"
              }`}
              href={item.href}
              key={item.label}
              title={item.label}
            >
              <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}

        {user && (
          <form action={signOutAction} className="shrink-0">
            <button
              aria-label="Sign out"
              className={`flex h-full items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 text-sm text-text-secondary transition hover:border-negative-400/30 hover:bg-negative-900 hover:text-negative-400 sm:px-3 ${FOCUS_RING}`}
              title="Sign out"
              type="submit"
            >
              <LogOut aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        )}
      </nav>
    </div>
  );
}
