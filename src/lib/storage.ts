"use client";

import { useLocalStorage } from "./useLocalStorage";
import type { Country, Provider, Title } from "./types";

const PLATFORMS_KEY = "donde-ver:platforms";
const COUNTRY_KEY = "donde-ver:country";
const WATCHLIST_KEY = "donde-ver:watchlist";

// Type guards for data read back from localStorage: it may have been written
// by an older version of the app with a different shape, so it's untrusted
// until checked, not just cast.
function isValidCountry(v: unknown): v is Country {
  return !!v && typeof v === "object" && typeof (v as Country).code === "string" && typeof (v as Country).name === "string";
}

function isValidProvider(v: unknown): v is Provider {
  if (!v || typeof v !== "object") return false;
  const p = v as Provider;
  return (
    typeof p.id === "number" &&
    typeof p.name === "string" &&
    (p.logoPath === null || typeof p.logoPath === "string") &&
    (p.justWatchId === null || typeof p.justWatchId === "string")
  );
}

function isValidTitle(v: unknown): v is Title {
  if (!v || typeof v !== "object") return false;
  const t = v as Title;
  return typeof t.id === "number" && (t.mediaType === "movie" || t.mediaType === "tv") && typeof t.title === "string" && Array.isArray(t.offers);
}

const sameTitle = (t: Title, id: number, mediaType: Title["mediaType"]) => t.id === id && t.mediaType === mediaType;

/** `null` means the user hasn't gone through onboarding yet (or what was stored didn't look like a platform list anymore). */
export function usePlatforms() {
  const [raw, setPlatforms, loaded] = useLocalStorage<Provider[] | null>(PLATFORMS_KEY, null);
  const platforms = raw && Array.isArray(raw) ? raw.filter(isValidProvider) : null;
  return { platforms, setPlatforms, loaded };
}

/**
 * The country whose catalog we query — deliberately never inferred from IP/geolocation.
 * It represents where the user's streaming accounts are registered, not their physical
 * location, so it's always an explicit choice made during onboarding. `null` means the
 * user hasn't picked one yet (or what was stored didn't look like a country anymore).
 */
export function useCountry() {
  const [raw, setCountry, loaded] = useLocalStorage<Country | null>(COUNTRY_KEY, null);
  const country = raw && isValidCountry(raw) ? raw : null;
  return { country, setCountry, loaded };
}

export function useWatchlist() {
  const [raw, setWatchlist, loaded] = useLocalStorage<Title[]>(WATCHLIST_KEY, []);
  const watchlist = Array.isArray(raw) ? raw.filter(isValidTitle) : [];

  const isInWatchlist = (id: number, mediaType: Title["mediaType"]) => watchlist.some((t) => sameTitle(t, id, mediaType));

  // add/remove/toggle all decide membership from `prev` inside the functional
  // updater (not from the `watchlist` closure above) so that two updates
  // queued back-to-back — e.g. a double-click before React re-renders — are
  // each computed against the other's result instead of both reading the same
  // stale snapshot and adding a duplicate. Filtering `prev` through
  // isValidTitle here also self-heals a corrupted/old-shape entry the next
  // time the watchlist is touched.
  const add = (title: Title) => {
    setWatchlist((prev) => {
      const clean = prev.filter(isValidTitle);
      return clean.some((t) => sameTitle(t, title.id, title.mediaType)) ? clean : [...clean, title];
    });
  };

  const remove = (id: number, mediaType: Title["mediaType"]) => {
    setWatchlist((prev) => prev.filter(isValidTitle).filter((t) => !sameTitle(t, id, mediaType)));
  };

  const toggle = (title: Title) => {
    setWatchlist((prev) => {
      const clean = prev.filter(isValidTitle);
      return clean.some((t) => sameTitle(t, title.id, title.mediaType))
        ? clean.filter((t) => !sameTitle(t, title.id, title.mediaType))
        : [...clean, title];
    });
  };

  return { watchlist, loaded, isInWatchlist, add, remove, toggle };
}
