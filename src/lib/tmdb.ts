import "server-only";
import { TMDB_LANGUAGE, type Locale } from "./i18n";
import { findJustWatchId } from "./providers";
import type { Country, Genre, MediaType, Provider, Title, TitleOffer } from "./types";

const TMDB_BASE = "https://api.themoviedb.org/3";
const REQUEST_TIMEOUT_MS = 8000;

function apiKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY no está configurada");
  return key;
}

async function tmdbFetch<T>(path: string, language: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(TMDB_BASE + path);
  url.searchParams.set("api_key", apiKey());
  url.searchParams.set("language", language);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), { next: { revalidate: 60 * 60 }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!res.ok) {
    throw new Error(`TMDB respondió ${res.status} para ${path}`);
  }
  return res.json() as Promise<T>;
}

/** All countries TMDB has watch-provider coverage for, used for the country picker. */
export async function getRegions(locale: Locale): Promise<Country[]> {
  const data = await tmdbFetch<{ results: { iso_3166_1: string; english_name: string; native_name: string }[] }>(
    "/watch/providers/regions",
    TMDB_LANGUAGE[locale]
  );
  return data.results
    .map((r) => ({ code: r.iso_3166_1, name: r.native_name || r.english_name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

type TmdbProvidersResponse = {
  results: Record<
    string,
    {
      link: string;
      flatrate?: { provider_id: number; provider_name: string; logo_path: string }[];
      rent?: { provider_id: number; provider_name: string; logo_path: string }[];
      buy?: { provider_id: number; provider_name: string; logo_path: string }[];
      free?: { provider_id: number; provider_name: string; logo_path: string }[];
      ads?: { provider_id: number; provider_name: string; logo_path: string }[];
    }
  >;
};

/** Full list of curated watch providers (movie + tv) for the given catalog country, for onboarding. */
export async function getCuratedProviders(region: string, locale: Locale): Promise<Provider[]> {
  const language = TMDB_LANGUAGE[locale];
  const [moviesList, tvList] = await Promise.all([
    tmdbFetch<{ results: { provider_id: number; provider_name: string; logo_path: string }[] }>(
      "/watch/providers/movie",
      language,
      { watch_region: region }
    ),
    tmdbFetch<{ results: { provider_id: number; provider_name: string; logo_path: string }[] }>(
      "/watch/providers/tv",
      language,
      { watch_region: region }
    ),
  ]);

  const byId = new Map<number, Provider>();
  const unmatched = new Set<string>();
  for (const p of [...moviesList.results, ...tvList.results]) {
    const jwId = findJustWatchId(p.provider_name);
    if (!jwId) {
      unmatched.add(p.provider_name);
      continue;
    }
    if (!byId.has(p.provider_id)) {
      byId.set(p.provider_id, {
        id: p.provider_id,
        name: p.provider_name,
        logoPath: p.logo_path ?? null,
        justWatchId: jwId,
      });
    }
  }
  if (unmatched.size > 0) {
    // TMDB's provider_name for this region didn't match any entry in
    // CURATED_PROVIDERS (see providers.ts) — surfaces here instead of
    // silently dropping the platform, so a naming change on TMDB's end
    // shows up in logs instead of as a user report of a missing platform.
    console.warn(`[tmdb] Nombres de plataforma sin mapear en ${region}:`, [...unmatched]);
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// Genre names are locale-specific text, so the cache is keyed by locale.
const genreCache: Partial<Record<Locale, { movie: Genre[]; tv: Genre[] }>> = {};

async function getGenres(locale: Locale): Promise<{ movie: Genre[]; tv: Genre[] }> {
  const cached = genreCache[locale];
  if (cached) return cached;
  const language = TMDB_LANGUAGE[locale];
  const [movie, tv] = await Promise.all([
    tmdbFetch<{ genres: Genre[] }>("/genre/movie/list", language),
    tmdbFetch<{ genres: Genre[] }>("/genre/tv/list", language),
  ]);
  const result = { movie: movie.genres, tv: tv.genres };
  genreCache[locale] = result;
  return result;
}

type RegionResult = TmdbProvidersResponse["results"][string];
type OfferBucketKey = "flatrate" | "free" | "ads" | "rent" | "buy";

function offersFromProvidersResponse(regionResult: RegionResult | undefined): TitleOffer[] {
  if (!regionResult) return [];
  const offers: TitleOffer[] = [];
  const buckets: [OfferBucketKey, TitleOffer["type"]][] = [
    ["flatrate", "flatrate"],
    ["free", "free"],
    ["ads", "ads"],
    ["rent", "rent"],
    ["buy", "buy"],
  ];
  for (const [key, type] of buckets) {
    for (const p of regionResult[key] ?? []) {
      offers.push({ providerId: p.provider_id, providerName: p.provider_name, logoPath: p.logo_path, type });
    }
  }
  return offers;
}

type TmdbDetails = Record<string, unknown>;

function runtimeFromDetails(mediaType: MediaType, details: TmdbDetails): number | null {
  return mediaType === "movie"
    ? ((details.runtime as number) ?? null)
    : (details.episode_run_time as number[])?.[0] ?? null;
}

function titleFromDetails(mediaType: MediaType, id: number, region: string, details: TmdbDetails, providers: TmdbProvidersResponse): Title {
  const title = mediaType === "movie" ? (details.title as string) : (details.name as string);
  const dateStr = mediaType === "movie" ? (details.release_date as string) : (details.first_air_date as string);
  const genres = (details.genres as { id: number; name: string }[] | undefined)?.map((g) => g.name) ?? [];

  return {
    id,
    mediaType,
    title: title ?? "",
    year: dateStr ? Number(dateStr.slice(0, 4)) : null,
    posterPath: (details.poster_path as string) ?? null,
    overview: (details.overview as string) ?? "",
    runtime: runtimeFromDetails(mediaType, details),
    genres,
    offers: offersFromProvidersResponse(providers.results?.[region]),
  };
}

async function fetchDetails(mediaType: MediaType, id: number, locale: Locale): Promise<{ id: number; details: TmdbDetails } | null> {
  try {
    const details = await tmdbFetch<TmdbDetails>(`/${mediaType}/${id}`, TMDB_LANGUAGE[locale]);
    return { id, details };
  } catch {
    return null;
  }
}

async function fetchProviders(mediaType: MediaType, id: number, locale: Locale): Promise<TmdbProvidersResponse | null> {
  try {
    return await tmdbFetch<TmdbProvidersResponse>(`/${mediaType}/${id}/watch/providers`, TMDB_LANGUAGE[locale]);
  } catch {
    return null;
  }
}

async function enrichWithDetails(mediaType: MediaType, id: number, region: string, locale: Locale): Promise<Title | null> {
  const [detailsResult, providers] = await Promise.all([
    fetchDetails(mediaType, id, locale),
    fetchProviders(mediaType, id, locale),
  ]);
  if (!detailsResult || !providers) return null;
  return titleFromDetails(mediaType, id, region, detailsResult.details, providers);
}

export async function searchTitles(query: string, region: string, locale: Locale, limit = 20): Promise<Title[]> {
  const search = await tmdbFetch<{
    results: { id: number; media_type: string }[];
  }>("/search/multi", TMDB_LANGUAGE[locale], { query, include_adult: "false" });

  const candidates = search.results
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .slice(0, limit) as { id: number; media_type: MediaType }[];

  const enriched = await Promise.all(candidates.map((c) => enrichWithDetails(c.media_type, c.id, region, locale)));
  return enriched.filter((t): t is Title => t !== null);
}

export async function discoverTitles(opts: {
  mediaType: MediaType;
  region: string;
  locale: Locale;
  providerIds: number[];
  genreName?: string;
  maxRuntime?: number;
  page?: number;
}): Promise<Title[]> {
  const { movie, tv } = await getGenres(opts.locale);
  const genreList = opts.mediaType === "movie" ? movie : tv;
  const genreId = opts.genreName ? genreList.find((g) => g.name.toLowerCase() === opts.genreName!.toLowerCase())?.id : undefined;

  const baseParams: Record<string, string> = {
    watch_region: opts.region,
    with_watch_providers: opts.providerIds.join("|"),
    sort_by: "popularity.desc",
  };
  if (genreId) baseParams.with_genres = String(genreId);
  // Note: TMDB's `with_runtime.lte`/`gte` discover filters are unreliable (they
  // don't actually exclude longer titles), so we fetch a couple of pages and
  // filter by the real runtime after fetching each title's details below.
  const path = opts.mediaType === "movie" ? "/discover/movie" : "/discover/tv";
  const startPage = opts.page ?? 1;
  const pagesToFetch = opts.maxRuntime ? [startPage, startPage + 1] : [startPage];

  const pages = await Promise.all(
    pagesToFetch.map((page) =>
      tmdbFetch<{ results: { id: number }[] }>(path, TMDB_LANGUAGE[opts.locale], { ...baseParams, page: String(page) })
    )
  );
  const candidateIds = pages.flatMap((p) => p.results).map((r) => r.id);

  if (!opts.maxRuntime) {
    const enriched = await Promise.all(candidateIds.map((id) => enrichWithDetails(opts.mediaType, id, opts.region, opts.locale)));
    return enriched.filter((t): t is Title => t !== null).slice(0, 20);
  }

  // With a runtime filter on, over-fetching pages already means most
  // candidates get thrown away — fetching `watch/providers` (a 2nd TMDB
  // request) for every one of them regardless is wasted work. `details`
  // alone already has the real runtime, so filter on that first and only
  // fetch `watch/providers` for the candidates that actually survive.
  const maxRuntime = opts.maxRuntime;
  const detailsResults = await Promise.all(candidateIds.map((id) => fetchDetails(opts.mediaType, id, opts.locale)));
  const survivors = detailsResults.filter((r): r is { id: number; details: TmdbDetails } => {
    if (!r) return false;
    const runtime = runtimeFromDetails(opts.mediaType, r.details);
    return runtime !== null && runtime <= maxRuntime;
  });

  const withProviders = await Promise.all(
    survivors.map(async (s) => {
      const providers = await fetchProviders(opts.mediaType, s.id, opts.locale);
      return providers ? titleFromDetails(opts.mediaType, s.id, opts.region, s.details, providers) : null;
    })
  );
  return withProviders.filter((t): t is Title => t !== null).slice(0, 20);
}

export async function getTitleDetails(mediaType: MediaType, id: number, region: string, locale: Locale): Promise<Title | null> {
  return enrichWithDetails(mediaType, id, region, locale);
}
