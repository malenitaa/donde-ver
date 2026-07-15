"use client";

import { useEffect, useState } from "react";
import type { Country } from "@/lib/types";

type Props = {
  value: string;
  onChange: (country: Country) => void;
};

/**
 * Country picker for the streaming catalog. Deliberately just a plain dropdown
 * fed by TMDB's list of supported regions — never inferred from IP/geolocation,
 * since the relevant country is wherever the user's streaming accounts are
 * registered, not their physical location.
 */
export default function CountrySelect({ value, onChange }: Props) {
  const [countries, setCountries] = useState<Country[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/regions")
      .then((res) => {
        if (!res.ok) throw new Error("bad response");
        return res.json();
      })
      .then((data) => setCountries(data.regions))
      .catch(() => setError(true));
  }, []);

  if (error) {
    return <p className="text-sm text-red-400">No pudimos cargar la lista de países.</p>;
  }

  return (
    <select
      value={value}
      disabled={!countries}
      onChange={(e) => {
        const country = countries?.find((c) => c.code === e.target.value);
        if (country) onChange(country);
      }}
      className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 disabled:opacity-50"
    >
      {countries ? (
        countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))
      ) : (
        <option>Cargando países…</option>
      )}
    </select>
  );
}
