import { NextRequest, NextResponse } from "next/server";
import { getLeavingSoon } from "@/lib/justwatch";

export async function GET(request: NextRequest) {
  const providers = (request.nextUrl.searchParams.get("providers") ?? "")
    .split(",")
    .filter(Boolean);

  if (providers.length === 0) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await getLeavingSoon(providers);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
