"use client";

import { useState } from "react";
import CountrySelect from "./CountrySelect";
import { useLocale } from "./LocaleProvider";
import type { Country } from "@/lib/types";

type Props = {
  currentCountry: Country;
  onSave: (country: Country) => void;
  onClose: () => void;
};

export default function CountryModal({ currentCountry, onSave, onClose }: Props) {
  const { t } = useLocale();
  const [country, setCountry] = useState<Country>(currentCountry);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-neutral-950/90 px-4 py-10 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-neutral-900 p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-50">{t.countryLabel}</h2>
            <p className="mt-1 text-sm text-neutral-400">{t.countryHelp}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="rounded-full p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
          >
            ✕
          </button>
        </div>

        <CountrySelect value={country.code} onChange={setCountry} />

        <button
          type="button"
          onClick={() => onSave(country)}
          className="mt-6 w-full rounded-lg bg-emerald-500 py-3 font-medium text-neutral-950"
        >
          {t.save}
        </button>
      </div>
    </div>
  );
}
