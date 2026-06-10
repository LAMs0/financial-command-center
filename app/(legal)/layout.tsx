import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { CSSProperties } from "react";
import { tx } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";

/*
  Layout de las páginas legales (/privacy, /terms). Fuera del grupo (main):
  sin sidebar. Aplica la temática near-black/emerald vía tokens locales, igual
  que el landing/sign-in, para mantener coherencia visual.
*/
const legalTheme = {
  "--color-primary": "var(--color-brand-300)",
  "--color-background": "var(--color-surface-base)",
  "--color-on-surface": "var(--color-text-primary)",
  "--color-on-surface-variant": "var(--color-text-secondary)",
} as CSSProperties;

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = (text: string) => tx(locale, text);

  return (
    <main
      className="min-h-dvh bg-surface-base px-4 py-12 text-text-primary sm:px-6 lg:py-20"
      style={legalTheme}
    >
      <div className="mx-auto w-full max-w-3xl">
        <Link
          className="mb-8 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-text-secondary transition hover:text-brand-300"
          href="/"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={2} />
          {t("Volver al inicio")}
        </Link>
        {children}
        <footer className="mt-16 border-t border-surface-border pt-6 font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          Financial Command Center · {t("Beta privada")}
        </footer>
      </div>
    </main>
  );
}
