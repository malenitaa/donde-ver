import { NextRequest, NextResponse } from "next/server";
import { getCuratedProviders } from "@/lib/tmdb";
import { parseLocale, isValidCountry } from "@/lib/i18n";

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country");
  const locale = parseLocale(request.nextUrl.searchParams.get("locale"));
  if (!country || !isValidCountry(country)) {
    return NextResponse.json({ error: "Falta el parámetro country" }, { status: 400 });
  }

  try {
    const providers = await getCuratedProviders(country, locale);
    return NextResponse.json({ providers });
  } catch (err) {
    console.error("[api/providers]", err);
    return NextResponse.json({ error: "No pudimos consultar TMDB." }, { status: 502 });
  }
}
