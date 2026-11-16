"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import FiltersBar, { type Filters } from "@/components/FiltersBar";
import ResultsGrid from "@/components/ResultsGrid";
import EmptyState from "@/components/EmptyState";
import PlatformsModal from "@/components/PlatformsModal";
import OnboardingModal from "@/components/OnboardingModal";
import CountryModal from "@/components/CountryModal";
import { useLocale } from "@/components/LocaleProvider";
import { useCountry, usePlatforms, useWatchlist } from "@/lib/storage";
import type { Title } from "@/lib/types";

const DEFAULT_FILTERS: Filters = { type: "all", genre: null, maxRuntime: null, leavingSoon: false };

export default function Home() {
  const { locale, t } = useLocale();
  const { platforms, setPlatforms, loaded: platformsLoaded } = usePlatforms();
  const { country, setCountry, loaded: countryLoaded } = useCountry();
  const { isInWatchlist, toggle } = useWatchlist();

  const [editingPlatforms, setEditingPlatforms] = useState(false);
  const [editingCountry, setEditingCountry] = useState(false);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [results, setResults] = useState<Title[]>([]);
  // JustWatch ids of the user's platforms that JustWatch has no expiry dates for.
  const [withoutDates, setWithoutDates] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [retryKey, setRetryKey] = useState(0);

  const cache = useRef(new Map<string, { titles: Title[]; withoutDates: string[] }>());

  const providerIds = useMemo(() => (platforms ?? []).map((p) => p.id), [platforms]);
  const justWatchIds = useMemo(
    () => (platforms ?? []).map((p) => p.justWatchId).filter((id): id is string => !!id),
    [platforms]
  );
  const countryCode = country?.code;

  useEffect(() => {
    if (!platformsLoaded || !countryLoaded || !platforms || platforms.length === 0 || !countryCode) return;

    const mode = filters.leavingSoon ? "leaving" : query ? "search" : "discover";
    const cacheKey = JSON.stringify({ mode, query, filters, providerIds, justWatchIds, countryCode, locale });
    // A failed request is never written to `cache` below (only the success
    // path does), so bumping `retryKey` to force this effect to re-run always
    // reaches the fetch again instead of replaying a stale cached result.
    const cached = cache.current.get(cacheKey);
    if (cached) {
      setResults(cached.titles);
      setWithoutDates(cached.withoutDates);
      setStatus("ready");
      return;
    }

    const controller = new AbortController();
    setStatus("loading");

    const run = async () => {
      try {
        let data: Title[];
        let noDates: string[] = [];
        if (mode === "leaving") {
          const res = await fetch(
            `/api/leaving-soon?providers=${justWatchIds.join(",")}&country=${countryCode}&locale=${locale}`,
            { signal: controller.signal }
          );
          if (!res.ok) throw new Error("leaving-soon failed");
          const body = await res.json();
          data = body.results;
          noDates = body.providersWithoutDates ?? [];
          if (query) data = data.filter((t) => t.title.toLowerCase().includes(query.toLowerCase()));
        } else if (mode === "search") {
          const res = await fetch(
            `/api/search?q=${encodeURIComponent(query)}&country=${countryCode}&locale=${locale}`,
            { signal: controller.signal }
          );
          if (!res.ok) throw new Error("search failed");
          data = (await res.json()).results;
        } else {
          const params = new URLSearchParams({ providers: providerIds.join(","), country: countryCode, locale });
          if (filters.type !== "all") params.set("type", filters.type);
          if (filters.genre) params.set("genre", filters.genre);
          if (filters.maxRuntime) params.set("maxRuntime", String(filters.maxRuntime));
          const res = await fetch(`/api/discover?${params.toString()}`, { signal: controller.signal });
          if (!res.ok) throw new Error("discover failed");
          data = (await res.json()).results;
        }

        if (mode !== "discover") {
          if (filters.type !== "all") data = data.filter((t) => t.mediaType === filters.type);
          if (filters.genre) {
            const g = filters.genre.toLowerCase();
            data = data.filter((t) => t.genres.some((genre) => genre.toLowerCase().includes(g)));
          }
          if (filters.maxRuntime) {
            data = data.filter((t) => t.runtime !== null && t.runtime <= filters.maxRuntime!);
          }
        }

        cache.current.set(cacheKey, { titles: data, withoutDates: noDates });
        setResults(data);
        setWithoutDates(noDates);
        setStatus("ready");
      } catch (err) {
        if ((err as Error).name !== "AbortError") setStatus("error");
      }
    };

    run();
    return () => controller.abort();
  }, [query, filters, platforms, platformsLoaded, countryLoaded, countryCode, providerIds, justWatchIds, locale, retryKey]);

  if (!platformsLoaded || !countryLoaded) return null;

  if (!platforms || platforms.length === 0 || !country) {
    return (
      <OnboardingModal
        onSave={(selectedCountry, selectedPlatforms) => {
          setCountry(selectedCountry);
          setPlatforms(selectedPlatforms);
        }}
      />
    );
  }

  const matched = results.filter((t) => t.offers.some((o) => providerIds.includes(o.providerId) || o.providerId === 0));
  const showUnmatched = query && !filters.leavingSoon && matched.length === 0 && results.length > 0;
  const platformsWithoutDates = filters.leavingSoon
    ? platforms.filter((p) => p.justWatchId && withoutDates.includes(p.justWatchId)).map((p) => p.name)
    : [];
  const noPlatformHasDates = platformsWithoutDates.length > 0 && platformsWithoutDates.length === justWatchIds.length;

  return (
    <>
      <Header onEditPlatforms={() => setEditingPlatforms(true)} onEditCountry={() => setEditingCountry(true)} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <div className="mb-4">
          <SearchBar onQueryChange={setQuery} />
        </div>
        <FiltersBar filters={filters} onChange={setFilters} />

        {status === "loading" && <p className="py-10 text-center text-sm text-neutral-500">{t.loading}</p>}

        {status === "error" && (
          <EmptyState
            title={t.errorTitle}
            description={t.errorDescription}
            action={
              <button
                type="button"
                onClick={() => setRetryKey((k) => k + 1)}
                className="mt-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-neutral-950"
              >
                {t.retry}
              </button>
            }
          />
        )}

        {status === "ready" && platformsWithoutDates.length > 0 && !(results.length === 0 && noPlatformHasDates) && (
          <p role="status" className="mb-4 rounded-lg border border-neutral-800 px-4 py-3 text-sm text-neutral-400">
            {t.leavingNoDates(platformsWithoutDates.join(", "))}
          </p>
        )}

        {status === "ready" && results.length === 0 && (
          <EmptyState
            title={
              filters.leavingSoon ? (noPlatformHasDates ? t.leavingNoDatesTitle : t.noResultsLeaving) : t.noResultsGeneric
            }
            description={
              noPlatformHasDates
                ? t.leavingNoDates(platformsWithoutDates.join(", "))
                : query
                  ? t.noResultsQuery(query)
                  : t.tryAdjustFilters
            }
          />
        )}

        {status === "ready" && results.length > 0 && !showUnmatched && (
          <ResultsGrid
            titles={matched.length > 0 ? matched : results}
            userProviders={platforms}
            isInWatchlist={isInWatchlist}
            onToggleWatchlist={toggle}
          />
        )}

        {status === "ready" && showUnmatched && (
          <>
            <EmptyState title={t.notInYourApps(query)} description={t.availableElsewhere} />
            <div className="mt-4">
              <ResultsGrid
                titles={results}
                userProviders={platforms}
                isInWatchlist={isInWatchlist}
                onToggleWatchlist={toggle}
              />
            </div>
          </>
        )}
      </main>

      {editingPlatforms && (
        <PlatformsModal
          country={country.code}
          currentSelection={platforms}
          onSave={(selected) => {
            setPlatforms(selected);
            setEditingPlatforms(false);
          }}
          onClose={() => setEditingPlatforms(false)}
        />
      )}

      {editingCountry && (
        <CountryModal
          currentCountry={country}
          onSave={(selected) => {
            setCountry(selected);
            setEditingCountry(false);
          }}
          onClose={() => setEditingCountry(false)}
        />
      )}
    </>
  );
}
