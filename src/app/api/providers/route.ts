import { NextRequest, NextResponse } from "next/server";
import { getCuratedProviders } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country");
  if (!country) {
    return NextResponse.json({ error: "Falta el parámetro country" }, { status: 400 });
  }

  try {
    const providers = await getCuratedProviders(country);
    return NextResponse.json({ providers });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
