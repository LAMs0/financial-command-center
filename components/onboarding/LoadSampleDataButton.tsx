"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { loadSampleData } from "@/lib/actions/onboarding";

export default function LoadSampleDataButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleLoadSample() {
    setError(null);
    startTransition(async () => {
      const res = await loadSampleData();
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-white/[0.08] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50 disabled:cursor-wait disabled:opacity-70"
        disabled={isPending}
        onClick={handleLoadSample}
        type="button"
      >
        {isPending ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" strokeWidth={1.8} />
        ) : (
          <Sparkles aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
        )}
        {isPending ? "Loading sample..." : "Try sample data"}
      </button>
      {error && (
        <p className="text-xs text-negative-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
