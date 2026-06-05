import { Skeleton, SkeletonCard, SkeletonListRow } from "@/components/ui";
import { tx } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";

type PageLoadingVariant = "list" | "cards" | "chart-list" | "analytics" | "import";

interface PageLoadingProps {
  ariaLabel: string;
  statCards?: number;
  variant?: PageLoadingVariant;
}

export default async function PageLoading({
  ariaLabel,
  statCards = 3,
  variant = "list",
}: PageLoadingProps) {
  const locale = await getLocale();
  return (
    <section aria-busy="true" aria-label={tx(locale, ariaLabel)} className="flex flex-1 flex-col">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-surface-base/80 px-4 py-4 backdrop-blur md:px-8">
        <Skeleton className="h-3 w-28 rounded-full" />
        <Skeleton className="mt-3 h-8 w-64 max-w-full" />
      </div>

      <div className="space-y-6 px-4 py-6 md:px-8">
        {statCards > 0 && (
          <section className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: statCards }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </section>
        )}

        {variant === "list" && <ListSkeleton />}
        {variant === "cards" && <CardsSkeleton />}
        {variant === "chart-list" && <ChartListSkeleton />}
        {variant === "analytics" && <AnalyticsSkeleton />}
        {variant === "import" && <ImportSkeleton />}
      </div>
    </section>
  );
}

function ListSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-surface-card">
      <div className="border-b border-white/10 px-5 py-4">
        <Skeleton className="h-4 w-36 rounded-full" />
        <Skeleton className="mt-2 h-3 w-56 rounded-full" />
      </div>
      <div className="divide-y divide-white/10">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonListRow key={index} />
        ))}
      </div>
    </div>
  );
}

function CardsSkeleton() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="rounded-xl border border-white/10 bg-surface-card p-5" key={index}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded-full" />
              <Skeleton className="h-3 w-44 rounded-full" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="mt-5 h-2 rounded-full" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
        </div>
      ))}
    </section>
  );
}

function ChartListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-surface-card">
        <div className="border-b border-white/10 px-5 py-4">
          <Skeleton className="h-4 w-40 rounded-full" />
          <Skeleton className="mt-2 h-3 w-60 rounded-full" />
        </div>
        <div className="px-4 py-5">
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
      <ListSkeleton />
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-surface-card">
        <div className="border-b border-white/10 px-5 py-4">
          <Skeleton className="h-4 w-36 rounded-full" />
          <Skeleton className="mt-2 h-3 w-56 rounded-full" />
        </div>
        <div className="px-4 py-5">
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-surface-card">
        <div className="border-b border-white/10 px-5 py-4">
          <Skeleton className="h-4 w-40 rounded-full" />
          <Skeleton className="mt-2 h-3 w-52 rounded-full" />
        </div>
        <div className="divide-y divide-white/10">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonListRow compact key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ImportSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-2xl border-2 border-dashed border-white/20 px-8 py-16">
        <div className="mx-auto flex max-w-sm flex-col items-center">
          <Skeleton className="h-16 w-16 rounded-2xl" />
          <Skeleton className="mt-5 h-5 w-64 rounded-full" />
          <Skeleton className="mt-3 h-4 w-full rounded-full" />
          <Skeleton className="mt-2 h-4 w-4/5 rounded-full" />
          <Skeleton className="mt-6 h-10 w-36 rounded-lg" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-24 rounded-xl" key={index} />
        ))}
      </div>
    </div>
  );
}
