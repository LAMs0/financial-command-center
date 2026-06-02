"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { clearAllData } from "@/lib/actions/onboarding";

export default function SampleDataBanner() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    setError(null);
    startTransition(async () => {
      const res = await clearAllData();
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-info-400/30 bg-info-900 px-4 py-3 shadow-2xl shadow-black/10 sm:flex-row sm:items-center sm:justify-between"
      role="status"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-info-400/25 bg-white/[0.04]">
          <Sparkles aria-hidden="true" className="h-4 w-4 text-info-400" strokeWidth={1.8} />
        </span>
        <div>
          <p className="text-sm font-semibold text-text-primary">
            Estas explorando con datos de ejemplo
          </p>
          <p className={`text-xs leading-5 ${error ? "text-negative-400" : "text-text-secondary"}`}>
            {error ?? "Borra el set demo cuando quieras empezar con tu propia informacion."}
          </p>
        </div>
      </div>

      <button
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-sm font-medium text-text-primary transition hover:border-negative-400/40 hover:bg-negative-900 hover:text-negative-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-negative-400/50 disabled:cursor-wait disabled:opacity-70"
        disabled={isPending}
        onClick={handleClear}
        type="button"
      >
        {isPending ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" strokeWidth={1.8} />
        ) : (
          <Trash2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
        )}
        Borrar ejemplo
      </button>
    </div>
  );
}
