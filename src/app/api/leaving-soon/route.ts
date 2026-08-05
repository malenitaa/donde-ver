import { NextRequest, NextResponse } from "next/server";
import { getLeavingSoon } from "@/lib/justwatch";
import { parseLocale, isValidCountry } from "@/lib/i18n";

const MAX_PROVIDERS = 10;

export async function GET(request: NextRequest) {
  const providers = (request.nextUrl.searchParams.get("providers") ?? "")
    .split(",")
    .filter(Boolean)
    .slice(0, MAX_PROVIDERS);
  const country = request.nextUrl.searchParams.get("country");
  const locale = parseLocale(request.nextUrl.searchParams.get("locale"));

  if (providers.length === 0) {
    return NextResponse.json({ results: [] });
  }
  if (!country || !isValidCountry(country)) {
    return NextResponse.json({ error: "Falta el parámetro country" }, { status: 400 });
  }

  try {
    const results = await getLeavingSoon(providers, country, locale, request.signal);
    return NextResponse.json({ results });
  } catch (err) {
    if ((err as Error).name === "AbortError") return new NextResponse(null, { status: 499 });
    console.error("[api/leaving-soon]", err);
    return NextResponse.json({ error: "No pudimos consultar JustWatch." }, { status: 502 });
  }
}
