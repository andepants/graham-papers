# The Grahamanack

**The Grahamanack** is an unofficial, fan-made **reading guide** to [Paul Graham’s essays](https://paulgraham.com/articles.html). It links to every essay on paulgraham.com, and offers a free **ebook compilation** (PDF, EPUB, MOBI) for personal, offline reading. All essays remain © Paul Graham; each essay in the book links back to its original page.

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

## Build ebooks (maintainers only)

```bash
npm run build-ebooks
```

Fetches every essay in `data/catalog.json` and compiles `public/downloads/grahamanack.{html,epub,pdf,mobi}`:

| Format | Tool required |
|--------|---------------|
| HTML   | (none) |
| EPUB   | `brew install pandoc` |
| PDF    | Google Chrome (headless print-to-pdf) |
| MOBI   | `brew install --cask calibre` |

Fetched essay HTML is cached in `.cache/` (gitignored). Useful flags: `--limit N`, `--only slug1,slug2`, `--html-only`, `--refresh`.

Commit the files in `public/downloads/` — Vercel serves them as static assets from `out/`, so no storage service is needed. Regenerate after `npm run refresh-metadata` picks up new essays.

## Disclaimer

Not affiliated with or endorsed by Paul Graham. All essays © Paul Graham — read on paulgraham.com. Inspired by Eric Jorgenson’s Navalmanack.
