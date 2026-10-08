# The Grahamanack

**The Grahamanack** is an unofficial, fan-made **reading guide** to [Paul Graham’s essays](https://paulgraham.com/articles.html). It links to every essay on paulgraham.com — **no essay text or book files are hosted here.**

Intended domain: [grahamanack.com](https://grahamanack.com).

## Develop

```bash
npm install
npm run dev
```

## Build (offline-safe)

```bash
npm run build
```

Static export is written to **`out/`**. No network required if `data/catalog.json` is committed.

### Vercel

| Setting | Value |
|---------|--------|
| Framework | Next.js |
| Build command | `npm run build` |
| Output directory | `out` |

(`vercel.json` in the repo matches this.)

## Refresh metadata (maintainers only)

```bash
npm run refresh-metadata
```

Fetches [articles.html](https://paulgraham.com/articles.html) and each essay page **only** for title and date. Updates `data/catalog.json` and `data/parts.json`. Never stores essay bodies.

## Disclaimer

Not affiliated with or endorsed by Paul Graham. All essays © Paul Graham — read on paulgraham.com. Inspired by Eric Jorgenson’s Navalmanack.
