# The Grahamanack

**The Grahamanack** (a play on [Navalmanack](https://www.navalmanack.com)) is a free, unofficial, non-commercial site that collects [Paul Graham’s essays](https://paulgraham.com/articles.html) for reading on the web and downloading as a single book (PDF, EPUB, MOBI).

Intended domain: [grahamanack.com](https://grahamanack.com) (not configured in this repo beyond metadata).

This repository name remains `graham-papers`.

## What’s included

- **Content pipeline** — fetch essays from paulgraham.com into Markdown with metadata (`title`, `date`, `url`, stable `slug`).
- **Themed book structure** — essays grouped into parts (see `data/parts.json`), ordered by publish date within each part.
- **Static site** — Next.js export deployable on Vercel: home, table of contents, essay pages, download page, about, and “all essays by date”.
- **Book builds** — `grahamanack.pdf`, `grahamanack.epub`, `grahamanack.mobi` from the same source.

## Regenerate everything

```bash
npm install

# 1) Fetch essays (respectful delay between requests)
npm run fetch

# 2) Assign / sort essays into themed parts (edits data/parts.json)
npm run assign-parts

# 3) Build generated/site-data.json for the site
npm run build:data

# 4) Build PDF / EPUB / MOBI (requires pandoc, texlive-xetex; MOBI needs Calibre ebook-convert)
npm run build:books

# 5) Build static site to out/
npm run build:site
```

Or:

```bash
npm run regenerate
```

### Tooling for books

| Output | Tooling |
|--------|---------|
| EPUB | [Pandoc](https://pandoc.org/) |
| PDF | Pandoc + XeLaTeX (`texlive-xetex`, `texlive-fonts-recommended`) |
| MOBI | [Calibre](https://calibre-ebook.com/) `ebook-convert` (MOBI chosen for widest Kindle compatibility; AZW3 is equivalent on modern Kindles but Calibre’s default export path is MOBI/KF8) |

PDF uses `-f commonmark` to avoid LaTeX math parsing issues in code-heavy essays.

### What we commit vs CI

- **Committed:** essay Markdown (`content/essays/`), `data/parts.json`, `generated/site-data.json`, and **prebuilt downloads** in `public/downloads/` so Vercel can serve files without running LaTeX on deploy.
- **CI (`.github/workflows/build.yml`):** on push/PR, runs full book + site build and uploads book artifacts. Re-run locally and commit updated binaries when essays change.

## Adjust themed parts

Edit `data/parts.json`:

- Each part has `id`, `number`, `title`, `subtitle`, and `slugs[]`.
- Every essay slug must appear **exactly once** across all parts.
- Run `npm run assign-parts` after `npm run fetch` to auto-assign **new** essays (keyword heuristics); reordering within a part is by essay `date` in front matter.

Schema reference: `data/parts.schema.json`.

## Deploy (Vercel)

- Framework: Next.js  
- Build command: `npm run build:data && npm run build:site` (see `vercel.json`)  
- Output directory: `out`

Set production domain to `grahamanack.com` when ready.

## Local dev

```bash
npm run build:data   # after fetch / parts changes
npm run dev
```

## Disclaimer

The Grahamanack is **not** official or endorsed by Paul Graham. All essays are copyright Paul Graham. Each page links to the original on paulgraham.com. Free to read and download; not for sale. No ads, payments, or email capture.
