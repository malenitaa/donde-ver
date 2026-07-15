"use client";

import { createContext, useContext, useEffect } from "react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { detectBrowserLocale, STRINGS, type Locale, type Strings } from "@/lib/i18n";

const LOCALE_KEY = "donde-ver:locale";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Strings;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale, loaded] = useLocalStorage<Locale | null>(LOCALE_KEY, null);

  useEffect(() => {
    // No language chosen yet: suggest one from the browser's own language
    // setting (a device preference, not IP/location) and save it — still
    // just a starting point, changeable anytime via the language toggle.
    if (loaded && locale === null) setLocale(detectBrowserLocale());
  }, [loaded, locale, setLocale]);

  if (!loaded || locale === null) return null;

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: STRINGS[locale] }}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}
