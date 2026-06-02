"use client";

/*
  WelcomeOnboarding — Pantalla de bienvenida para usuarios sin datos.
  ────────────────────────────────────────────────────────────────────
  Se muestra en el dashboard cuando el usuario recién registrado todavía
  no tiene ninguna cuenta/transacción. Ofrece dos caminos:

    1. Importar mis datos        → /import (su propio extracto bancario)
    2. Probar con datos de ejemplo → carga el set demo para explorar

  Es Client Component porque maneja estado de carga del botón y refresca
  la vista (router.refresh) cuando la Server Action termina.
*/

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { loadSampleData } from "@/lib/actions/onboarding";
import { AnimateIn } from "@/components/ui";

export default function WelcomeOnboarding({ userName }: { userName?: string | null }) {
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

  const firstName = userName?.split(" ")[0];

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-10 md:px-8">
      <AnimateIn className="w-full max-w-3xl">
        <div className="rounded-2xl border border-white/10 bg-surface-card p-6 shadow-2xl shadow-black/20 sm:p-10">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
            Primeros pasos
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary">
            {firstName ? `Bienvenido, ${firstName}.` : "Bienvenido a tu Command Center."}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-text-secondary">
            Tu espacio está vacío y listo. Conecta tus finanzas importando un estado
            de cuenta, o explora todas las funciones con datos de ejemplo que puedes
            borrar en cualquier momento.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {/* Camino 1 — importar datos reales (acción principal) */}
            <Link
              href="/import"
              className="group flex flex-col rounded-xl border border-brand-400/40 bg-brand-500/10 p-5 transition hover:border-brand-400/60 hover:bg-brand-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50"
            >
              <span className="grid h-11 w-11 place-items-center rounded-lg border border-brand-400/30 bg-brand-500/15 text-brand-300">
                <Upload aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <span className="mt-4 flex items-center gap-2 font-medium text-text-primary">
                Importar mis datos
                <ArrowRight aria-hidden="true" className="h-4 w-4 text-brand-300 transition group-hover:translate-x-0.5" strokeWidth={1.8} />
              </span>
              <span className="mt-1 text-sm leading-5 text-text-secondary">
                Sube un estado de cuenta (CSV, Excel, OFX, PDF o imagen). Detectamos
                cuentas, tarjetas y movimientos automáticamente.
              </span>
            </Link>

            {/* Camino 2 — datos de ejemplo */}
            <button
              type="button"
              onClick={handleLoadSample}
              disabled={isPending}
              className="group flex flex-col rounded-xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:border-white/20 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50 disabled:cursor-wait disabled:opacity-70"
            >
              <span className="grid h-11 w-11 place-items-center rounded-lg border border-white/10 bg-white/[0.06] text-info-400">
                {isPending ? (
                  <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" strokeWidth={1.8} />
                ) : (
                  <Sparkles aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                )}
              </span>
              <span className="mt-4 font-medium text-text-primary">
                {isPending ? "Cargando ejemplo…" : "Probar con datos de ejemplo"}
              </span>
              <span className="mt-1 text-sm leading-5 text-text-secondary">
                Llena tu dashboard con cuentas, tarjetas, inversiones y metas de muestra
                para ver cómo se siente. Lo borras cuando quieras.
              </span>
            </button>
          </div>

          {error && (
            <p className="mt-4 text-sm text-negative-400" role="alert">
              {error}
            </p>
          )}
        </div>
      </AnimateIn>
    </section>
  );
}
