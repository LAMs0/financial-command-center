interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={[
        "rounded-lg bg-gradient-to-r from-white/[0.06] via-white/[0.12] to-white/[0.06] animate-pulse",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-white/10 bg-surface-card p-5 shadow-2xl shadow-black/20">
      <Skeleton className="mb-4 h-1" />
      <Skeleton className="h-3 w-24 rounded-full" />
      <Skeleton className="mt-4 h-8 w-36" />
      <Skeleton className="mt-3 h-3 w-28 rounded-full" />
    </div>
  );
}

export function SkeletonListRow({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4">
      <Skeleton className="h-9 w-9" />
      <div className="min-w-0 space-y-2">
        <Skeleton className="h-3 w-40 rounded-full" />
        <Skeleton className="h-3 w-28 rounded-full" />
      </div>
      <Skeleton className={`${compact ? "w-14" : "w-24"} h-4 rounded-full`} />
    </div>
  );
}
