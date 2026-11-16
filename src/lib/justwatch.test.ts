import { afterEach, describe, expect, it, vi } from "vitest";
import { getLeavingSoon } from "./justwatch";

const DAY_MS = 24 * 60 * 60 * 1000;
const isoDateIn = (days: number) => new Date(Date.now() + days * DAY_MS).toISOString().slice(0, 10);

function node(id: string, title: string, shortName: string, clearName: string, availableTo: string | null) {
  return {
    id,
    objectType: "MOVIE",
    content: {
      title,
      originalReleaseYear: 2020,
      runtime: 100,
      genres: [],
      posterUrl: null,
      externalIds: { tmdbId: null },
    },
    offers: [{ monetizationType: "FLATRATE", availableTo, package: { shortName, clearName } }],
  };
}

// Mimics what JustWatch answers in AR (Nov 2026): Netflix offers come without
// any `availableTo`, HBO Max offers do have one.
const CATALOG: Record<string, ReturnType<typeof node>[]> = {
  nfx: [node("tm1", "Una de Netflix", "nfx", "Netflix", null), node("tm2", "Otra de Netflix", "nfx", "Netflix", null)],
  mxx: [node("tm3", "Se va de HBO", "mxx", "HBO Max", isoDateIn(10)), node("tm4", "Se queda en HBO", "mxx", "HBO Max", isoDateIn(90))],
};

function stubJustWatch(failing: string[] = []) {
  const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
    const { variables } = JSON.parse(init.body as string);
    const pkg: string = variables.popularTitlesFilter.packages[0];
    if (failing.includes(pkg)) throw new Error("timeout");
    const edges = variables.offset === 0 ? (CATALOG[pkg] ?? []).map((n) => ({ node: n })) : [];
    return new Response(JSON.stringify({ data: { popularTitles: { edges } } }), { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getLeavingSoon", () => {
  it("flags Netflix as having no expiry dates instead of reporting nothing leaving", async () => {
    stubJustWatch();
    const { titles, providersWithoutDates } = await getLeavingSoon(["nfx"], "AR", "es");
    expect(titles).toEqual([]);
    expect(providersWithoutDates).toEqual(["nfx"]);
  });

  it("returns HBO Max titles leaving soon and still flags Netflix when both are picked", async () => {
    stubJustWatch();
    const { titles, providersWithoutDates } = await getLeavingSoon(["nfx", "mxx"], "AR", "es");
    expect(titles.map((t) => t.title)).toEqual(["Se va de HBO"]);
    expect(titles[0].offers[0].providerName).toBe("HBO Max");
    expect(providersWithoutDates).toEqual(["nfx"]);
  });

  it("doesn't flag a provider with dates even if nothing of it is leaving within the window", async () => {
    CATALOG.mxx2 = [node("tm5", "Lejos", "mxx2", "HBO Max", isoDateIn(90))];
    stubJustWatch();
    const { titles, providersWithoutDates } = await getLeavingSoon(["mxx2"], "AR", "es");
    delete CATALOG.mxx2;
    expect(titles).toEqual([]);
    expect(providersWithoutDates).toEqual([]);
  });

  it("doesn't flag a provider whose pages all failed: that's an outage, not missing dates", async () => {
    stubJustWatch(["nfx"]);
    const { titles, providersWithoutDates } = await getLeavingSoon(["nfx", "mxx"], "AR", "es");
    expect(titles.map((t) => t.title)).toEqual(["Se va de HBO"]);
    expect(providersWithoutDates).toEqual([]);
  });
});
