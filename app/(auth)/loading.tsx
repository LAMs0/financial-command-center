import { Skeleton } from "@/components/ui";

export default function AuthLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading sign in"
      className="flex min-h-screen w-full items-center justify-center px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="grid w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-surface-card/88 shadow-2xl shadow-black/25 xl:min-h-[min(760px,calc(100vh-48px))] xl:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden border-r border-white/10 bg-surface-raised/70 p-8 xl:flex xl:flex-col xl:justify-between">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-36 rounded-full" />
                <Skeleton className="h-3 w-44 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-7 w-48 rounded-full" />
            <Skeleton className="mt-6 h-12 w-4/5 rounded-xl" />
            <Skeleton className="mt-4 h-4 w-3/4 rounded-full" />
            <Skeleton className="mt-2 h-4 w-2/3 rounded-full" />
          </div>

          <div className="grid gap-4">
            <Skeleton className="h-32 rounded-xl" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-card p-5 shadow-2xl shadow-black/20 sm:p-7">
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="mt-4 h-8 w-64 rounded-xl" />
            <Skeleton className="mt-3 h-4 w-full rounded-full" />
            <Skeleton className="mt-2 h-4 w-3/4 rounded-full" />
            <Skeleton className="mt-7 h-12 w-full rounded-xl" />
            <Skeleton className="mt-6 h-16 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
