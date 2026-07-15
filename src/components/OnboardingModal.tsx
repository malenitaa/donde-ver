"use client";

import { useState } from "react";
import CountrySelect from "./CountrySelect";
import PlatformPicker from "./PlatformPicker";
import { useLocale } from "./LocaleProvider";
import type { Country, Provider } from "@/lib/types";

type Props = {
  onSave: (country: Country, platforms: Provider[]) => void;
};

const DEFAULT_COUNTRY: Country = { code: "AR", name: "Argentina" };

/**
 * First-run screen: country and platforms are chosen together, in the same step,
 * with no silent default — the user has to hit "Guardar" to confirm both, even
 * though the country field starts on Argentina.
 */
export default function OnboardingModal({ onSave }: Props) {
  const { t } = useLocale();
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-neutral-950/90 px-4 py-10 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-neutral-900 p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-neutral-50">{t.onboardingTitle}</h2>
        <p className="mt-1 text-sm text-neutral-400">{t.onboardingDescription}</p>

        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-medium text-neutral-200">{t.countryLabel}</label>
          <CountrySelect value={country.code} onChange={setCountry} />
          <p className="mt-1.5 text-xs text-neutral-500">{t.countryHelp}</p>
        </div>

        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-medium text-neutral-200">{t.platformsLabel}</label>
          <PlatformPicker
            country={country.code}
            initialSelected={[]}
            onSave={(platforms) => onSave(country, platforms)}
          />
        </div>
      </div>
    </div>
  );
}
