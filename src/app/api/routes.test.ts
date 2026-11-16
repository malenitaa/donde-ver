import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as discover } from "./discover/route";
import { GET as leavingSoon } from "./leaving-soon/route";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  process.env.TMDB_API_KEY = "test-key";
  // Answers every upstream call with an empty, well-formed payload: these tests
  // only care about which requests the routes make, not what comes back.
  fetchMock = vi.fn(async (input: string | URL) => {
    const url = String(input);
    const body = url.includes("justwatch")
      ? { data: { popularTitles: { edges: [] } } }
      : url.includes("/genre/")
        ? { genres: [] }
        : { results: [] };
    return new Response(JSON.stringify(body), { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const req = (path: string) => new NextRequest(new URL(path, "http://localhost"));
const upstreamUrls = () => fetchMock.mock.calls.map(([input]) => String(input));

describe("/api/discover", () => {
  it("rejects a type that would become a TMDB path, without calling TMDB", async () => {
    for (const type of ["movie%2F550%3Fx%3D", "zzz"]) {
      const res = await discover(req(`/api/discover?providers=8&country=AR&locale=es&type=${type}`));
      expect(res.status).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a maxRuntime the filter bar doesn't offer", async () => {
    const res = await discover(req("/api/discover?providers=8&country=AR&locale=es&maxRuntime=99999"));
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts the filter bar's runtimes and media types", async () => {
    for (const q of ["type=movie", "type=tv", "type=all", "maxRuntime=90", "maxRuntime=120"]) {
      const res = await discover(req(`/api/discover?providers=8&country=AR&locale=es&${q}`));
      expect(res.status).toBe(200);
    }
  });

  it("drops invalid and repeated provider ids and sorts the rest", async () => {
    const res = await discover(req("/api/discover?providers=337,8,8,1.5,-5,abc&country=AR&locale=es&type=movie"));
    expect(res.status).toBe(200);
    const discoverCall = upstreamUrls().find((u) => u.includes("/discover/movie"))!;
    expect(new URL(discoverCall).searchParams.get("with_watch_providers")).toBe("8|337");
  });
});

describe("/api/leaving-soon", () => {
  it("only asks JustWatch about known providers, once each", async () => {
    const res = await leavingSoon(req("/api/leaving-soon?providers=nfx,nfx,zzz&country=AR&locale=es"));
    expect(res.status).toBe(200);
    // PAGES_PER_PROVIDER (5) pages for nfx only.
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("answers empty without calling JustWatch when no provider is known", async () => {
    const res = await leavingSoon(req("/api/leaving-soon?providers=zzz&country=AR&locale=es"));
    expect(await res.json()).toEqual({ results: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("CDN caching", () => {
  it("lets the CDN cache successful answers", async () => {
    const res = await leavingSoon(req("/api/leaving-soon?providers=nfx&country=AR&locale=es"));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("s-maxage=3600");
  });

  it("doesn't cache errors", async () => {
    const bad = await leavingSoon(req("/api/leaving-soon?providers=nfx"));
    expect(bad.status).toBe(400);
    expect(bad.headers.get("cache-control") ?? "").not.toContain("s-maxage");

    fetchMock.mockImplementation(async () => new Response("nope", { status: 500 }));
    const upstreamDown = await discover(req("/api/discover?providers=8&country=AR&locale=es&type=movie"));
    expect(upstreamDown.status).toBe(502);
    expect(upstreamDown.headers.get("cache-control") ?? "").not.toContain("s-maxage");
  });
});
