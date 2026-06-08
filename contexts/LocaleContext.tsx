"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/lib/i18n/config";

const LocaleContext = createContext<Locale>("es");

export function LocaleProvider({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}
