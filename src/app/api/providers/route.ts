import { NextResponse } from "next/server";
import { getCuratedProviders } from "@/lib/tmdb";

export async function GET() {
  try {
    const providers = await getCuratedProviders();
    return NextResponse.json({ providers });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
