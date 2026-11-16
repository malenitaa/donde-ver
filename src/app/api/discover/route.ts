import { NextRequest, NextResponse } from "next/server";
import { CACHE_HOUR } from "@/lib/cacheHeaders";
import { discoverTitles } from "@/lib/tmdb";
import { parseLocale, isValidCountry, RUNTIME_OPTIONS } from "@/lib/i18n";
import type { MediaType } from "@/lib/types";

const MAX_PROVIDERS = 10;
const MEDIA_TYPES = ["movie", "tv", "all"] as const;
const isMediaTypeParam = (v: string): v is MediaType | "all" => (MEDIA_TYPES as readonly string[]).includes(v);
// Only the runtimes the filter bar offers: any other value would just be a way
// to switch on the double-page fetch in discoverTitles with a fresh cache key.
const ALLOWED_RUNTIMES = new Set(RUNTIME_OPTIONS.es.map((r) => r.value));

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  // Deduped and sorted so the same set of platforms always maps to the same
  // TMDB URL (and the same cache entry), whatever order it was sent in.
  const providerIds = [
    ...new Set(
      (params.get("providers") ?? "")
        .split(",")
        .map(Number)
        .filter((n) => Number.isInteger(n) && n > 0)
    ),
  ]
    .sort((a, b) => a - b)
    .slice(0, MAX_PROVIDERS);
  const country = params.get("country");
  const locale = parseLocale(params.get("locale"));
  const type = params.get("type") ?? "all";
  const genreName = params.get("genre") ?? undefined;
  const maxRuntimeParam = params.get("maxRuntime");
  const maxRuntime = maxRuntimeParam ? Number(maxRuntimeParam) : undefined;

  if (providerIds.length === 0) {
    return NextResponse.json({ results: [] });
  }
  if (!country || !isValidCountry(country)) {
    return NextResponse.json({ error: "Falta el parámetro country" }, { status: 400 });
  }
  // `type` ends up as a path segment of the TMDB request (`/${type}/${id}`),
  // so anything outside the known values would let a caller pick the path.
  if (!isMediaTypeParam(type)) {
    return NextResponse.json({ error: "Parámetro type inválido" }, { status: 400 });
  }
  if (maxRuntime !== undefined && !ALLOWED_RUNTIMES.has(maxRuntime)) {
    return NextResponse.json({ error: "Parámetro maxRuntime inválido" }, { status: 400 });
  }

  try {
    const mediaTypes: MediaType[] = type === "all" ? ["movie", "tv"] : [type];
    const results = (
      await Promise.all(
        mediaTypes.map((mediaType) => discoverTitles({ mediaType, region: country, locale, providerIds, genreName, maxRuntime }))
      )
    ).flat();

    results.sort(() => Math.random() - 0.5);
    return NextResponse.json({ results }, { headers: CACHE_HOUR });
  } catch (err) {
    console.error("[api/discover]", err);
    return NextResponse.json({ error: "No pudimos consultar TMDB." }, { status: 502 });
  }
}
