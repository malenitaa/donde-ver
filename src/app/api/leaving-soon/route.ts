import { NextRequest, NextResponse } from "next/server";
import { CACHE_HOUR } from "@/lib/cacheHeaders";
import { getLeavingSoon } from "@/lib/justwatch";
import { parseLocale, isValidCountry } from "@/lib/i18n";
import { CURATED_PROVIDERS } from "@/lib/providers";

const MAX_PROVIDERS = 10;
// Each provider costs PAGES_PER_PROVIDER requests to JustWatch, so only the
// ones the app offers are accepted, once each.
const KNOWN_PROVIDERS = new Set(CURATED_PROVIDERS.map((p) => p.justWatchId));

export async function GET(request: NextRequest) {
  const providers = [
    ...new Set((request.nextUrl.searchParams.get("providers") ?? "").split(",").filter((p) => KNOWN_PROVIDERS.has(p))),
  ].slice(0, MAX_PROVIDERS);
  const country = request.nextUrl.searchParams.get("country");
  const locale = parseLocale(request.nextUrl.searchParams.get("locale"));

  if (providers.length === 0) {
    return NextResponse.json({ results: [] });
  }
  if (!country || !isValidCountry(country)) {
    return NextResponse.json({ error: "Falta el parámetro country" }, { status: 400 });
  }

  try {
    const { titles, providersWithoutDates } = await getLeavingSoon(providers, country, locale, request.signal);
    return NextResponse.json({ results: titles, providersWithoutDates }, { headers: CACHE_HOUR });
  } catch (err) {
    if ((err as Error).name === "AbortError") return new NextResponse(null, { status: 499 });
    console.error("[api/leaving-soon]", err);
    return NextResponse.json({ error: "No pudimos consultar JustWatch." }, { status: 502 });
  }
}
