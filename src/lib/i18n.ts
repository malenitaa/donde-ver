export type Locale = "es" | "en";

/** TMDB's `language` param per locale — controls titles, overviews, genre names. */
export const TMDB_LANGUAGE: Record<Locale, string> = {
  es: "es-AR",
  en: "en-US",
};

/** JustWatch's `language` param per locale. */
export const JUSTWATCH_LANGUAGE: Record<Locale, string> = {
  es: "es",
  en: "en",
};

/** TMDB genre names are locale-specific text, matched exactly against what TMDB
 * returns for /genre/movie/list and /genre/tv/list — keep these in sync with
 * TMDB's own translations for each language. */
export const GENRE_OPTIONS: Record<Locale, string[]> = {
  es: [
    "Acción",
    "Comedia",
    "Drama",
    "Terror",
    "Animación",
    "Documental",
    "Crimen",
    "Familia",
    "Romance",
    "Ciencia ficción",
    "Misterio",
    "Fantasía",
  ],
  en: [
    "Action",
    "Comedy",
    "Drama",
    "Horror",
    "Animation",
    "Documentary",
    "Crime",
    "Family",
    "Romance",
    "Science Fiction",
    "Mystery",
    "Fantasy",
  ],
};

export const RUNTIME_OPTIONS: Record<Locale, { label: string; value: number }[]> = {
  es: [
    { label: "Menos de 90 min", value: 90 },
    { label: "Menos de 2 horas", value: 120 },
  ],
  en: [
    { label: "Under 90 min", value: 90 },
    { label: "Under 2 hours", value: 120 },
  ],
};

export type Strings = typeof STRINGS.es;

