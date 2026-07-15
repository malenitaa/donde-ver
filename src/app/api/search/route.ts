import { NextRequest, NextResponse } from "next/server";
import { searchTitles } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ error: "Falta el parámetro q" }, { status: 400 });
  }

  try {
    const results = await searchTitles(query);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
