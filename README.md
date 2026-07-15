# Dónde ver

Web app para buscar películas y series y ver al instante en cuál de *tus* plataformas de streaming están disponibles. Filtra todo (búsqueda, catálogo, "por irse del catálogo") según las apps que elegís tener, sin cuenta ni login: todo vive en `localStorage`.

## Qué hace

1. La primera vez que entrás elegís, en el mismo paso, el país de tus cuentas de streaming (default Argentina, editable) y qué plataformas tenés ahí (Netflix, HBO Max, Disney+, Prime Video, Paramount+, Apple TV, MUBI, Claro video, MovistarTV, Crunchyroll). Se guarda en `localStorage`. Podés editar cada uno por separado después con los botones "País" y "Mis apps" en el header.
2. Todo lo que ves —catálogo por defecto y resultados de búsqueda— se filtra automáticamente a esas plataformas, en el país elegido.
3. Buscador con debounce: tipeás un título y ves en cuál de tus apps está. Si no está en ninguna, te avisa y te muestra en qué otras plataformas sí está disponible.
4. Filtros por tipo (película/serie), género, duración (ej. menos de 90 min) y **por irse del catálogo pronto**.
5. Watchlist personal ("Mi lista"), guardada también en `localStorage`.

**Por qué el país es una elección manual y no se autodetecta por IP:** el catálogo que importa es el de la *cuenta* de streaming (ej. Netflix Argentina), no la ubicación física del momento — alguien de Argentina viajando por USA sigue viendo el catálogo argentino en sus apps, no el de USA. Autodetectar por IP/geolocalización mostraría falsos positivos de disponibilidad. Por eso el país nunca se infiere: se pide explícitamente en el onboarding y se puede cambiar en cualquier momento con el botón "País" del header.

## Fuentes de datos

### TMDB (metadata + disponibilidad)

[The Movie Database](https://www.themoviedb.org/) provee título, poster, sinopsis, duración, género, año, y — clave para esta app — el endpoint `watch/providers`, que **TMDB obtiene de un partnership oficial con JustWatch** y expone gratis en su API pública. Es la fuente principal de la app: búsqueda, catálogo (`/discover`), género y disponibilidad por plataforma en Argentina.

Limitación conocida: el filtro de duración de TMDB (`with_runtime.lte` en `/discover`) no funciona de forma confiable — devuelve títulos que superan el máximo pedido. Por eso esta app pide detalles completos (que sí traen el runtime real) y filtra del lado del servidor antes de responder, en vez de confiar en ese parámetro.

### JustWatch (contenido por irse del catálogo)

JustWatch **no tiene una API pública documentada**. Solo trabajan con partners grandes (`data-partner@justwatch.com`), inviable para un proyecto personal. Lo que sí existe — y es lo que usa esta app para el filtro "por irse del catálogo" — es el endpoint GraphQL no oficial que usa el propio sitio justwatch.com (`https://apis.justwatch.com/graphql`, sin autenticación). Ahí, cada oferta de streaming trae un campo `availableTo` con la fecha hasta la que el título sigue disponible en esa plataforma; si esa fecha cae dentro de los próximos 30 días, la app lo marca como "por irse".

**Esto es explícitamente no oficial**: no está documentado por JustWatch, puede cambiar de estructura o dejar de responder sin aviso, y su uso está pensado para proyectos privados (no comerciales). La lógica vive aislada en [`src/lib/justwatch.ts`](src/lib/justwatch.ts) — si un día deja de funcionar, es el primer lugar a mirar. Si eso pasa, la app sigue funcionando normalmente para todo lo demás (búsqueda, catálogo, filtros); solo se cae el filtro "por irse del catálogo".

Referencia de implementación: [`simple-justwatch-python-api`](https://github.com/Electronic-Mango/simple-justwatch-python-api), la librería no oficial más usada, de donde se tomó la forma del query GraphQL (reescrito en TypeScript acá, no se usa la librería como dependencia).

**Limitación importante de cobertura**: esta API no tiene un endpoint dedicado de "por irse del catálogo" — no existe. Lo que hay es `popularTitles`, una lista de cada plataforma ordenada por popularidad, con un límite duro de ~100 títulos por página. Esta app pide varias páginas por cada plataforma en paralelo (5 páginas × 100 = hasta 500 títulos por plataforma) y revisa el campo `availableTo` de cada uno. Es un rango razonable para no bombardear un endpoint no oficial con decenas de pedidos paralelos por cada toggle del filtro, pero **no es exhaustivo**: un título viejo o poco visto que esté en el puesto 800+ de popularidad de su plataforma puede estar por irse y no aparecer acá, aunque si lo buscás por nombre en el buscador principal sí vas a ver dónde está disponible. Antes de esta limitación había un bug más grave (ya arreglado): se consultaban todas las plataformas elegidas en un solo pedido de popularidad combinada, así que una plataforma con catálogo más chico quedaba tapada por completo por una más grande (ej. Netflix) incluso dentro de esos primeros 100 resultados. Ahora cada plataforma se consulta por separado, así que cada una tiene su propia chance de aparecer.

### Cómo se mapean las plataformas

TMDB y JustWatch identifican cada servicio de streaming con IDs distintos (TMDB usa un `provider_id` numérico, JustWatch un código de 3 letras como `nfx` para Netflix). [`src/lib/providers.ts`](src/lib/providers.ts) mapea ambos por nombre exacto de plataforma. Si TMDB cambia el nombre con el que lista un proveedor para Argentina, ese proveedor deja de aparecer en la pantalla de selección hasta actualizar el mapeo.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS. Sin backend propio más allá de route handlers (`src/app/api/*`) que llaman a TMDB y JustWatch server-side para no exponer la API key en el cliente. Sin base de datos: plataformas elegidas y watchlist viven en `localStorage`. Los resultados de búsqueda se cachean en memoria por sesión (se pierden al recargar) para no repetir pedidos mientras se tipea.

## Cómo correrlo local

1. Cloná el repo e instalá dependencias:
   ```bash
   npm install
   ```
2. Conseguí una API key gratuita de TMDB:
   - Creá una cuenta en [themoviedb.org](https://www.themoviedb.org/signup)
   - Andá a [Configuración → API](https://www.themoviedb.org/settings/api) y pedí una key de tipo "Developer" (v3 auth)
3. Copiá `.env.example` a `.env.local` y pegá tu key:
   ```bash
   cp .env.example .env.local
   ```
   ```
   TMDB_API_KEY=tu_key_aca
   ```
   (JustWatch no necesita key: la app pega directo a su endpoint público no oficial.)
4. Corré el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Abrí [http://localhost:3000](http://localhost:3000).

## Cómo deployar en Vercel

1. Importá el repo en [vercel.com/new](https://vercel.com/new).
2. En la configuración del proyecto, agregá la variable de entorno `TMDB_API_KEY` con tu key.
3. Deploy. No hace falta configurar nada más (no hay base de datos ni otros servicios).

## Estados vacíos

- **Sin plataformas seleccionadas**: se muestra la pantalla de onboarding (no se puede cerrar sin elegir al menos una).
- **Sin resultados**: mensaje según el contexto (sin resultados de búsqueda, o nada por irse del catálogo).
- **Título no disponible en tus apps**: se muestra igual, aclarando en qué otras plataformas de Argentina sí está.
- **Error de API** (TMDB o JustWatch caídos): mensaje de error con la posibilidad de reintentar cambiando el filtro o la búsqueda.
