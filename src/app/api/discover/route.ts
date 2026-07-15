import { NextRequest, NextResponse } from "next/server";
import { discoverTitles } from "@/lib/tmdb";
import type { MediaType } from "@/lib/types";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const providerIds = (params.get("providers") ?? "")
    .split(",")
    .filter(Boolean)
    .map(Number);
  const type = (params.get("type") as MediaType | "all") ?? "all";
  const genreName = params.get("genre") ?? undefined;
  const maxRuntimeParam = params.get("maxRuntime");
  const maxRuntime = maxRuntimeParam ? Number(maxRuntimeParam) : undefined;

  if (providerIds.length === 0) {
    return NextResponse.json({ results: [] });
  }

  try {
    const mediaTypes: MediaType[] = type === "all" ? ["movie", "tv"] : [type];
    const results = (
      await Promise.all(
        mediaTypes.map((mediaType) => discoverTitles({ mediaType, providerIds, genreName, maxRuntime }))
      )
    ).flat();

    results.sort(() => Math.random() - 0.5);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
