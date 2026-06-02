import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  FileUp,
  Landmark,
  LineChart,
  ShieldCheck,
  Target,
} from "lucide-react";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/ui";

export const metadata = {
  title: "Financial Command Center",
  description:
    "Personal finance command center for net worth, cash flow, credit exposure, goals, budgets and import workflows.",
};

const features = [
  {
    icon: Landmark,
    title: "Account visibility",
    description: "See cash, savings and institution balances without hunting through pages.",
  },
  {
    icon: CreditCard,
    title: "Credit control",
    description: "Track utilization, limits and payment pressure before it becomes a surprise.",
  },
  {
    icon: FileUp,
    title: "Statement import",
    description: "Bring in CSV, OFX, PDF, Excel or image statements and review them before saving.",
  },
  {
    icon: Target,
    title: "Goal planning",
    description: "Connect savings goals to real balances and progress instead of static notes.",
  },
];

export default async function LandingPage() {
  const session = await auth();
  const isSignedIn = Boolean(session?.user);
  const primaryHref = isSignedIn ? "/dashboard" : "/sign-in";
  const primaryLabel = isSignedIn ? "Open dashboard" : "Start with Google";

  return (
    <main className="min-h-dvh overflow-x-hidden bg-surface-base bg-[image:var(--app-shell-bg)] text-text-primary">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-surface-base/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            aria-label="Financial Command Center home"
            className="flex min-w-0 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50"
            href="/"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-brand-400/30 bg-brand-500/15 text-xs font-bold text-brand-300">
              FC
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-text-primary">
                Financial Command
              </span>
              <span className="block truncate text-xs text-text-secondary">
                Personal CFO workspace
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              className="inline-flex items-center gap-2 rounded-lg border border-brand-400/40 bg-brand-500/15 px-3 py-2 text-sm font-medium text-brand-300 transition hover:bg-brand-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50 sm:px-4"
              href={primaryHref}
            >
              <span className="hidden sm:inline">{primaryLabel}</span>
              <span className="sm:hidden">{isSignedIn ? "Open" : "Sign in"}</span>
              <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative min-h-[calc(100dvh-73px)] overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-[-18rem] top-36 opacity-90 sm:bottom-[-12rem] lg:left-[38%] lg:right-[-4rem] lg:top-16"
        >
          <DashboardPreview />
        </div>

        <div className="relative mx-auto flex min-h-[calc(100dvh-73px)] max-w-7xl flex-col justify-center px-4 pb-24 pt-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-lg border border-info-400/20 bg-info-900 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-info-400">
              Personal finance analytics
            </p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-normal text-text-primary sm:text-5xl lg:text-6xl">
              Financial Command Center
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-text-secondary sm:text-lg">
              A focused workspace for net worth, cash flow, credit cards, investments,
              budgets, goals and statement imports. Built to make your money easier
              to scan, compare and act on.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-400/40 bg-brand-500 px-5 py-3 text-sm font-semibold text-surface-base transition hover:bg-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50"
                href={primaryHref}
              >
                {primaryLabel}
                <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
              </Link>
              <a
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-text-secondary transition hover:bg-white/[0.08] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50"
                href="#capabilities"
              >
                See capabilities
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-surface-base" />
      </section>

      <section id="capabilities" className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                className="rounded-xl border border-white/10 bg-surface-card p-5 shadow-2xl shadow-black/10"
                key={feature.title}
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg border border-brand-400/25 bg-brand-500/15">
                  <Icon aria-hidden="true" className="h-5 w-5 text-brand-300" strokeWidth={1.8} />
                </div>
                <h2 className="mt-5 text-base font-semibold text-text-primary">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-2xl border border-white/10 bg-surface-card p-5 shadow-2xl shadow-black/15 lg:grid-cols-[0.85fr_1.15fr] lg:p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-brand-300">
              Why it works
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-text-primary">
              One place for the decisions that usually live across ten tabs.
            </h2>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              Import activity, review confidence warnings, watch utilization, and
              compare financial movement month by month from a single workspace.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Net worth", "$196.7k", "Consolidated balance"],
              ["Cash flow", "+$8.4k", "Income minus expenses"],
              ["Credit use", "28%", "Across active cards"],
            ].map(([label, value, detail]) => (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4" key={label}>
                <p className="text-xs text-text-muted">{label}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">
                  {value}
                </p>
                <p className="mt-1 text-xs text-text-secondary">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function DashboardPreview() {
  return (
    <div className="mx-auto w-[min(56rem,calc(100vw-2rem))] rotate-[-2deg] rounded-2xl border border-white/10 bg-surface-card p-4 shadow-2xl shadow-black/25 lg:mx-0">
      <div className="mb-4 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-brand-300">
            Command Center
          </p>
          <p className="mt-1 text-xl font-semibold text-text-primary">
            Financial Overview
          </p>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          {["Jan", "Feb", "Mar"].map((month) => (
            <span
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-text-secondary"
              key={month}
            >
              {month}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <PreviewMetric label="Net worth" tone="positive" value="$196,750" />
        <PreviewMetric label="Cash flow" tone="info" value="+$8,420" />
        <PreviewMetric label="Credit use" tone="warning" value="28%" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-text-primary">Cash flow trend</p>
            <LineChart aria-hidden="true" className="h-4 w-4 text-info-400" strokeWidth={1.8} />
          </div>
          <div className="flex h-40 items-end gap-2">
            {[48, 72, 54, 88, 66, 96, 74].map((height, index) => (
              <div className="flex flex-1 flex-col justify-end gap-1" key={index}>
                <span
                  className="rounded-t-md bg-brand-500/70"
                  style={{ height: `${height}%` }}
                />
                <span
                  className="rounded-t-md bg-info-500/45"
                  style={{ height: `${Math.max(18, height - 28)}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {[
            ["Accounts", "4 connected", CheckCircle2, "text-positive-400"],
            ["Cards", "2 active", CreditCard, "text-warning-400"],
            ["Analytics", "6 months", BarChart3, "text-info-400"],
            ["Protected", "Owner-only", ShieldCheck, "text-brand-300"],
          ].map(([label, detail, Icon, tone]) => (
            <div
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              key={String(label)}
            >
              <div>
                <p className="text-sm font-medium text-text-primary">{String(label)}</p>
                <p className="text-xs text-text-secondary">{String(detail)}</p>
              </div>
              <Icon aria-hidden="true" className={`h-4 w-4 ${tone}`} strokeWidth={1.8} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewMetric({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "positive" | "info" | "warning";
  value: string;
}) {
  const toneClass =
    tone === "positive"
      ? "text-positive-400"
      : tone === "warning"
        ? "text-warning-400"
        : "text-info-400";

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}
