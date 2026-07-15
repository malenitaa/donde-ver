import { NextRequest, NextResponse } from "next/server";
import { searchTitles } from "@/lib/tmdb";
import { parseLocale } from "@/lib/i18n";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  const country = request.nextUrl.searchParams.get("country");
  const locale = parseLocale(request.nextUrl.searchParams.get("locale"));
  if (!query) {
    return NextResponse.json({ error: "Falta el parámetro q" }, { status: 400 });
  }
  if (!country) {
    return NextResponse.json({ error: "Falta el parámetro country" }, { status: 400 });
  }

  try {
    const results = await searchTitles(query, country, locale);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
