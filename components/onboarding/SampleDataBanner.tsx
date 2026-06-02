"use client";

/*
  SampleDataBanner — Aviso de "datos de ejemplo".
  ────────────────────────────────────────────────
  Se muestra arriba del dashboard cuando el usuario está explorando con el
  set de datos demo (User.usingSampleData = true). Le permite borrarlos y
  empezar con su propia información en un clic.
*/

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Trash2, Loader2 } from "lucide-react";
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
    <div className="flex flex-col gap-3 rounded-xl border border-info-400/30 bg-info-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5">
        <Sparkles aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-info-400" strokeWidth={1.8} />
        <div>
          <p className="text-sm font-medium text-text-primary">Estás explorando con datos de ejemplo</p>
          <p className="text-xs text-text-secondary">
            {error ?? "Cuando quieras, bórralos y empieza con tu propia información."}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleClear}
        disabled={isPending}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-sm font-medium text-text-primary transition hover:border-negative-400/40 hover:bg-negative-500/10 hover:text-negative-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-negative-400/50 disabled:cursor-wait disabled:opacity-70"
      >
        {isPending ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" strokeWidth={1.8} />
        ) : (
          <Trash2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
        )}
        Borrar y empezar de cero
      </button>
    </div>
  );
}
