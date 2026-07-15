"use client";

import { useState } from "react";
import { GENRE_OPTIONS, RUNTIME_OPTIONS } from "@/lib/i18n";
import { useLocale } from "./LocaleProvider";
import type { MediaType } from "@/lib/types";

export type Filters = {
  type: MediaType | "all";
  genre: string | null;
  maxRuntime: number | null;
  leavingSoon: boolean;
};

type Props = {
  filters: Filters;
  onChange: (filters: Filters) => void;
};

export default function FiltersBar({ filters, onChange }: Props) {
  const { locale, t } = useLocale();
  const [open, setOpen] = useState(false);

  const typeOptions: { label: string; value: Filters["type"] }[] = [
    { label: t.typeAll, value: "all" },
    { label: t.typeMovie, value: "movie" },
    { label: t.typeTv, value: "tv" },
  ];

  const activeCount = [filters.genre, filters.maxRuntime, filters.leavingSoon || null].filter(Boolean).length;

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-neutral-800 px-3 py-2 text-sm text-neutral-200 sm:hidden"
      >
        {t.filters} {activeCount > 0 && `(${activeCount})`}
      </button>

      <div className={`${open ? "flex" : "hidden"} mt-3 flex-col gap-3 sm:mt-0 sm:flex sm:flex-row sm:flex-wrap sm:items-center`}>
        <div className="flex gap-1.5">
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...filters, type: opt.value })}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                filters.type === opt.value
                  ? "bg-emerald-500 text-neutral-950"
                  : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <select
          value={filters.genre ?? ""}
          onChange={(e) => onChange({ ...filters, genre: e.target.value || null })}
          className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200"
        >
          <option value="">{t.anyGenre}</option>
          {GENRE_OPTIONS[locale].map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <select
          value={filters.maxRuntime ?? ""}
          onChange={(e) => onChange({ ...filters, maxRuntime: e.target.value ? Number(e.target.value) : null })}
          className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200"
        >
          <option value="">{t.anyRuntime}</option>
          {RUNTIME_OPTIONS[locale].map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => onChange({ ...filters, leavingSoon: !filters.leavingSoon })}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            filters.leavingSoon
              ? "bg-amber-500 text-neutral-950"
              : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800"
          }`}
        >
          {t.leavingSoonFilter}
        </button>
      </div>
    </div>
  );
}
