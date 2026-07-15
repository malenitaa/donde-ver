import type { MediaType, Title } from "./types";

/**
 * Unofficial JustWatch GraphQL endpoint (used by justwatch.com itself). There is no
 * public/official JustWatch API for projects like this one — see README for details
 * and the risk this carries (undocumented, can change or break without notice).
 */
const JUSTWATCH_API = "https://apis.justwatch.com/graphql";
const IMAGES_BASE = "https://images.justwatch.com";
const COUNTRY = "AR";
const LANGUAGE = "es";
const LEAVING_SOON_WINDOW_DAYS = 30;

const POPULAR_QUERY = `
query GetPopularTitles(
  $popularTitlesFilter: TitleFilter
  $country: Country!
  $language: Language!
  $first: Int!
  $filter: OfferFilter!
) {
  popularTitles(country: $country, filter: $popularTitlesFilter, first: $first, sortBy: POPULAR) {
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

async function postGraphQL<T>(operationName: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(JUSTWATCH_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operationName, query, variables }),
    next: { revalidate: 60 * 60 },
  });
  if (!res.ok) throw new Error(`JustWatch respondió ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error("JustWatch devolvió un error: " + JSON.stringify(json.errors));
  return json.data as T;
}

/**
 * Titles leaving one of the given JustWatch provider packages soon (within
 * LEAVING_SOON_WINDOW_DAYS). This is the one feature TMDB's watch/providers
 * endpoint doesn't expose, so it goes straight to JustWatch's own (unofficial) API.
 */
export async function getLeavingSoon(justWatchProviderIds: string[]): Promise<Title[]> {
  if (justWatchProviderIds.length === 0) return [];

  const data = await postGraphQL<{ popularTitles: { edges: { node: JwNode }[] } }>(
    "GetPopularTitles",
    POPULAR_QUERY,
    {
      popularTitlesFilter: {
        packages: justWatchProviderIds,
        objectTypes: ["MOVIE", "SHOW"],
        includeTitlesWithoutUrl: true,
      },
      country: COUNTRY,
      language: LANGUAGE,
      first: 100,
      filter: { bestOnly: true },
    }
  );

  const now = Date.now();
  const cutoff = now + LEAVING_SOON_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  const titles: Title[] = [];
  for (const { node } of data.popularTitles.edges) {
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

  return titles;
}
