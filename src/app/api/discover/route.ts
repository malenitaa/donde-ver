import { NextRequest, NextResponse } from "next/server";
import { discoverTitles } from "@/lib/tmdb";
import { parseLocale, isValidCountry } from "@/lib/i18n";
import type { MediaType } from "@/lib/types";

const MAX_PROVIDERS = 10;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const providerIds = (params.get("providers") ?? "")
    .split(",")
    .filter(Boolean)
    .map(Number)
    .filter(Number.isFinite)
    .slice(0, MAX_PROVIDERS);
  const country = params.get("country");
  const locale = parseLocale(params.get("locale"));
  const type = (params.get("type") as MediaType | "all") ?? "all";
  const genreName = params.get("genre") ?? undefined;
  const maxRuntimeParam = params.get("maxRuntime");
  const maxRuntime = maxRuntimeParam && Number.isFinite(Number(maxRuntimeParam)) ? Number(maxRuntimeParam) : undefined;

  if (providerIds.length === 0) {
    return NextResponse.json({ results: [] });
  }
  if (!country || !isValidCountry(country)) {
    return NextResponse.json({ error: "Falta el parámetro country" }, { status: 400 });
  }

  try {
    const mediaTypes: MediaType[] = type === "all" ? ["movie", "tv"] : [type];
    const results = (
      await Promise.all(
        mediaTypes.map((mediaType) => discoverTitles({ mediaType, region: country, locale, providerIds, genreName, maxRuntime }))
      )
    ).flat();

    results.sort(() => Math.random() - 0.5);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("[api/discover]", err);
    return NextResponse.json({ error: "No pudimos consultar TMDB." }, { status: 502 });
  }
}
