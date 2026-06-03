"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { clearAllData } from "@/lib/actions/onboarding";

export default function SampleDataBanner() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const helperText = error
    ?? (confirming
      ? "Esto borrara datos de ejemplo y cualquier dato cargado en este espacio."
      : "Borra el set demo cuando quieras empezar con tu propia informacion.");

  function handleClear() {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await clearAllData();
      if (res?.error) {
        setError(res.error);
        return;
      }
      setConfirming(false);
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
          <p
            aria-live="polite"
            className={`text-xs leading-5 ${error || confirming ? "text-warning-400" : "text-text-secondary"}`}
          >
            {helperText}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        {confirming && (
          <button
            className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-text-secondary transition hover:bg-white/[0.08] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50"
            disabled={isPending}
            onClick={() => setConfirming(false)}
            type="button"
          >
            Cancelar
          </button>
        )}
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-sm font-medium text-text-primary transition hover:border-negative-400/40 hover:bg-negative-900 hover:text-negative-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-negative-400/50 disabled:cursor-wait disabled:opacity-70"
          disabled={isPending}
          onClick={handleClear}
          type="button"
        >
          {isPending ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" strokeWidth={1.8} />
          ) : (
            <Trash2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          )}
          {confirming ? "Si, borrar todo" : "Borrar ejemplo"}
        </button>
      </div>
    </div>
  );
}
