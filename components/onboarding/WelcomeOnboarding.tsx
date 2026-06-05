"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CreditCard,
  Database,
  Landmark,
  Loader2,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { loadSampleData } from "@/lib/actions/onboarding";
import { AnimateIn } from "@/components/ui";
import { tx, type Locale } from "@/lib/i18n/config";

export default function WelcomeOnboarding({
  userName,
  locale = "es",
}: {
  userName?: string | null;
  locale?: Locale;
}) {
  const t = (text: string) => tx(locale, text);
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
    <section className="relative isolate flex min-h-[calc(100dvh-5rem)] items-center justify-center overflow-hidden px-4 py-8 md:px-8">
      <Image
        alt=""
        aria-hidden="true"
        className="data-mountain data-mountain-hero -z-20 object-cover object-center opacity-35"
        fill
        priority
        sizes="100vw"
        src="/landing/data-terrain.svg"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(9,11,17,0.72)_0%,rgba(9,11,17,0.88)_48%,rgba(9,11,17,0.98)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_28%,rgba(16,185,129,0.18),transparent_42%)]"
      />

      <AnimateIn className="w-full max-w-5xl">
        <div className="grid overflow-hidden rounded-2xl border border-brand-400/20 bg-surface-card/82 shadow-2xl shadow-black/35 backdrop-blur-xl lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative border-b border-brand-400/10 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300 to-transparent opacity-80" />

            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-300">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
              {t("Primeros pasos")}
            </div>

            <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-normal text-text-primary sm:text-5xl">
              {firstName ? `${t("Bienvenido,")} ${firstName}.` : t("Bienvenido a tu centro financiero.")}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-text-secondary">
              {t("Tu espacio esta listo para conectar informacion real. Importa un estado de cuenta o carga datos de ejemplo para explorar el producto antes de empezar.")}
            </p>

            <div className="mt-8 grid gap-4">
              <Link
                className="group rounded-xl border border-brand-400/45 bg-brand-500/15 p-5 shadow-[0_0_36px_rgba(16,185,129,0.12)] transition hover:border-brand-300/70 hover:bg-brand-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50"
                href="/import"
              >
                <span className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-brand-400/35 bg-brand-500/20 text-brand-300">
                    <Upload aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-semibold text-text-primary">
                      {t("Importar mis datos")}
                      <ArrowRight
                        aria-hidden="true"
                        className="h-4 w-4 text-brand-300 transition group-hover:translate-x-0.5"
                        strokeWidth={1.8}
                      />
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-text-secondary">
                      {t("Sube CSV, Excel, OFX, PDF o imagen. Revisas la deteccion antes de guardar.")}
                    </span>
                  </span>
                </span>
              </Link>

              <button
                className="group rounded-xl border border-brand-400/15 bg-surface-raised/70 p-5 text-left transition hover:border-brand-400/35 hover:bg-brand-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50 disabled:cursor-wait disabled:opacity-70"
                disabled={isPending}
                onClick={handleLoadSample}
                type="button"
              >
                <span className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-brand-400/20 bg-brand-900 text-brand-300">
                    {isPending ? (
                      <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" strokeWidth={1.8} />
                    ) : (
                      <Sparkles aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="font-semibold text-text-primary">
                      {isPending ? t("Cargando ejemplo...") : t("Probar con datos de ejemplo")}
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-text-secondary">
                      {t("Llena tu dashboard con cuentas, tarjetas, inversiones y metas de muestra. Puedes borrarlo despues.")}
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

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, label: t("Privado") },
                { icon: Database, label: t("Multi-fuente") },
                { icon: BarChart3, label: t("Analitico") },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    className="flex items-center gap-2 rounded-lg border border-brand-400/10 bg-surface-raised/40 px-3 py-2 text-xs font-medium text-text-secondary"
                    key={item.label}
                  >
                    <Icon aria-hidden="true" className="h-4 w-4 text-brand-300" strokeWidth={1.8} />
                    {item.label}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-surface-base/50 p-6 sm:p-8 lg:p-10">
            <EmptyWorkspacePreview t={t} />
          </div>
        </div>
      </AnimateIn>
    </section>
  );
}

function EmptyWorkspacePreview({ t }: { t: (text: string) => string }) {
  return (
    <div className="relative flex h-full min-h-[24rem] flex-col justify-between overflow-hidden rounded-2xl border border-brand-400/15 bg-surface-card/82 p-5 shadow-2xl shadow-black/25">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300 to-transparent" />
      <div aria-hidden="true" className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl" />

      <div className="relative">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-brand-300">
              {t("Vista de tu espacio")}
            </p>
            <p className="mt-1 text-lg font-semibold text-text-primary">
              {t("Vacio, pero listo")}
            </p>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-brand-400/20 bg-brand-500/10 text-xs font-bold text-brand-300">
            FC
          </span>
        </div>

        <div className="rounded-xl border border-brand-400/10 bg-surface-base/55 p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-muted">
              {t("Activacion")}
            </p>
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-300 shadow-[0_0_14px_rgba(110,231,183,0.9)]" />
          </div>
          <div className="flex h-36 items-end gap-2">
            {[36, 64, 46, 82, 58, 92, 72].map((height, index) => (
              <div
                aria-hidden="true"
                className={`flex-1 rounded-t-lg ${index === 5 ? "bg-brand-500" : "bg-text-muted/35"}`}
                key={height + index}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {[
            { icon: Landmark, label: t("Cuentas") },
            { icon: CreditCard, label: t("Tarjetas") },
            { icon: Sparkles, label: t("Metas") },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div className="rounded-xl border border-dashed border-brand-400/20 bg-surface-raised/45 p-4" key={item.label}>
                <Icon aria-hidden="true" className="h-5 w-5 text-brand-300" strokeWidth={1.8} />
                <p className="mt-4 text-sm font-medium text-text-primary">{item.label}</p>
                <div className="mt-3 h-2 rounded-full bg-brand-400/12" />
                <div className="mt-2 h-2 w-2/3 rounded-full bg-brand-400/10" />
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative mt-6 rounded-xl border border-brand-400/20 bg-brand-500/10 p-4">
        <p className="text-sm font-medium text-text-primary">
          {t("Tu primera importacion activa el dashboard.")}
        </p>
        <p className="mt-1 text-xs leading-5 text-text-secondary">
          {t("Cuando haya actividad, el command center llena graficos, balances, tendencias, alertas y metas automaticamente.")}
        </p>
      </div>
    </div>
  );
}
