import Link from "next/link";
import type { CSSProperties } from "react";
import { auth } from "@/auth";
import { LanguageToggle } from "@/components/ui";
import { LandingEffects } from "@/components/landing/LandingEffects";
import { MockupCard } from "@/components/landing/MockupCard";
import { tx } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import {
  ArrowRight,
  Banknote,
  BarChart3,
  CreditCard,
  FileText,
  Flag,
  LineChart,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Upload,
  WalletCards,
} from "lucide-react";

export const metadata = {
  title: "Financial Command Center",
  description:
    "Un centro privado para importar estados de cuenta, entender tu flujo de caja y organizar tus decisiones financieras.",
};

const landingTheme = {
  "--color-primary": "var(--color-brand-300)",
  "--color-primary-container": "var(--color-brand-500)",
  "--color-on-primary-container": "#022c22",
  "--color-surface-container": "var(--color-surface-card)",
  "--color-surface-container-low": "var(--color-surface-raised)",
  "--color-surface-container-lowest": "var(--color-surface-base)",
  "--color-background": "var(--color-surface-card)",
  "--color-on-surface": "var(--color-text-primary)",
  "--color-on-surface-variant": "var(--color-text-secondary)",
  "--color-outline-variant": "var(--color-surface-border)",
} as CSSProperties;

const navItems = [
  { label: "Producto", href: "#producto" },
  { label: "Importacion", href: "#importacion" },
  { label: "Analitica", href: "#analitica" },
  { label: "Seguridad", href: "#seguridad" },
];

const mockMetrics = [
  { label: "Patrimonio", value: "$196,750", tone: "text-on-surface" },
  { label: "Flujo", value: "+$8,420", tone: "text-green-400" },
  { label: "Credito", value: "28%", tone: "text-amber-300" },
  { label: "Metas", value: "4 activas", tone: "text-on-surface" },
];

const productCards = [
  {
    icon: Banknote,
    title: "Cuentas en un solo lugar",
    body: "Reune cuentas bancarias, efectivo e inversiones para entender tu posicion real.",
  },
  {
    icon: CreditCard,
    title: "Tarjetas bajo control",
    body: "Visualiza balances, limites, fechas de pago y uso de credito antes de que sea tarde.",
  },
  {
    icon: ReceiptText,
    title: "Transacciones claras",
    body: "Convierte movimientos importados en categorias, tendencias y alertas accionables.",
  },
];

const toolItems = [
  { icon: BarChart3, label: "Dashboard" },
  { icon: Upload, label: "Importacion" },
  { icon: ReceiptText, label: "Transacciones" },
  { icon: WalletCards, label: "Presupuesto" },
  { icon: Flag, label: "Metas" },
  { icon: LineChart, label: "Inversiones" },
  { icon: FileText, label: "Reportes" },
  { icon: ShieldCheck, label: "Seguridad" },
];

