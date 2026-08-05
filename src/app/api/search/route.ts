import { NextRequest, NextResponse } from "next/server";
import { searchTitles } from "@/lib/tmdb";
import { parseLocale, isValidCountry } from "@/lib/i18n";

const MAX_QUERY_CHARS = 200;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, MAX_QUERY_CHARS);
  const country = request.nextUrl.searchParams.get("country");
  const locale = parseLocale(request.nextUrl.searchParams.get("locale"));
  if (!query) {
    return NextResponse.json({ error: "Falta el parámetro q" }, { status: 400 });
  }
  if (!country || !isValidCountry(country)) {
    return NextResponse.json({ error: "Falta el parámetro country" }, { status: 400 });
  }

  try {
    const results = await searchTitles(query, country, locale);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("[api/search]", err);
    return NextResponse.json({ error: "No pudimos consultar TMDB." }, { status: 502 });
  }
}
