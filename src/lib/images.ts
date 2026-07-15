const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

/** posterPath may be a TMDB-relative path, a JustWatch absolute URL, or null. */
export function posterUrl(posterPath: string | null, size: "w342" | "w500" = "w342"): string | null {
  if (!posterPath) return null;
  if (posterPath.startsWith("http")) return posterPath;
  return `${TMDB_IMAGE_BASE}/${size}${posterPath}`;
}

export function logoUrl(logoPath: string | null): string | null {
  if (!logoPath) return null;
  if (logoPath.startsWith("http")) return logoPath;
  return `${TMDB_IMAGE_BASE}/w92${logoPath}`;
}
