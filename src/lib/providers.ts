/**
 * Streaming platforms we offer during onboarding, curated for the Argentine market.
 * `match` is used to find the corresponding entry in TMDB's watch/providers response,
 * matched exactly (not substring) against TMDB's `provider_name` lowercased, to avoid
 * pulling in unrelated "X Amazon Channel" / "X Apple TV Channel" bundle listings.
 * `justWatchId` is the 3-letter short code JustWatch uses for the same service,
 * needed for the "leaving soon" feature. See README for why this mapping is
 * name-based rather than a hardcoded TMDB id table.
 */
export const CURATED_PROVIDERS: { match: string[]; justWatchId: string }[] = [
  { match: ["netflix"], justWatchId: "nfx" },
  { match: ["hbo max"], justWatchId: "mxx" },
  { match: ["disney plus", "disney+"], justWatchId: "dnp" },
  { match: ["amazon prime video"], justWatchId: "prv" },
  { match: ["paramount plus"], justWatchId: "pmp" },
  { match: ["apple tv", "apple tv plus"], justWatchId: "atp" },
  { match: ["mubi"], justWatchId: "mbi" },
  { match: ["claro video"], justWatchId: "clv" },
  { match: ["movistartv", "movistar play", "movistar plus"], justWatchId: "mvp" },
  { match: ["crunchyroll"], justWatchId: "cru" },
];

export function findJustWatchId(providerName: string): string | null {
  const normalized = providerName.trim().toLowerCase();
  const entry = CURATED_PROVIDERS.find((p) => p.match.some((m) => normalized === m));
  return entry?.justWatchId ?? null;
}

export function isCuratedProvider(providerName: string): boolean {
  return findJustWatchId(providerName) !== null;
}
