"use client";

import { useLocale } from "./LocaleProvider";

// TMDB's API terms require this notice; TMDB's watch/providers data (and our
// leaving-soon feed) come from JustWatch, which requires attribution too.
export default function Footer() {
  const { t } = useLocale();
  return (
    <footer className="mx-auto w-full max-w-5xl px-4 py-6 text-xs text-neutral-500">
      <p>
        {t.attributionTmdb}{" "}
        <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-neutral-300">
          themoviedb.org
        </a>
      </p>
      <p className="mt-1">
        {t.attributionJustWatch}{" "}
        <a href="https://www.justwatch.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-neutral-300">
          JustWatch
        </a>
      </p>
    </footer>
  );
}
