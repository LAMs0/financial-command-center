"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  Landmark,
  Loader2,
  Sparkles,
  Upload,
  WalletCards,
} from "lucide-react";
import { loadSampleData } from "@/lib/actions/onboarding";
import { AnimateIn } from "@/components/ui";

export default function WelcomeOnboarding({
  userName,
}: {
  userName?: string | null;
}) {
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
    <section className="flex min-h-[calc(100dvh-5rem)] items-center justify-center px-4 py-8 md:px-8">
      <AnimateIn className="w-full max-w-5xl">
        <div className="grid overflow-hidden rounded-2xl border border-white/10 bg-surface-card shadow-2xl shadow-black/20 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
              Primeros pasos
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-normal text-text-primary sm:text-4xl">
              {firstName ? `Bienvenido, ${firstName}.` : "Bienvenido a tu Command Center."}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-text-secondary">
              Tu espacio esta listo para conectar informacion real. Importa un
              estado de cuenta o carga datos de ejemplo para explorar el producto
              antes de empezar.
            </p>

            <div className="mt-8 grid gap-4">
              <Link
                className="group rounded-xl border border-brand-400/40 bg-brand-500/15 p-5 transition hover:border-brand-400/60 hover:bg-brand-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50"
                href="/import"
              >
                <span className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-brand-400/30 bg-brand-500/20 text-brand-300">
                    <Upload aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-semibold text-text-primary">
                      Importar mis datos
                      <ArrowRight
                        aria-hidden="true"
                        className="h-4 w-4 text-brand-300 transition group-hover:translate-x-0.5"
                        strokeWidth={1.8}
                      />
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-text-secondary">
                      Sube CSV, Excel, OFX, PDF o imagen. Revisas la deteccion
                      antes de guardar.
                    </span>
                  </span>
                </span>
              </Link>

              <button
                className="group rounded-xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:border-white/20 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50 disabled:cursor-wait disabled:opacity-70"
                disabled={isPending}
                onClick={handleLoadSample}
                type="button"
              >
                <span className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-info-400/20 bg-info-900 text-info-400">
                    {isPending ? (
                      <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" strokeWidth={1.8} />
                    ) : (
                      <Sparkles aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="font-semibold text-text-primary">
                      {isPending ? "Cargando ejemplo..." : "Probar con datos de ejemplo"}
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-text-secondary">
                      Llena tu dashboard con cuentas, tarjetas, inversiones y
                      metas de muestra. Puedes borrarlo despues.
                    </span>
                  </span>
                </span>
              </button>
            </div>

            {error && (
              <p className="mt-4 text-sm text-negative-400" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="bg-surface-raised/70 p-6 sm:p-8 lg:p-10">
            <EmptyWorkspacePreview />
          </div>
        </div>
      </AnimateIn>
    </section>
  );
}

function EmptyWorkspacePreview() {
  return (
    <div className="flex h-full min-h-[24rem] flex-col justify-between rounded-2xl border border-white/10 bg-surface-card p-5">
      <div>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-text-muted">
              Vista de tu espacio
            </p>
            <p className="mt-1 text-lg font-semibold text-text-primary">
              Vacío, pero listo
            </p>
          </div>
          <WalletCards aria-hidden="true" className="h-5 w-5 text-brand-300" strokeWidth={1.8} />
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {[
            { icon: Landmark, label: "Cuentas" },
            { icon: CreditCard, label: "Tarjetas" },
            { icon: Sparkles, label: "Metas" },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-4" key={item.label}>
                <Icon aria-hidden="true" className="h-5 w-5 text-text-muted" strokeWidth={1.8} />
                <p className="mt-4 text-sm font-medium text-text-primary">{item.label}</p>
                <div className="mt-3 h-2 rounded-full bg-white/[0.08]" />
                <div className="mt-2 h-2 w-2/3 rounded-full bg-white/[0.06]" />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-brand-400/20 bg-brand-500/10 p-4">
        <p className="text-sm font-medium text-text-primary">
          Tu primera importación activa el dashboard.
        </p>
        <p className="mt-1 text-xs leading-5 text-text-secondary">
          Cuando haya actividad, el command center llena gráficos, balances,
          tendencias, alertas y metas automáticamente.
        </p>
      </div>
    </div>
  );
}
