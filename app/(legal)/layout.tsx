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
  "--color-primary": "#6ee7b7",
  "--color-background": "#141313",
  "--color-on-surface": "#e5e2e1",
  "--color-on-surface-variant": "#b9d8cc",
} as CSSProperties;

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = (text: string) => tx(locale, text);

  return (
    <main
      className="min-h-dvh bg-[#0a0a0b] px-4 py-12 text-[#ece9e7] sm:px-6 lg:py-20"
      style={legalTheme}
    >
      <div className="mx-auto w-full max-w-3xl">
        <Link
          className="mb-8 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-[#a8a29e] transition hover:text-[#6ee7b7]"
          href="/"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={2} />
          {t("Volver al inicio")}
        </Link>
        {children}
        <footer className="mt-16 border-t border-white/10 pt-6 font-mono text-xs uppercase tracking-[0.16em] text-[#78716c]">
          Financial Command Center · {t("Beta privada")}
        </footer>
      </div>
    </main>
  );
}
