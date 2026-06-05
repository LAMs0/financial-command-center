"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  localeCookieName,
  localeLabels,
  type Locale,
} from "@/lib/i18n/config";

interface LanguageToggleProps {
  locale: Locale;
}

export default function LanguageToggle({ locale }: LanguageToggleProps) {
  const router = useRouter();
  const nextLocale: Locale = locale === "es" ? "en" : "es";
  const label =
    locale === "es"
      ? "Cambiar idioma a ingles"
      : "Switch language to Spanish";

  function changeLanguage() {
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    window.localStorage.setItem(localeCookieName, nextLocale);
    document.documentElement.lang = nextLocale;
    router.refresh();
  }

  return (
    <button
      aria-label={label}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-xs font-semibold text-text-secondary transition hover:bg-white/[0.08] hover:text-text-primary active:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50"
      onClick={changeLanguage}
      title={label}
      type="button"
    >
      <Languages aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
      <span className="font-mono uppercase">{locale}</span>
      <span className="sr-only">{localeLabels[nextLocale]}</span>
    </button>
  );
}
