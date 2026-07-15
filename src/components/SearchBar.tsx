"use client";

import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";

type Props = {
  onQueryChange: (query: string) => void;
  debounceMs?: number;
};

export default function SearchBar({ onQueryChange, debounceMs = 400 }: Props) {
  const { t } = useLocale();
  const [value, setValue] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => onQueryChange(value.trim()), debounceMs);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={t.searchPlaceholder}
      className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-neutral-50 placeholder:text-neutral-500 focus:border-emerald-400 focus:outline-none"
    />
  );
}
