import { findJustWatchId } from "./providers";
import type { Genre, MediaType, Provider, Title, TitleOffer } from "./types";

const TMDB_BASE = "https://api.themoviedb.org/3";
const REGION = "AR";
const LANGUAGE = "es-AR";

function apiKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY no está configurada");
  return key;
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(TMDB_BASE + path);
  url.searchParams.set("api_key", apiKey());
  url.searchParams.set("language", LANGUAGE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), { next: { revalidate: 60 * 60 } });
  if (!res.ok) {
    throw new Error(`TMDB respondió ${res.status} para ${path}`);
  }
  return res.json() as Promise<T>;
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

/** Full list of watch providers (movie + tv) available for our curated set, for the onboarding screen. */
export async function getCuratedProviders(): Promise<Provider[]> {
  const [moviesList, tvList] = await Promise.all([
    tmdbFetch<{ results: { provider_id: number; provider_name: string; logo_path: string }[] }>(
      "/watch/providers/movie",
      { watch_region: REGION }
    ),
    tmdbFetch<{ results: { provider_id: number; provider_name: string; logo_path: string }[] }>(
      "/watch/providers/tv",
      { watch_region: REGION }
    ),
  ]);

  const byId = new Map<number, Provider>();
  for (const p of [...moviesList.results, ...tvList.results]) {
    const jwId = findJustWatchId(p.provider_name);
    if (!jwId) continue;
    if (!byId.has(p.provider_id)) {
      byId.set(p.provider_id, {
        id: p.provider_id,
        name: p.provider_name,
        logoPath: p.logo_path ?? null,
        justWatchId: jwId,
      });
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

let genreCache: { movie: Genre[]; tv: Genre[] } | null = null;

async function getGenres(): Promise<{ movie: Genre[]; tv: Genre[] }> {
  if (genreCache) return genreCache;
  const [movie, tv] = await Promise.all([
    tmdbFetch<{ genres: Genre[] }>("/genre/movie/list"),
    tmdbFetch<{ genres: Genre[] }>("/genre/tv/list"),
  ]);
  genreCache = { movie: movie.genres, tv: tv.genres };
  return genreCache;
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

async function enrichWithDetails(mediaType: MediaType, id: number): Promise<Title | null> {
  try {
    const [details, providers] = await Promise.all([
      tmdbFetch<Record<string, unknown>>(`/${mediaType}/${id}`),
      tmdbFetch<TmdbProvidersResponse>(`/${mediaType}/${id}/watch/providers`),
    ]);

    const title = mediaType === "movie" ? (details.title as string) : (details.name as string);
    const dateStr = mediaType === "movie" ? (details.release_date as string) : (details.first_air_date as string);
    const runtime =
      mediaType === "movie"
        ? ((details.runtime as number) ?? null)
        : (details.episode_run_time as number[])?.[0] ?? null;
    const genres = (details.genres as { id: number; name: string }[] | undefined)?.map((g) => g.name) ?? [];

    return {
      id,
      mediaType,
      title: title ?? "",
      year: dateStr ? Number(dateStr.slice(0, 4)) : null,
      posterPath: (details.poster_path as string) ?? null,
      overview: (details.overview as string) ?? "",
      runtime,
      genres,
      offers: offersFromProvidersResponse(providers.results?.[REGION]),
    };
  } catch {
    return null;
  }
}

export async function searchTitles(query: string, limit = 20): Promise<Title[]> {
  const search = await tmdbFetch<{
    results: { id: number; media_type: string }[];
  }>("/search/multi", { query, include_adult: "false" });

  const candidates = search.results
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .slice(0, limit) as { id: number; media_type: MediaType }[];

  const enriched = await Promise.all(candidates.map((c) => enrichWithDetails(c.media_type, c.id)));
  return enriched.filter((t): t is Title => t !== null);
}

export async function discoverTitles(opts: {
  mediaType: MediaType;
  providerIds: number[];
  genreName?: string;
  maxRuntime?: number;
  page?: number;
}): Promise<Title[]> {
  const { movie, tv } = await getGenres();
  const genreList = opts.mediaType === "movie" ? movie : tv;
  const genreId = opts.genreName ? genreList.find((g) => g.name.toLowerCase() === opts.genreName!.toLowerCase())?.id : undefined;

  const baseParams: Record<string, string> = {
    watch_region: REGION,
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
    pagesToFetch.map((page) => tmdbFetch<{ results: { id: number }[] }>(path, { ...baseParams, page: String(page) }))
  );
  const candidateIds = pages.flatMap((p) => p.results).map((r) => r.id);

  const enriched = await Promise.all(candidateIds.map((id) => enrichWithDetails(opts.mediaType, id)));
  let results = enriched.filter((t): t is Title => t !== null);
  if (opts.maxRuntime) {
    results = results.filter((t) => t.runtime !== null && t.runtime <= opts.maxRuntime!);
  }
  return results.slice(0, 20);
}

export async function getTitleDetails(mediaType: MediaType, id: number): Promise<Title | null> {
  return enrichWithDetails(mediaType, id);
}
