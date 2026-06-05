import { Skeleton, SkeletonCard, SkeletonListRow } from "@/components/ui";
import { tx } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";

export default async function DashboardLoading() {
  const locale = await getLocale();
  return (
    <section aria-busy="true" aria-label={tx(locale, "Cargando resumen")} className="flex flex-1 flex-col">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-surface-base/80 px-4 py-4 backdrop-blur md:px-8">
        <Skeleton className="h-3 w-32 rounded-full" />
        <Skeleton className="mt-3 h-8 w-64" />
      </div>

      <div className="space-y-6 px-4 py-6 md:px-8">
        {/* Skeleton del MonthSelector + StatCards */}
        <div className="space-y-4">
          <div className="flex gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-12" />
            ))}
          </div>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </section>
        </div>

        {/* Skeleton del NetWorthChart */}
        <div className="rounded-xl border border-white/10 bg-surface-card">
          <div className="border-b border-white/10 px-5 py-4">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="mt-2 h-3 w-52 rounded-full" />
          </div>
          <div className="px-2 pb-5 pt-4">
            <Skeleton className="h-64" />
          </div>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-xl border border-white/10 bg-surface-card">
            <div className="border-b border-white/10 px-5 py-4">
              <Skeleton className="h-4 w-28 rounded-full" />
              <Skeleton className="mt-2 h-3 w-56 rounded-full" />
            </div>
            <div className="divide-y divide-white/10">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonListRow key={index} />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-surface-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28 rounded-full" />
                <Skeleton className="h-3 w-40 rounded-full" />
              </div>
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div className="rounded-xl border border-white/10 bg-surface-raised p-4" key={index}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28 rounded-full" />
                      <Skeleton className="h-3 w-36 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-10 rounded-full" />
                  </div>
                  <Skeleton className="mt-4 h-2 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-xl border border-white/10 bg-surface-card">
            <div className="border-b border-white/10 px-5 py-4">
              <Skeleton className="h-4 w-40 rounded-full" />
              <Skeleton className="mt-2 h-3 w-52 rounded-full" />
            </div>
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonListRow compact key={index} />
            ))}
          </div>

          <div className="rounded-xl border border-white/10 bg-surface-card p-5">
            <Skeleton className="mb-4 h-4 w-36 rounded-full" />
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="rounded-xl border border-white/10 bg-surface-raised p-4" key={index}>
                  <Skeleton className="h-4 w-32 rounded-full" />
                  <Skeleton className="mt-3 h-2 rounded-full" />
                  <div className="mt-3 flex justify-between">
                    <Skeleton className="h-3 w-16 rounded-full" />
                    <Skeleton className="h-3 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