export const STRINGS = {
  es: {
    appName: "Dónde ver",
    myList: "Mi lista",
    editCountry: "País",
    editCountryAria: "Editar país",
    editPlatforms: "Mis apps",
    editPlatformsAria: "Editar mis plataformas",
    editLanguageAria: "Cambiar idioma",
    searchPlaceholder: "Buscá una película o serie…",
    filters: "Filtros",
    typeAll: "Todo",
    typeMovie: "Películas",
    typeTv: "Series",
    mediaTypeMovie: "Película",
    mediaTypeTv: "Serie",
    anyGenre: "Cualquier género",
    anyRuntime: "Cualquier duración",
    leavingSoonFilter: "Por irse del catálogo",
    loading: "Buscando…",
    errorTitle: "No pudimos conectar con el servicio",
    errorDescription: "TMDB o JustWatch no respondieron. Probá de nuevo en unos segundos.",
    retry: "Reintentar",
    noResultsLeaving: "Nada por irse de tus plataformas por ahora",
    noResultsGeneric: "Sin resultados",
    noResultsQuery: (q: string) => `No encontramos "${q}".`,
    tryAdjustFilters: "Probá ajustar los filtros.",
    notInYourApps: (q: string) => `"${q}" no está disponible en tus apps`,
    availableElsewhere: "Pero lo encontramos en otras plataformas:",
    watchlistTitle: "Mi lista",
    watchlistEmptyTitle: "Todavía no agregaste nada",
    watchlistEmptyDescription: 'Buscá algo y tocá el "+" en el poster para guardarlo acá.',
    addToWatchlist: "Agregar a mi lista",
    removeFromWatchlist: "Quitar de mi lista",
    notInYourAppsCard: "No está en tus apps. Disponible en:",
    noStreamingOffer: "Sin oferta de streaming disponible.",
    leavingAtBadge: (date: string) => `Se va ${date}`,
    onboardingTitle: "Antes de arrancar",
    onboardingDescription:
      "Elegí el país de tus cuentas de streaming y qué plataformas tenés ahí. Filtramos todo lo que ves para que solo aparezca contenido disponible en esas apps.",
    countryLabel: "País del catálogo",
    countryHelp: "No se detecta por ubicación — elegilo vos.",
    platformsLabel: "Tus plataformas",
    platformsModalDescription: "Marcá las que tenés. Filtramos todo lo que ves para que solo aparezca contenido disponible ahí.",
    save: "Guardar",
    pickAtLeastOne: "Elegí al menos una plataforma para continuar.",
    close: "Cerrar",
    loadingProviders: "Cargando plataformas…",
    providersError: "No pudimos cargar la lista de plataformas. Revisá tu conexión o intentá de nuevo más tarde.",
    loadingCountries: "Cargando países…",
    countriesError: "No pudimos cargar la lista de países.",
  },
  en: {
    appName: "Where to watch",
    myList: "My list",
    editCountry: "Country",
    editCountryAria: "Edit country",
    editPlatforms: "My apps",
    editPlatformsAria: "Edit my platforms",
    editLanguageAria: "Change language",
    searchPlaceholder: "Search a movie or show…",
    filters: "Filters",
    typeAll: "All",
    typeMovie: "Movies",
    typeTv: "Shows",
    mediaTypeMovie: "Movie",
    mediaTypeTv: "Show",
    anyGenre: "Any genre",
    anyRuntime: "Any runtime",
    leavingSoonFilter: "Leaving soon",
    loading: "Searching…",
    errorTitle: "We couldn't reach the service",
    errorDescription: "TMDB or JustWatch didn't respond. Try again in a few seconds.",
    retry: "Retry",
    noResultsLeaving: "Nothing leaving your platforms right now",
    noResultsGeneric: "No results",
    noResultsQuery: (q: string) => `We couldn't find "${q}".`,
    tryAdjustFilters: "Try adjusting the filters.",
    notInYourApps: (q: string) => `"${q}" isn't available on your apps`,
    availableElsewhere: "But we found it on other platforms:",
    watchlistTitle: "My list",
    watchlistEmptyTitle: "You haven't added anything yet",
    watchlistEmptyDescription: 'Search for something and tap the "+" on the poster to save it here.',
    addToWatchlist: "Add to my list",
    removeFromWatchlist: "Remove from my list",
    notInYourAppsCard: "Not on your apps. Available on:",
    noStreamingOffer: "No streaming offer available.",
    leavingAtBadge: (date: string) => `Leaving ${date}`,
    onboardingTitle: "Before you start",
    onboardingDescription:
      "Pick the country your streaming accounts are in and which platforms you have there. We filter everything you see so only content available on those apps shows up.",
    countryLabel: "Catalog country",
    countryHelp: "Not detected by location — you choose it.",
    platformsLabel: "Your platforms",
    platformsModalDescription: "Check off the ones you have. We filter everything you see so only content available there shows up.",
    save: "Save",
    pickAtLeastOne: "Pick at least one platform to continue.",
    close: "Close",
    loadingProviders: "Loading platforms…",
    providersError: "We couldn't load the platform list. Check your connection or try again later.",
    loadingCountries: "Loading countries…",
    countriesError: "We couldn't load the country list.",
  },
} satisfies Record<Locale, Record<string, unknown>>;

// Compile-time guard: every locale must expose exactly the same keys, so a
// key added to one dictionary and forgotten in the other fails the build
// instead of silently rendering blank text at runtime (STRINGS[locale] has
// no other check tying `en` and `es` together — `satisfies` above only
// checks each locale's shape against `Record<string, unknown>` on its own).
type AssertSameKeys<A, B> = keyof A extends keyof B ? (keyof B extends keyof A ? true : never) : never;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _localeKeysMatch: AssertSameKeys<(typeof STRINGS)["es"], (typeof STRINGS)["en"]> = true;

/** Suggests a locale from the browser's own language setting — a device
 * preference, not IP/geolocation. Always overridable via the language toggle. */
export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "es";
  return navigator.language.toLowerCase().startsWith("en") ? "en" : "es";
}

/** Parses a `locale` query param on the server, falling back to "es" if missing/invalid. */
export function parseLocale(value: string | null): Locale {
  return value === "en" ? "en" : "es";
}
