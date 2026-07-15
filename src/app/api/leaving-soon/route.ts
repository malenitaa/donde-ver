import { NextRequest, NextResponse } from "next/server";
import { getLeavingSoon } from "@/lib/justwatch";
import { parseLocale } from "@/lib/i18n";

export async function GET(request: NextRequest) {
  const providers = (request.nextUrl.searchParams.get("providers") ?? "")
    .split(",")
    .filter(Boolean);
  const country = request.nextUrl.searchParams.get("country");
  const locale = parseLocale(request.nextUrl.searchParams.get("locale"));

  if (providers.length === 0) {
    return NextResponse.json({ results: [] });
  }
  if (!country) {
    return NextResponse.json({ error: "Falta el parámetro country" }, { status: 400 });
  }

  try {
    const results = await getLeavingSoon(providers, country, locale);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
