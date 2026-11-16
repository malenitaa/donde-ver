import { NextRequest, NextResponse } from "next/server";
import { CACHE_DAY } from "@/lib/cacheHeaders";
import { getRegions } from "@/lib/tmdb";
import { parseLocale } from "@/lib/i18n";

export async function GET(request: NextRequest) {
  const locale = parseLocale(request.nextUrl.searchParams.get("locale"));
  try {
    const regions = await getRegions(locale);
    return NextResponse.json({ regions }, { headers: CACHE_DAY });
  } catch (err) {
    console.error("[api/regions]", err);
    return NextResponse.json({ error: "No pudimos consultar TMDB." }, { status: 502 });
  }
}
