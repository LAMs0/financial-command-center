function SkeletonCard() {
  return (
    <div className="rounded-xl border border-white/10 bg-surface-card p-5 shadow-2xl shadow-black/20">
      <div className="mb-5 h-1 rounded-full bg-gradient-to-r from-white/10 via-white/[0.16] to-white/10" />
      <div className="h-3 w-24 rounded-full bg-white/10" />
      <div className="mt-4 h-8 w-36 rounded-lg bg-white/10" />
      <div className="mt-3 h-3 w-28 rounded-full bg-white/[0.07]" />
    </div>
  );
}

function SkeletonListRow({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4">
      <div className="h-9 w-9 rounded-lg bg-white/10" />
      <div className="min-w-0 space-y-2">
        <div className="h-3 w-40 rounded-full bg-white/10" />
        <div className="h-3 w-28 rounded-full bg-white/[0.07]" />
      </div>
      <div className={`${compact ? "w-14" : "w-24"} h-4 rounded-full bg-white/10`} />
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <section className="flex flex-1 flex-col animate-pulse">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-surface-base/80 px-4 py-4 backdrop-blur md:px-8">
        <div className="h-3 w-32 rounded-full bg-gradient-to-r from-brand-300/20 to-info-400/20" />
        <div className="mt-3 h-8 w-64 rounded-lg bg-white/10" />
      </div>

      <div className="space-y-6 px-4 py-6 md:px-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-xl border border-white/10 bg-surface-card">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="h-4 w-28 rounded-full bg-white/10" />
              <div className="mt-2 h-3 w-56 rounded-full bg-white/[0.07]" />
            </div>
            <div className="divide-y divide-white/10">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonListRow key={index} />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-surface-card p-5">
            <div className="mb-5 flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-28 rounded-full bg-white/10" />
                <div className="h-3 w-40 rounded-full bg-white/[0.07]" />
              </div>
              <div className="h-4 w-12 rounded-full bg-white/10" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div className="rounded-xl border border-white/10 bg-surface-raised p-4" key={index}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-28 rounded-full bg-white/10" />
                      <div className="h-3 w-36 rounded-full bg-white/[0.07]" />
                    </div>
                    <div className="h-3 w-10 rounded-full bg-white/10" />
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-xl border border-white/10 bg-surface-card">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="h-4 w-40 rounded-full bg-white/10" />
              <div className="mt-2 h-3 w-52 rounded-full bg-white/[0.07]" />
            </div>
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonListRow compact key={index} />
            ))}
          </div>

          <div className="rounded-xl border border-white/10 bg-surface-card p-5">
            <div className="mb-5 h-4 w-36 rounded-full bg-white/10" />
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="rounded-xl border border-white/10 bg-surface-raised p-4" key={index}>
                  <div className="h-4 w-32 rounded-full bg-white/10" />
                  <div className="mt-3 h-2 rounded-full bg-white/10" />
                  <div className="mt-3 flex justify-between">
                    <div className="h-3 w-16 rounded-full bg-white/[0.07]" />
                    <div className="h-3 w-16 rounded-full bg-white/[0.07]" />
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
