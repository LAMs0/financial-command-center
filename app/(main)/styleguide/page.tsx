import {
  ArrowRight,
  BadgeDollarSign,
  Bell,
  Landmark,
  LineChart,
  SearchX,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ProgressBar,
  SectionHeader,
  StatCard,
} from "@/components/ui";

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
                    <p className="text-3xl font-semibold text-white">Display / 30</p>
                    <p className="text-base font-semibold text-white">Section / 16</p>
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
                <div className="flex flex-wrap gap-2">
                  <Badge label="Positive" tone="positive" />
                  <Badge label="Negative" tone="negative" />
                  <Badge label="Warning" tone="warning" />
                  <Badge label="Info" tone="info" />
                  <Badge label="Neutral" tone="neutral" />
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

              <EmptyState
                icon={<SearchX aria-hidden="true" className="h-5 w-5" />}
                title="Empty state pattern"
                description="Used when filtered or future API-backed datasets return no records."
                action={<Button tone="neutral">Reset view</Button>}
              />
            </div>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <Landmark aria-hidden="true" className="h-5 w-5 text-info-400" />
            <h2 className="mt-4 font-semibold text-white">Cards</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Standard radius is 12px with white/10 borders and surface tokens.
            </p>
          </Card>
          <Card variant="raised">
            <LineChart aria-hidden="true" className="h-5 w-5 text-positive-400" />
            <h2 className="mt-4 font-semibold text-white">Data viz</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Charts use semantic colors, themed tooltips and compact currency.
            </p>
          </Card>
          <Card variant="ghost">
            <BadgeDollarSign aria-hidden="true" className="h-5 w-5 text-warning-400" />
            <h2 className="mt-4 font-semibold text-white">Financial numbers</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Monetary values use tabular figures for stable scanning.
            </p>
          </Card>
        </section>
      </div>
    </section>
  );
}
