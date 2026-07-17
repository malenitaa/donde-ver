"use client";

import Link from "next/link";
import { useLocale } from "./LocaleProvider";

type Props = {
  onEditPlatforms: () => void;
  onEditCountry: () => void;
};

export default function Header({ onEditPlatforms, onEditCountry }: Props) {
  const { locale, setLocale, t } = useLocale();

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-900 bg-neutral-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2.5 sm:py-3">
        <Link
          href="/"
          className="shrink-0 whitespace-nowrap text-base font-bold tracking-tight text-neutral-50 sm:text-lg"
        >
          {t.appName}
        </Link>
        <nav className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs text-neutral-300 sm:gap-x-4 sm:text-sm">
          <Link href="/watchlist" className="whitespace-nowrap hover:text-neutral-50">
            {t.myList}
          </Link>
          <button
            type="button"
            onClick={() => setLocale(locale === "es" ? "en" : "es")}
            className="rounded-full border border-neutral-800 px-2.5 py-1 hover:border-neutral-600 hover:text-neutral-50 sm:px-3 sm:py-1.5"
            aria-label={t.editLanguageAria}
          >
            {locale === "es" ? "EN" : "ES"}
          </button>
          <button
            type="button"
            onClick={onEditCountry}
            className="flex items-center gap-1 whitespace-nowrap rounded-full border border-neutral-800 px-2.5 py-1 hover:border-neutral-600 hover:text-neutral-50 sm:px-3 sm:py-1.5"
            aria-label={t.editCountryAria}
          >
            <span aria-hidden>🌎</span> {t.editCountry}
          </button>
          <button
            type="button"
            onClick={onEditPlatforms}
            className="flex items-center gap-1 whitespace-nowrap rounded-full border border-neutral-800 px-2.5 py-1 hover:border-neutral-600 hover:text-neutral-50 sm:px-3 sm:py-1.5"
            aria-label={t.editPlatformsAria}
          >
            <span aria-hidden>⚙️</span> {t.editPlatforms}
          </button>
        </nav>
      </div>
    </header>
  );
}
