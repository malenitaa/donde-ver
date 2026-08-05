import "server-only";
import { JUSTWATCH_LANGUAGE, type Locale } from "./i18n";
import type { MediaType, Title } from "./types";

/**
 * Unofficial JustWatch GraphQL endpoint (used by justwatch.com itself). There is no
 * public/official JustWatch API for projects like this one — see README for details
 * and the risk this carries (undocumented, can change or break without notice).
 */
const JUSTWATCH_API = "https://apis.justwatch.com/graphql";
const IMAGES_BASE = "https://images.justwatch.com";
const LEAVING_SOON_WINDOW_DAYS = 30;
// Per-request timeout: this is an unwatched, unofficial endpoint that can hang
// without ever responding, so we can't rely on it to fail on its own.
const REQUEST_TIMEOUT_MS = 8000;
// Max items JustWatch will return per page for this query before erroring with
// "page too large" — found by trial, not documented anywhere.
const PAGE_SIZE = 100;
// How many pages deep to scan per provider. JustWatch's own "popular" ranking
// for a provider can run into the thousands, and titles further down the ranking
// (older, less-watched — exactly the kind of thing that quietly leaves a catalog)
// only show up past the first page. Going deeper improves recall but costs one
// extra request per page per provider, so this is a deliberate trade-off, not
// exhaustive — see README for what this does and doesn't catch.
const PAGES_PER_PROVIDER = 5;

const POPULAR_QUERY = `
query GetPopularTitles(
  $popularTitlesFilter: TitleFilter
  $country: Country!
  $language: Language!
  $first: Int!
  $offset: Int
  $filter: OfferFilter!
) {
  popularTitles(country: $country, filter: $popularTitlesFilter, first: $first, sortBy: POPULAR, offset: $offset) {
    edges {
      node {
        id
        objectType
        content(country: $country, language: $language) {
          title
          originalReleaseYear
          runtime
          genres { shortName }
          posterUrl(profile: S718, format: JPG)
          externalIds { tmdbId }
        }
        offers(country: $country, platform: WEB, filter: $filter) {
          monetizationType
          availableTo
          package { shortName clearName }
        }
      }
    }
  }
}`;

type JwOffer = {
  monetizationType: string;
  availableTo: string | null;
  package: { shortName: string; clearName: string };
};

type JwNode = {
  id: string;
  objectType: string;
  content: {
    title: string;
    originalReleaseYear: number | null;
    runtime: number | null;
    genres: { shortName: string }[];
    posterUrl: string | null;
    externalIds: { tmdbId: string | null } | null;
  };
  offers: JwOffer[];
};

async function postGraphQL<T>(
  operationName: string,
  query: string,
  variables: Record<string, unknown>,
  signal?: AbortSignal
): Promise<T> {
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const res = await fetch(JUSTWATCH_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operationName, query, variables }),
    next: { revalidate: 60 * 60 },
    signal: signal ? AbortSignal.any([timeoutSignal, signal]) : timeoutSignal,
  });
  if (!res.ok) throw new Error(`JustWatch respondió ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error("JustWatch devolvió un error: " + JSON.stringify(json.errors));
  return json.data as T;
}

async function fetchPopularPage(
  providerId: string,
  country: string,
  locale: Locale,
  offset: number,
  signal?: AbortSignal
): Promise<JwNode[]> {
  const data = await postGraphQL<{ popularTitles: { edges: { node: JwNode }[] } }>(
    "GetPopularTitles",
    POPULAR_QUERY,
    {
      // One provider per request: mixing providers into a single `packages` filter
      // ranks everything on one shared popularity list, so a provider with a smaller
      // or less mainstream catalog gets crowded out by a bigger one (e.g. Netflix)
      // before its own titles ever show up. Querying per provider gives each one a
      // fair shot at appearing regardless of how the others compare.
      popularTitlesFilter: {
        packages: [providerId],
        objectTypes: ["MOVIE", "SHOW"],
        includeTitlesWithoutUrl: true,
      },
      country,
      language: JUSTWATCH_LANGUAGE[locale],
      first: PAGE_SIZE,
      offset,
      filter: { bestOnly: true },
    },
    signal
  );
  return data.popularTitles.edges.map((e) => e.node);
}

/**
 * Titles leaving one of the given JustWatch provider packages soon (within
 * LEAVING_SOON_WINDOW_DAYS). This is the one feature TMDB's watch/providers
 * endpoint doesn't expose, so it goes straight to JustWatch's own (unofficial) API.
 *
 * Coverage is best-effort: it scans each provider's own popularity ranking a few
 * pages deep (see PAGES_PER_PROVIDER), not the entire catalog. A title ranked
 * far enough down — an old, obscure title is exactly the kind of thing that
 * quietly leaves a catalog — can still be missed. There's no dedicated "leaving
 * soon" endpoint on this unofficial API to fall back on.
 */
export async function getLeavingSoon(
  justWatchProviderIds: string[],
  country: string,
  locale: Locale,
  signal?: AbortSignal
): Promise<Title[]> {
  if (justWatchProviderIds.length === 0) return [];

  const pageRequests = justWatchProviderIds.flatMap((providerId) =>
    Array.from({ length: PAGES_PER_PROVIDER }, (_, i) =>
      fetchPopularPage(providerId, country, locale, i * PAGE_SIZE, signal)
    )
  );
  // allSettled instead of all: with up to PAGES_PER_PROVIDER * providers.length
  // requests in flight, a single page failing (timeout, rate limit, transient
  // error) shouldn't discard every other page that succeeded.
  const settled = await Promise.allSettled(pageRequests);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const pages = settled
    .filter((r): r is PromiseFulfilledResult<JwNode[]> => r.status === "fulfilled")
    .map((r) => r.value);
  if (pages.length === 0 && pageRequests.length > 0) {
    throw new Error("JustWatch no respondió ninguna de las páginas pedidas");
  }

  const seen = new Set<string>();
  const nodes: JwNode[] = [];
  for (const node of pages.flat()) {
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    nodes.push(node);
  }

  const now = Date.now();
  const cutoff = now + LEAVING_SOON_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  const titles: Title[] = [];
  for (const node of nodes) {
    const leavingOffer = node.offers.find((o) => {
      if (o.monetizationType !== "FLATRATE" || !o.availableTo) return false;
      if (!justWatchProviderIds.includes(o.package.shortName)) return false;
      const availableToMs = new Date(o.availableTo).getTime();
      return availableToMs > now && availableToMs <= cutoff;
    });
    if (!leavingOffer) continue;

    const tmdbId = node.content.externalIds?.tmdbId ? Number(node.content.externalIds.tmdbId) : node.id;
    titles.push({
      id: typeof tmdbId === "number" && !Number.isNaN(tmdbId) ? tmdbId : 0,
      mediaType: (node.objectType === "SHOW" ? "tv" : "movie") as MediaType,
      title: node.content.title,
      year: node.content.originalReleaseYear,
      // JustWatch returns a relative path on a different CDN than TMDB, so we
      // resolve it to a full URL here; the UI treats posterPath starting with
      // "http" as already-absolute.
      posterPath: node.content.posterUrl ? IMAGES_BASE + node.content.posterUrl : null,
      overview: "",
      runtime: node.content.runtime,
      genres: node.content.genres.map((g) => g.shortName),
      offers: [
        {
          providerId: 0,
          providerName: leavingOffer.package.clearName,
          logoPath: null,
          type: "flatrate",
        },
      ],
      leavingAt: leavingOffer.availableTo,
    });
  }

  titles.sort((a, b) => new Date(a.leavingAt!).getTime() - new Date(b.leavingAt!).getTime());
  return titles;
}
