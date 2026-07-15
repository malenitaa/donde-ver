import { NextRequest, NextResponse } from "next/server";
import { getRegions } from "@/lib/tmdb";
import { parseLocale } from "@/lib/i18n";

export async function GET(request: NextRequest) {
  const locale = parseLocale(request.nextUrl.searchParams.get("locale"));
  try {
    const regions = await getRegions(locale);
    return NextResponse.json({ regions });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
