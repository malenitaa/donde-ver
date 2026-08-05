# Dónde ver

[![Sitio en vivo](https://img.shields.io/badge/sitio-en%20vivo-6b46c1)](https://catalogio.vercel.app)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Buscador de películas y series que te muestra al instante en cuál de **tus**
plataformas de streaming (Netflix, HBO Max, Disney+, Prime Video, y más) está
disponible cada título — sin cuenta, sin login.

## Usarlo

No hay que instalar nada — es una página web. Entrá directo a:

### 👉 [catalogio.vercel.app](https://catalogio.vercel.app)

La primera vez elegís tu país y qué plataformas tenés; a partir de ahí todo
se filtra automáticamente.

## Funcionalidad

- Buscador: tipeás un título y te dice en cuál de tus apps está (o en cuáles
  otras sí está, si no está en las tuyas).
- Catálogo filtrable por tipo (película/serie), género, duración.
- **Por irse del catálogo pronto**: qué títulos de tus plataformas están por
  dejar de estar disponibles en los próximos 30 días.
- Watchlist personal ("Mi lista").
- Español o inglés.

## Preguntas frecuentes

**¿Necesito crear una cuenta?**
No, no hay cuentas, ni login, ni nada parecido — tus plataformas y tu lista
se guardan en tu propio navegador (`localStorage`).

**¿Manda mis datos a algún lado?**
No hay datos personales que mandar: no sabemos quién sos, solo qué
plataformas elegiste (guardado localmente en tu navegador).

**¿Es gratis?**
Sí, y no tiene publicidad ni ningún costo oculto.

## Para desarrolladores

Requisitos: Node.js 20+, y una API key gratuita de [TMDB](https://www.themoviedb.org/settings/api).

```bash
git clone https://github.com/malenitaa/donde-ver.git
cd donde-ver
npm install
cp .env.example .env.local
# completá TMDB_API_KEY en .env.local con tu propia API key
npm run dev
```

## ¿Te sirvió?

Si te resultó útil y querés bancar el proyecto:

- [Cafecito](https://cafecito.app/rezamalena)
- [Ko-fi](https://ko-fi.com/malenitaa)

## Licencia

MIT — ver [LICENSE](LICENSE).
