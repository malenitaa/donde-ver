"use client";

import { useLocalStorage } from "./useLocalStorage";
import type { Country, Provider, Title } from "./types";

const PLATFORMS_KEY = "donde-ver:platforms";
const COUNTRY_KEY = "donde-ver:country";
const WATCHLIST_KEY = "donde-ver:watchlist";

/** `null` means the user hasn't gone through onboarding yet. */
export function usePlatforms() {
  const [platforms, setPlatforms, loaded] = useLocalStorage<Provider[] | null>(PLATFORMS_KEY, null);
  return { platforms, setPlatforms, loaded };
}

/**
 * The country whose catalog we query — deliberately never inferred from IP/geolocation.
 * It represents where the user's streaming accounts are registered, not their physical
 * location, so it's always an explicit choice made during onboarding. `null` means the
 * user hasn't picked one yet.
 */
export function useCountry() {
  const [country, setCountry, loaded] = useLocalStorage<Country | null>(COUNTRY_KEY, null);
  return { country, setCountry, loaded };
}

export function useWatchlist() {
  const [watchlist, setWatchlist, loaded] = useLocalStorage<Title[]>(WATCHLIST_KEY, []);

  const isInWatchlist = (id: number, mediaType: Title["mediaType"]) =>
    watchlist.some((t) => t.id === id && t.mediaType === mediaType);

  const add = (title: Title) => {
    setWatchlist((prev) => (isInWatchlist(title.id, title.mediaType) ? prev : [...prev, title]));
  };

  const remove = (id: number, mediaType: Title["mediaType"]) => {
    setWatchlist((prev) => prev.filter((t) => !(t.id === id && t.mediaType === mediaType)));
  };

  const toggle = (title: Title) => {
    if (isInWatchlist(title.id, title.mediaType)) remove(title.id, title.mediaType);
    else add(title);
  };

  return { watchlist, loaded, isInWatchlist, add, remove, toggle };
}
