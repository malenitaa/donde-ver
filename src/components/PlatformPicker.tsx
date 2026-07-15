"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Provider } from "@/lib/types";
import { logoUrl } from "@/lib/images";
import { useLocale } from "./LocaleProvider";

type Props = {
  country: string;
  initialSelected: Provider[];
  onSave: (selected: Provider[]) => void;
  saveLabel?: string;
};

export default function PlatformPicker({ country, initialSelected, onSave, saveLabel }: Props) {
  const { locale, t } = useLocale();
  const [available, setAvailable] = useState<Provider[] | null>(null);
  const [error, setError] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(initialSelected.map((p) => p.id))
  );

  useEffect(() => {
    // Reset while refetching so a country switch doesn't briefly show the
    // previous country's provider list as if it were still valid.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAvailable(null);
    fetch(`/api/providers?country=${country}&locale=${locale}`)
      .then((res) => {
        if (!res.ok) throw new Error("bad response");
        return res.json();
      })
      .then((data) => setAvailable(data.providers))
      .catch(() => setError(true));
  }, [country, locale]);

  const toggle = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (error) {
    return <p className="text-sm text-red-400">{t.providersError}</p>;
  }

  if (!available) {
    return <p className="text-sm text-neutral-400">{t.loadingProviders}</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {available.map((provider) => {
          const selected = selectedIds.has(provider.id);
          const logo = logoUrl(provider.logoPath);
          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => toggle(provider.id)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition ${
                selected ? "border-emerald-400 bg-emerald-400/10" : "border-neutral-800 bg-neutral-900"
              }`}
            >
              <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-white/90">
                {logo && <Image src={logo} alt={provider.name} fill sizes="48px" className="object-cover" />}
              </div>
              <span className="text-center text-xs text-neutral-200">{provider.name}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onSave(available.filter((p) => selectedIds.has(p.id)))}
        disabled={selectedIds.size === 0}
        className="mt-6 w-full rounded-lg bg-emerald-500 py-3 font-medium text-neutral-950 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saveLabel ?? t.save}
      </button>
      {selectedIds.size === 0 && <p className="mt-2 text-center text-xs text-neutral-500">{t.pickAtLeastOne}</p>}
    </div>
  );
}
