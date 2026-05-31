import {
  ArrowRight,
  BadgeDollarSign,
  Bell,
  Landmark,
  LineChart,
  ReceiptText,
  SearchX,
  ShieldCheck,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ProgressBar,
  SectionHeader,
  Skeleton,
  SkeletonCard,
  SkeletonListRow,
  StatCard,
  TransactionBadge,
} from "@/components/ui";
import { notFound } from "next/navigation";

export const metadata = { title: "Styleguide" };

const colorTokens = [
  ["surface-base", "var(--color-surface-base)"],
  ["surface-card", "var(--color-surface-card)"],
  ["surface-raised", "var(--color-surface-raised)"],
  ["brand-500", "var(--color-brand-500)"],
  ["positive-500", "var(--color-positive-500)"],
  ["negative-500", "var(--color-negative-500)"],
  ["warning-500", "var(--color-warning-500)"],
  ["info-500", "var(--color-info-500)"],
];

const spacingScale = ["4px", "8px", "12px", "16px", "20px", "24px", "32px"];
const radiusScale = ["4px", "6px", "8px", "12px"];

export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <section className="flex flex-1 flex-col">
      <SectionHeader
        eyebrow="Design System"
        eyebrowClassName="bg-gradient-to-r from-brand-300 to-info-400 bg-clip-text text-transparent"
        title="Styleguide"
        actions={<Badge label="Internal" tone="info" size="md" />}
      />

      <div className="space-y-8 px-4 py-6 md:px-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Primary metric"
            value="$186,751"
            detail="Tabular financial figure"
            tone="positive"
            sparkline={[22, 24, 23, 28, 31, 35]}
          />
          <StatCard
            label="Cash flow"
            value="$22,300"
            detail="Positive period"
            tone="brand"
            sparkline={[18, 20, 19, 24, 23, 26]}
          />
          <StatCard
            label="Debt"
            value="$13,301"
            detail="Managed liability"
            tone="warning"
            sparkline={[31, 30, 28, 29, 27, 25]}
          />
          <StatCard
            label="Risk"
            value="71%"
            detail="Attention required"
            tone="negative"
            sparkline={[12, 18, 22, 24, 30, 34]}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card padded={false}>
            <CardHeader
              title="Tokens"
              subtitle="Color, spacing, radius, shadow and typography inventory"
            />
            <div className="grid gap-5 p-5 md:grid-cols-2">
              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.22em] text-text-muted">
                  Colors
                </p>
                <div className="space-y-2">
                  {colorTokens.map(([label, color]) => (
                    <div className="flex items-center justify-between gap-4" key={label}>
                      <div className="flex items-center gap-3">
                        <span
                          className="h-7 w-7 rounded-lg border border-white/10"
                          style={{ background: color }}
                        />
                        <span className="text-sm text-text-secondary">{label}</span>
                      </div>
                      <code className="font-mono text-xs text-text-muted">{color}</code>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="mb-3 text-xs uppercase tracking-[0.22em] text-text-muted">
                    Spacing
                  </p>
                  <div className="flex flex-wrap items-end gap-3">
                    {spacingScale.map((size) => (
                      <div className="text-center" key={size}>
                        <span
                          className="block rounded-sm bg-brand-500/70"
                          style={{ height: size, width: size }}
                        />
                        <span className="mt-2 block text-xs text-text-muted">{size}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs uppercase tracking-[0.22em] text-text-muted">
                    Radius
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {radiusScale.map((radius) => (
                      <div
                        className="h-14 w-20 border border-white/10 bg-white/[0.04]"
                        key={radius}
                        style={{ borderRadius: radius }}
                      >
                        <span className="sr-only">{radius}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs uppercase tracking-[0.22em] text-text-muted">
                    Typography
                  </p>
                  <div className="space-y-2">
                    <p className="text-3xl font-semibold text-text-primary">Display / 30</p>
                    <p className="text-base font-semibold text-text-primary">Section / 16</p>
                    <p className="text-sm text-text-secondary">Body / 14 secondary</p>
                    <p className="font-mono text-xs text-text-muted">Mono / audit labels</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card padded={false}>
            <CardHeader title="Components" subtitle="Reusable UI primitives and interaction states" />
            <div className="space-y-6 p-5">
              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.22em] text-text-muted">
                  Buttons
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button icon={<ArrowRight aria-hidden="true" className="h-4 w-4" />}>
                    Primary
                  </Button>
                  <Button tone="neutral" icon={<Bell aria-hidden="true" className="h-4 w-4" />}>
                    Neutral
                  </Button>
                  <Button tone="danger">Danger</Button>
                  <Button loading>Loading</Button>
                  <Button disabled>Disabled</Button>
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.22em] text-text-muted">
                  Badges
                </p>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge label="Positive" tone="positive" />
                    <Badge label="Negative" tone="negative" />
                    <Badge label="Warning" tone="warning" />
                    <Badge label="Info" tone="info" />
                    <Badge label="Neutral" tone="neutral" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge label="Medium badge" tone="info" size="md" />
                    <TransactionBadge type="income" />
                    <TransactionBadge type="expense" />
                    <TransactionBadge type="transfer" />
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.22em] text-text-muted">
                  Card variants
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  <Card className="shadow-none">
                    <p className="text-sm font-semibold text-text-primary">Default</p>
                    <p className="mt-1 text-xs text-text-secondary">Primary content surface.</p>
                  </Card>
                  <Card className="shadow-none" variant="raised">
                    <p className="text-sm font-semibold text-text-primary">Raised</p>
                    <p className="mt-1 text-xs text-text-secondary">Nested or emphasized surface.</p>
                  </Card>
                  <Card className="shadow-none" variant="ghost">
                    <p className="text-sm font-semibold text-text-primary">Ghost</p>
                    <p className="mt-1 text-xs text-text-secondary">Low emphasis framing.</p>
                  </Card>
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.22em] text-text-muted">
                  Progress
                </p>
                <div className="space-y-3">
                  <ProgressBar value={0.38} color="var(--color-brand-500)" size="md" />
                  <ProgressBar value={0.72} autoColor size="md" />
                  <ProgressBar value={0.94} autoColor size="md" />
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.22em] text-text-muted">
                  Empty states
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <EmptyState
                    icon={<SearchX aria-hidden="true" className="h-5 w-5" />}
                    title="No matching results"
                    description="Used when filters or search terms hide all available records."
                    action={<Button tone="neutral">Reset view</Button>}
                  />
                  <EmptyState
                    icon={<ReceiptText aria-hidden="true" className="h-5 w-5" />}
                    title="No records yet"
                    description="Used before API-backed datasets have connected activity."
                  />
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.22em] text-text-muted">
                  Skeletons
                </p>
                <div className="grid gap-4 md:grid-cols-[0.85fr_1fr]">
                  <SkeletonCard />
                  <Card padded={false} variant="raised">
                    <div className="border-b border-white/10 px-5 py-4">
                      <Skeleton className="h-4 w-32 rounded-full" />
                      <Skeleton className="mt-2 h-3 w-48 rounded-full" />
                    </div>
                    <div className="divide-y divide-white/10">
                      <SkeletonListRow />
                      <SkeletonListRow compact />
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <Card padded={false}>
            <CardHeader
              title="Auth Surface"
              subtitle="Sign-in shell, owner-only messaging and OAuth action"
            />
            <div className="p-5">
              <div className="rounded-2xl border border-white/10 bg-surface-card p-5 shadow-2xl shadow-black/20">
                <p className="text-xs uppercase tracking-[0.22em] text-brand-300">
                  Sign in
                </p>
                <h2 className="mt-3 text-xl font-semibold text-text-primary">
                  Access your workspace
                </h2>
                <p className="mt-2 text-sm text-text-secondary">
                  Continue with the account authorized for this Financial Command Center.
                </p>
                <Button className="mt-5 w-full" tone="neutral">
                  Continue with Google
                </Button>
              </div>
            </div>
          </Card>

          <Card padded={false}>
            <CardHeader
              title="Session Panel"
              subtitle="Sidebar user identity, active state and sign-out affordance"
            />
            <div className="p-5">
              <div className="max-w-sm rounded-xl border border-white/10 bg-white/[0.035] p-3">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="grid h-10 w-10 place-items-center rounded-full border border-brand-400/25 bg-brand-500/20 text-xs font-semibold text-brand-300">
                      FC
                    </div>
                    <span
                      aria-label="Active session example"
                      className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface-card bg-positive-400"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">Owner account</p>
                    <p className="truncate text-xs text-text-muted">owner@example.com</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                  <span className="text-xs text-text-muted">Session active</span>
                  <Button
                    icon={<ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />}
                    size="sm"
                    tone="neutral"
                  >
                    Secure
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <Landmark aria-hidden="true" className="h-5 w-5 text-info-400" />
            <h2 className="mt-4 font-semibold text-text-primary">Cards</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Standard radius is 12px with white/10 borders and surface tokens.
            </p>
          </Card>
          <Card variant="raised">
            <LineChart aria-hidden="true" className="h-5 w-5 text-positive-400" />
            <h2 className="mt-4 font-semibold text-text-primary">Data viz</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Charts use semantic colors, themed tooltips and compact currency.
            </p>
          </Card>
          <Card variant="ghost">
            <BadgeDollarSign aria-hidden="true" className="h-5 w-5 text-warning-400" />
            <h2 className="mt-4 font-semibold text-text-primary">Financial numbers</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Monetary values use tabular figures for stable scanning.
            </p>
          </Card>
        </section>
      </div>
    </section>
  );
}
