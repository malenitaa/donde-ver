import { NextResponse } from "next/server";
import { getRegions } from "@/lib/tmdb";

export async function GET() {
  try {
    const regions = await getRegions();
    return NextResponse.json({ regions });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
