export type MediaType = "movie" | "tv";

export type Country = {
  /** ISO 3166-1 alpha-2 code, e.g. "AR" */
  code: string;
  name: string;
};

export type Provider = {
  /** TMDB watch-provider id */
  id: number;
  name: string;
  logoPath: string | null;
  /** JustWatch short code, used to query leaving-soon data. Absent if we couldn't map it. */
  justWatchId: string | null;
};

export type Genre = {
  id: number;
  name: string;
};

export type TitleOffer = {
  providerId: number;
  providerName: string;
  logoPath: string | null;
  type: "flatrate" | "rent" | "buy" | "free" | "ads";
};

export type Title = {
  id: number;
  mediaType: MediaType;
  title: string;
  year: number | null;
  posterPath: string | null;
  overview: string;
  runtime: number | null;
  genres: string[];
  offers: TitleOffer[];
  /** Only present for the leaving-soon feed */
  leavingAt?: string | null;
};

export type EmptyStateReason = "no-platforms" | "no-results" | "api-error" | null;
