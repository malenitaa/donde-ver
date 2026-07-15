"use client";

import { useLocalStorage } from "./useLocalStorage";
import type { Provider, Title } from "./types";

const PLATFORMS_KEY = "donde-ver:platforms";
const WATCHLIST_KEY = "donde-ver:watchlist";

/** `null` means the user hasn't gone through onboarding yet. */
export function usePlatforms() {
  const [platforms, setPlatforms, loaded] = useLocalStorage<Provider[] | null>(PLATFORMS_KEY, null);
  return { platforms, setPlatforms, loaded };
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
