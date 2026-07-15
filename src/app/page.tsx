"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import FiltersBar, { type Filters } from "@/components/FiltersBar";
import ResultsGrid from "@/components/ResultsGrid";
import EmptyState from "@/components/EmptyState";
import PlatformsModal from "@/components/PlatformsModal";
import { usePlatforms, useWatchlist } from "@/lib/storage";
import type { Title } from "@/lib/types";

const DEFAULT_FILTERS: Filters = { type: "all", genre: null, maxRuntime: null, leavingSoon: false };

export default function Home() {
  const { platforms, setPlatforms, loaded: platformsLoaded } = usePlatforms();
  const { isInWatchlist, toggle } = useWatchlist();

  const [editingPlatforms, setEditingPlatforms] = useState(false);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [results, setResults] = useState<Title[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  const cache = useRef(new Map<string, Title[]>());

  const providerIds = useMemo(() => (platforms ?? []).map((p) => p.id), [platforms]);
  const justWatchIds = useMemo(
    () => (platforms ?? []).map((p) => p.justWatchId).filter((id): id is string => !!id),
    [platforms]
  );

  useEffect(() => {
    if (!platformsLoaded || !platforms || platforms.length === 0) return;

    const mode = filters.leavingSoon ? "leaving" : query ? "search" : "discover";
    const cacheKey = JSON.stringify({ mode, query, filters, providerIds, justWatchIds });
    const cached = cache.current.get(cacheKey);
    if (cached) {
      setResults(cached);
      setStatus("ready");
      return;
    }

    const controller = new AbortController();
    setStatus("loading");

    const run = async () => {
      try {
        let data: Title[];
        if (mode === "leaving") {
          const res = await fetch(`/api/leaving-soon?providers=${justWatchIds.join(",")}`, {
            signal: controller.signal,
          });
          if (!res.ok) throw new Error("leaving-soon failed");
          data = (await res.json()).results;
          if (query) data = data.filter((t) => t.title.toLowerCase().includes(query.toLowerCase()));
        } else if (mode === "search") {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
          if (!res.ok) throw new Error("search failed");
          data = (await res.json()).results;
        } else {
          const params = new URLSearchParams({ providers: providerIds.join(",") });
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

        cache.current.set(cacheKey, data);
        setResults(data);
        setStatus("ready");
      } catch (err) {
        if ((err as Error).name !== "AbortError") setStatus("error");
      }
    };

    run();
    return () => controller.abort();
  }, [query, filters, platforms, platformsLoaded, providerIds, justWatchIds]);

  if (!platformsLoaded) return null;

  if (!platforms || platforms.length === 0) {
    return (
      <PlatformsModal
        currentSelection={platforms ?? []}
        onSave={(selected) => setPlatforms(selected)}
        dismissible={false}
      />
    );
  }

  const matched = results.filter((t) => t.offers.some((o) => providerIds.includes(o.providerId) || o.providerId === 0));
  const showUnmatched = query && !filters.leavingSoon && matched.length === 0 && results.length > 0;

  return (
    <>
      <Header onEditPlatforms={() => setEditingPlatforms(true)} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <div className="mb-4">
          <SearchBar onQueryChange={setQuery} />
        </div>
        <FiltersBar filters={filters} onChange={setFilters} />

        {status === "loading" && <p className="py-10 text-center text-sm text-neutral-500">Buscando…</p>}

        {status === "error" && (
          <EmptyState
            title="No pudimos conectar con el servicio"
            description="TMDB o JustWatch no respondieron. Probá de nuevo en unos segundos."
          />
        )}

        {status === "ready" && results.length === 0 && (
          <EmptyState
            title={filters.leavingSoon ? "Nada por irse de tus plataformas por ahora" : "Sin resultados"}
            description={query ? `No encontramos "${query}".` : "Probá ajustar los filtros."}
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
            <EmptyState
              title={`"${query}" no está disponible en tus apps`}
              description="Pero lo encontramos en otras plataformas:"
            />
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
          currentSelection={platforms}
          onSave={(selected) => {
            setPlatforms(selected);
            setEditingPlatforms(false);
          }}
          onClose={() => setEditingPlatforms(false)}
        />
      )}
    </>
  );
}