export default async function LandingPage() {
  const [session, locale] = await Promise.all([auth(), getLocale()]);
  const t = (text: string) => tx(locale, text);
  const signedIn = Boolean(session?.user);
  const ctaHref = signedIn ? "/dashboard" : "/sign-in";
  const ctaLabel = signedIn ? t("Ir al dashboard") : t("Probar beta");

  return (
    <main
      className="min-h-dvh overflow-x-hidden bg-background text-on-surface"
      style={landingTheme}
    >
      <div className="noise-overlay" />

      <header className="fixed left-1/2 top-3 z-[100] flex w-[calc(100%-1.5rem)] max-w-6xl -translate-x-1/2 items-center justify-between gap-3 rounded-full border border-primary/20 bg-background/90 px-3 py-2 shadow-2xl shadow-black/25 backdrop-blur-md sm:top-4 sm:w-[calc(100%-2rem)] sm:px-5 sm:py-3">
        <Link className="flex min-w-0 items-center gap-3" href="/">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-primary/30 bg-primary-container/25 text-xs font-bold text-primary">
            FC
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display-lg text-sm font-bold tracking-tighter text-on-surface sm:text-base">
              Financial Command
            </span>
            <span className="hidden truncate text-xs text-on-surface-variant/70 sm:block">
              {t("Centro financiero personal")}
            </span>
          </span>
        </Link>

        <nav aria-label={t("Navegacion principal")} className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <a
              className="font-label-md text-label-md text-on-surface-variant transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              href={item.href}
              key={item.href}
            >
              {t(item.label)}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageToggle locale={locale} />
          <WalletCards
            aria-hidden="true"
            className="hidden h-5 w-5 text-on-surface-variant sm:block"
            strokeWidth={1.8}
          />
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-full bg-primary-container px-3 py-2 font-label-md text-label-md text-on-primary-container shadow-[0_0_24px_rgba(16,185,129,0.22)] transition-all hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-95 sm:px-5"
          >
            <span>{ctaLabel}</span>
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </div>
      </header>

      <section className="relative flex min-h-[92svh] flex-col items-center justify-center overflow-hidden px-4 pb-14 pt-28 text-center grid-background sm:px-6 lg:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="data-mountain data-mountain-hero h-full w-full object-cover object-center grayscale"
            alt=""
            src="/landing/data-terrain.svg"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/45 via-background/35 to-background/90" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent" />
        </div>
        <div className="container z-10 mx-auto">
          <h1 className="mx-auto mb-5 max-w-4xl font-display-lg text-4xl font-bold uppercase leading-tight tracking-normal text-on-surface sm:text-5xl lg:text-display-lg">
            {t("Tu dinero, bajo")} <span className="premium-accent">{t("control total")}</span>.
          </h1>
          <p className="mx-auto mb-10 max-w-2xl font-body-lg text-body-lg text-on-surface-variant/75">
            {t("Importa estados de cuenta, revisa flujo de caja, monitorea tarjetas y convierte tus movimientos en decisiones claras.")}
          </p>

          <div className="relative mx-auto mt-8 w-full max-w-5xl" style={{ perspective: "1000px" }}>
            <MockupCard>
              <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:grid-cols-4 sm:gap-4">
                {mockMetrics.map((metric) => (
                  <div
                    className="rounded-lg border border-white/5 bg-surface-container-low p-3 text-left sm:p-4"
                    key={metric.label}
                  >
                    <div className="mb-2 text-label-sm uppercase text-on-surface-variant/50">
                      {t(metric.label)}
                    </div>
                    <div className={`font-headline-md text-lg sm:text-headline-md ${metric.tone}`}>
                      {metric.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex h-48 items-end justify-between gap-1 sm:h-64">
                {[45, 68, 38, 56, 86, 62, 32, 74].map((height, index) => (
                  <div
                    aria-hidden="true"
                    className={`w-full rounded-t-sm ${index === 4 ? "bg-primary-container" : "bg-primary/30"}`}
                    key={`${height}-${index}`}
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </MockupCard>

          </div>
        </div>
      </section>

      <section id="producto" className="bg-background px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <h2 className="mb-12 text-center font-headline-lg text-3xl font-semibold uppercase tracking-normal sm:text-headline-lg">
            {t("Un centro de mando para tus finanzas personales")}
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {productCards.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  className="flex flex-col gap-4 surface-panel p-6 transition-all duration-500 premium-glow-hover sm:p-8"
                  key={card.title}
                >
                  <Icon aria-hidden="true" className="h-8 w-8 text-primary" strokeWidth={1.8} />
                  <h3 className="font-headline-md text-headline-md uppercase">{t(card.title)}</h3>
                  <p className="font-body-md text-on-surface-variant/70">{t(card.body)}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="importacion"
        className="relative overflow-hidden border-y border-white/5 bg-surface-container-lowest px-4 py-24 sm:px-6 lg:px-8"
      >
        <div className="container mx-auto grid gap-12 md:grid-cols-2 md:items-center lg:gap-16">
          <div>
            <div className="mb-4 flex items-center gap-2 text-label-sm text-primary">
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(16,185,129,0.85)]" />
              {t("IMPORT / REVIEW / DECIDE")}
            </div>
            <h2 className="mb-6 font-headline-lg text-3xl font-semibold uppercase leading-tight sm:text-headline-lg">
              {t("Convierte tus estados de cuenta en")}{" "}
              <span className="premium-accent">{t("inteligencia financiera")}</span>
            </h2>
            <p className="mb-8 font-body-lg text-on-surface-variant">
              {t("La beta lee CSV, Excel, OFX, PDF e imagenes con OCR. Antes de guardar, muestra confianza, advertencias y vista previa para que el usuario confirme lo importante.")}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="border-l border-primary/30 py-2 pl-4">
                <div className="font-headline-md text-headline-md">{t("5 formatos")}</div>
                <div className="text-label-sm uppercase text-on-surface-variant/50">
                  {t("Importacion")}
                </div>
              </div>
              <div className="border-l border-primary/30 py-2 pl-4">
                <div className="font-headline-md text-headline-md">OCR</div>
                <div className="text-label-sm uppercase text-on-surface-variant/50">
                  {t("Revision visual")}
                </div>
              </div>
            </div>
          </div>

          <div className="relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-black p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="h-full w-full object-cover opacity-40 mix-blend-screen grayscale"
              alt={t("Pantalla tecnica con graficas financieras y lecturas de datos.")}
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_MeL9pFKlT3Y1T8eN101szsoCHtFi9VlVOgGEyA8RR-8YQUfBopExtWkHO-PcmJUcQOs4jm8HQ8SC5YrZ6IEEL7GLWEoARh1L4HHtq6yl1X18kXak2veKc3HwecDcRclUtXP3hBb6c5JOQcUFbTfv0be8xiThWXVnaFlQVPDrgQDpsk8gKo4tm292P5SF4I0iSsEZjjOs0aImZwbSu_LNQ53a-0Ky0L-_gwxEhy-hc4re4uFEkI7C-679FtpCc1q1vV0ElMhf95Y5"
            />
            <div className="pointer-events-none absolute inset-4 flex flex-col justify-between border border-primary/20 p-2">
              <div className="flex justify-between text-[8px] font-mono text-primary/60">
                <span>PARSER_READY</span>
                <span>REVIEW_REQUIRED</span>
              </div>
              <div className="flex justify-between text-[8px] font-mono text-primary/60">
                <span>CSV / PDF / OCR</span>
                <span>STATUS: BETA</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="analitica" className="bg-background px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="mb-14 text-center">
            <h2 className="mb-4 font-headline-lg text-3xl font-semibold uppercase sm:text-headline-lg">
              {t("Herramientas que ya existen en la app")}
            </h2>
            <div className="mx-auto h-1 w-24 bg-primary-container" />
          </div>
          <div className="grid grid-cols-2 border border-white/5 bg-white/5 sm:grid-cols-4">
            {toolItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  className="group flex min-h-36 flex-col items-center justify-center gap-4 bg-background p-5 text-center transition-colors hover:bg-surface-container-low sm:p-8"
                  key={item.label}
                >
                  <Icon
                    aria-hidden="true"
                    className="h-7 w-7 transition-colors group-hover:text-primary"
                    strokeWidth={1.8}
                  />
                  <div className="font-label-md text-label-md uppercase">{t(item.label)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <h2 className="mb-12 text-center font-headline-lg text-3xl font-semibold uppercase sm:text-headline-lg">
            {t("Para momentos financieros reales")}
          </h2>
          <div className="space-y-4">
            {[
              {
                title: "Ordenar el punto de partida",
                body: "Usa datos de ejemplo o importa movimientos reales para ver tu posicion sin construir una hoja desde cero.",
                icon: FileText,
              },
              {
                title: "Controlar deuda y credito",
                body: "Identifica tarjetas, limites, utilizacion y pagos para priorizar los proximos movimientos.",
                icon: CreditCard,
              },
              {
                title: "Planear metas y presupuesto",
                body: "Conecta transacciones con objetivos, categorias y alertas de gasto antes de cerrar el mes.",
                icon: Flag,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article
                  className="group relative flex cursor-default flex-col gap-6 overflow-hidden border border-white/5 bg-background p-6 transition-all hover:border-primary/40 md:flex-row md:items-center md:justify-between md:p-8"
                  key={item.title}
                >
                  <div className="z-10">
                    <h3 className="mb-2 font-headline-md text-headline-md uppercase">{t(item.title)}</h3>
                    <p className="max-w-xl text-on-surface-variant/70">{t(item.body)}</p>
                  </div>
                  <Icon
                    aria-hidden="true"
                    className="h-12 w-12 opacity-20 transition-all group-hover:text-primary group-hover:opacity-100"
                    strokeWidth={1.5}
                  />
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="seguridad" className="border-t border-white/5 px-4 py-24 grid-background sm:px-6 lg:px-8">
        <div className="container mx-auto flex flex-col items-center gap-12 md:flex-row md:gap-16">
          <div className="w-full md:w-1/2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="aspect-square w-full object-cover opacity-20 grayscale"
              alt={t("Arquitectura abstracta de seguridad y privacidad.")}
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTNGcPz1I9o32lBVqN1SNTuhAOxT8PrEcbTXlVBcLpouwOYsEP9xrU8kn9hIpvlbjmJVQPxRdu1sQpz3LWfN_a_1MDzHAl3OrxTiogviGgOTgqtHQnljynKJqAiyvCYAo4EgQuE85t2f-2hJtySOd3fVxfsBCfYAf3te_QleicvijlvA8ARiBcfkKx_RRRrSHmEbTOCdT8RMmA4GV5BW4npDhAyR9FF8pvjUuAAKQHACJnWlw64Ix8lGslHb2NFWdOgYHW289qaorM"
            />
          </div>
          <div className="w-full md:w-1/2">
            <h2 className="mb-6 font-headline-lg text-3xl font-semibold uppercase sm:text-headline-lg">
              Privacidad, claridad y control por diseño
            </h2>
            <p className="mb-8 font-body-lg text-on-surface-variant">
              {t("El producto esta construido para beta multiusuario: cada usuario trabaja en su espacio, los datos de ejemplo se pueden borrar con confirmacion y los errores tienen salida clara.")}
            </p>
            <ul className="space-y-4">
              {[
                { icon: ShieldCheck, label: "Autenticacion con Google OAuth" },
                { icon: LockKeyhole, label: "Datos separados por usuario" },
                { icon: FileText, label: "Advertencias visibles al importar" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <li className="flex items-center gap-4 text-label-md" key={item.label}>
                    <Icon aria-hidden="true" className="h-5 w-5 text-primary" strokeWidth={1.8} />
                    {t(item.label)}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <section className="relative flex items-center justify-center overflow-hidden bg-black px-4 py-28 text-center sm:px-6 sm:py-36 lg:px-8">
        <div
          data-cta-glow
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.14),transparent_70%)]"
        />
        <div className="container z-10 mx-auto">
          <h2 className="mb-8 font-display-lg text-4xl font-bold uppercase tracking-normal sm:text-display-lg">
            {t("Deja de adivinar.")}<br />{t("Empieza a dirigir tu dinero.")}
          </h2>
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-full bg-primary-container px-8 py-4 font-headline-md text-lg text-on-primary-container shadow-[0_0_42px_rgba(16,185,129,0.28)] transition-all hover:scale-105 hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-95 sm:px-12 sm:py-5 sm:text-headline-md"
          >
            {ctaLabel}
            <ArrowRight aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
          </Link>
          <div className="mt-10 flex flex-wrap justify-center gap-4 font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant/50 sm:gap-8">
            <span>{t("Claridad")}</span>
            <span>Control</span>
            <span>{t("Privacidad")}</span>
          </div>
        </div>
      </section>

      <footer className="relative overflow-hidden border-t border-primary/10 bg-black px-4 py-10 sm:px-6 lg:px-8">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.12),transparent_42%)]" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-primary/25 bg-primary/10 text-xs font-bold text-primary">
              FC
            </span>
            <div>
              <div className="font-headline-lg text-headline-md text-on-surface">
                FINANCIAL COMMAND CENTER
              </div>
              <p className="mt-1 font-label-sm text-label-sm text-primary/65">
                {t("Beta privada para decisiones financieras personales.")}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 md:items-end">
            <div className="flex flex-wrap justify-center gap-6">
              {navItems.map((item) => (
                <a
                  className="font-label-sm text-label-sm text-on-surface-variant/65 transition-colors hover:text-primary"
                  href={item.href}
                  key={item.href}
                >
                  {t(item.label)}
                </a>
              ))}
              <Link
                className="font-label-sm text-label-sm text-on-surface-variant/65 transition-colors hover:text-primary"
                href="/privacy"
              >
                {t("Privacidad")}
              </Link>
              <Link
                className="font-label-sm text-label-sm text-on-surface-variant/65 transition-colors hover:text-primary"
                href="/terms"
              >
                {t("Terminos")}
              </Link>
            </div>
            <p className="text-center font-label-sm text-label-sm text-on-surface-variant/45 md:text-right">
              {t("Privacidad, claridad y control en un solo espacio.")}
            </p>
          </div>
        </div>
      </footer>

      <LandingEffects />
    </main>
  );
}
