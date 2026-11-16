/**
 * Cache-Control for successful /api responses. Nothing they return depends on
 * who's asking, so Vercel's CDN can serve them per URL instead of every visit
 * hitting TMDB and JustWatch again. Errors are left out on purpose: a 502
 * from a TMDB hiccup shouldn't be cached for an hour.
 */
export const CACHE_HOUR = { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" };
/** For lists that barely change: countries and platforms per country. */
export const CACHE_DAY = { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" };
