#!/usr/bin/env tsx
/**
 * Builds downloadable ebook files from the essays listed in data/catalog.json.
 *
 * Maintainer-only (like refresh-metadata): requires pandoc, Google Chrome,
 * and calibre (for MOBI) installed locally. Outputs committed files to:
 *
 *   public/downloads/grahamanack.html  (single-file web version)
 *   public/downloads/grahamanack.epub  (via pandoc)
 *   public/downloads/grahamanack.pdf   (via headless Chrome print-to-pdf)
 *   public/downloads/grahamanack.mobi  (via calibre ebook-convert)
 *
 * Usage:
 *   npm run build-ebooks                  # full build
 *   npm run build-ebooks -- --limit 5     # first 5 essays only (testing)
 *   npm run build-ebooks -- --only avg,wealth,greatwork
 *   npm run build-ebooks -- --html-only   # skip epub/pdf/mobi conversion
 *   npm run build-ebooks -- --refresh     # ignore cached essay HTML
 *
 * All essays remain © Paul Graham. The generated book carries an attribution
 * page linking back to the originals at paulgraham.com.
 */
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = path.join(ROOT, ".cache", "essays");
const OUT_DIR = path.join(ROOT, "public", "downloads");
const PG_BASE = "https://paulgraham.com";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const CALIBRE_PATH = "/Applications/calibre.app/Contents/MacOS/ebook-convert";

const BOOK_TITLE = "The Grahamanack";
const BOOK_SUBTITLE = "The Essays of Paul Graham — An Unofficial Compilation";

type CatalogEssay = {
  slug: string;
  title: string;
  date: string | null;
  url: string;
};
type CatalogPart = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  essays: CatalogEssay[];
};
type Catalog = { essayCount: number; generatedAt: string; parts: CatalogPart[] };

const MONTH_LINE =
  /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/i;

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
function flagValue(name: string): string | null {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? (argv[i + 1] ?? null) : null;
}
const LIMIT = flagValue("limit") ? Number(flagValue("limit")) : null;
const ONLY = flagValue("only")?.split(",").map((s) => s.trim()) ?? null;
const HTML_ONLY = argv.includes("--html-only");
const REFRESH = argv.includes("--refresh");

// ---------------------------------------------------------------------------
// Fetching (with on-disk cache + legacy charset handling)
// ---------------------------------------------------------------------------
function decodeHtml(buf: Buffer, contentType: string | null): string {
  const m = /charset=([\w.-]+)/i.exec(contentType ?? "");
  if (m) {
    try {
      return new TextDecoder(m[1]!.toLowerCase()).decode(buf);
    } catch {
      /* fall through to detection */
    }
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder("windows-1252").decode(buf);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Some pages contain C1 control characters (U+0080–U+009F) from an upstream
// double-encoding of Windows-1252 punctuation. Map them back to real chars.
const C1_TO_CP1252: Record<number, string> = {
  0x80: "€", 0x82: "‚", 0x83: "ƒ", 0x84: "„", 0x85: "…", 0x86: "†", 0x87: "‡",
  0x88: "ˆ", 0x89: "‰", 0x8a: "Š", 0x8b: "‹", 0x8c: "Œ", 0x8e: "Ž",
  0x91: "‘", 0x92: "’", 0x93: "“", 0x94: "”", 0x95: "•", 0x96: "–", 0x97: "—",
  0x98: "˜", 0x99: "™", 0x9a: "š", 0x9b: "›", 0x9c: "œ", 0x9e: "ž", 0x9f: "Ÿ",
};
function sanitizeControls(s: string): string {
  return s.replace(/[\u0080-\u009f]/g, (ch) => C1_TO_CP1252[ch.charCodeAt(0)] ?? "");
}

async function fetchEssayHtml(slug: string, url: string): Promise<string> {
  const cachePath = path.join(CACHE_DIR, `${slug}.html`);
  if (!REFRESH && existsSync(cachePath)) {
    return fs.readFile(cachePath, "utf8");
  }
  const res = await fetch(url, {
    headers: { "User-Agent": "GrahamanackEbookBuilder/1.0 (grahamanack.com)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = decodeHtml(Buffer.from(await res.arrayBuffer()), res.headers.get("content-type"));
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(cachePath, html);
  await sleep(120); // be polite to paulgraham.com
  return html;
}

// ---------------------------------------------------------------------------
// Extraction + cleanup of a single essay body
// ---------------------------------------------------------------------------
function findContentCell($: cheerio.CheerioAPI): cheerio.Cheerio<any> | null {
  for (const w of ["435", "374", "410"]) {
    const cell = $(`td[width="${w}"]`).first();
    if (cell.length && cell.text().trim().length > 200) return cell;
  }
  // Fallback: the table cell with the most text on the page.
  let best: any = null;
  let bestLen = 0;
  $("td").each((_, el) => {
    const len = $(el).text().trim().length;
    if (len > bestLen) {
      best = el;
      bestLen = len;
    }
  });
  return best ? $(best) : null;
}

function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function extractEssayHtml(html: string, slug: string, title: string): string | null {
  const $ = cheerio.load(sanitizeControls(html));
  const cell = findContentCell($);
  if (!cell) return null;

  // Drop non-content elements.
  cell.find("script, style, form, map, select, input, iframe, noscript").remove();

  // Drop promo banner tables ("Want to start a startup?" YC ad) but keep
  // genuine content tables.
  cell.find("table").each((_, el) => {
    const t = $(el);
    const text = t.text();
    const bg = (t.attr("bgcolor") ?? "").toLowerCase();
    if (/ycombinator|want to start a startup/i.test(text) || bg === "#ff9922") {
      t.remove();
    }
  });

  // Drop spacer/tracking images and the decorative title GIF (alt ≈ title).
  const wanted = normalizeTitle(title);
  cell.find("img").each((_, el) => {
    const img = $(el);
    const src = img.attr("src") ?? "";
    const alt = normalizeTitle(img.attr("alt") ?? "");
    if (/trans_1x1|spacer/i.test(src)) return img.remove();
    if (alt && wanted && (alt === wanted || wanted.startsWith(alt) || alt.startsWith(wanted))) {
      return img.remove();
    }
  });

  // Unwrap <font> tags, keep their contents.
  for (let i = 0; i < 5; i++) {
    const fonts = cell.find("font");
    if (!fonts.length) break;
    fonts.each((_, el) => $(el).replaceWith($(el).contents() as any));
  }

  // Namespace internal anchors so 233 essays can share one document:
  // "#f1n" -> "#greatwork-f1n", and matching id/name targets.
  cell.find("[id]").each((_, el) => $(el).attr("id", `${slug}-${$(el).attr("id")}`));
  cell.find("[name]").each((_, el) => $(el).attr("name", `${slug}-${$(el).attr("name")}`));
  cell.find("a[href^='#']").each((_, el) => {
    $(el).attr("href", `#${slug}-${($(el).attr("href") ?? "#").slice(1)}`);
  });

  // Absolutize relative links and image sources against paulgraham.com so
  // they resolve correctly inside ebook readers.
  cell.find("a[href]").each((_, el) => {
    const href = $(el).attr("href")!;
    if (href.startsWith("#")) return;
    try {
      $(el).attr("href", new URL(href, `${PG_BASE}/`).toString());
    } catch {
      /* leave as-is */
    }
  });
  cell.find("img[src]").each((_, el) => {
    try {
      $(el).attr("src", new URL($(el).attr("src")!, `${PG_BASE}/`).toString());
    } catch {
      /* leave as-is */
    }
  });

  let inner = cell.html() ?? "";

  // Convert PG's <br><br> paragraph separators into real <p> elements —
  // but never inside <pre>/<ul>/<ol>/<table>/<blockquote> blocks.
  const protectedRe = /(<(?:pre|ul|ol|table|blockquote)\b[\s\S]*?<\/(?:pre|ul|ol|table|blockquote)>)/gi;
  inner = inner
    .split(protectedRe)
    .map((chunk, i) => {
      if (i % 2 === 1) return chunk; // protected block, untouched
      let c = chunk.replace(/(?:\s|&nbsp;|<br\s*\/?>)*<br\s*\/?>(?:\s|&nbsp;|<br\s*\/?>)+/gi, "</p><p>");
      return c;
    })
    .join("");
  inner = `<p>${inner}</p>`;

  // Re-parse to normalize and tidy up.
  const $$ = cheerio.load(`<div id="wrap">${inner}</div>`, null, false);
  const wrap = $$("#wrap");

  // Remove empty paragraphs.
  wrap.find("p").each((_, el) => {
    const p = $$(el);
    if (p.text().replace(/ /g, "").trim() === "" && p.find("img, pre, table").length === 0) {
      p.remove();
    }
  });

  // Remove the leading date paragraph (we render our own from the catalog).
  const firstP = wrap.find("p").first();
  if (MONTH_LINE.test(firstP.text().trim())) firstP.remove();

  // Remove trailing paragraphs that are only navigation links.
  wrap
    .find("p")
    .get()
    .reverse()
    .forEach((el) => {
      const p = $$(el);
      const text = p.text().trim();
      const hrefs = p
        .find("a")
        .get()
      .map((a) => $$(a).attr("href") ?? "");
      const onlyNavLinks =
        text.length < 60 &&
        hrefs.length > 0 &&
        hrefs.every((h) => /paulgraham\.com\/(index|articles)\.html$/.test(h));
      if (text === "" || onlyNavLinks) p.remove();
    });

  return wrap.html()?.trim() || null;
}

// ---------------------------------------------------------------------------
// Book assembly
// ---------------------------------------------------------------------------
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildBookHtml(catalog: Catalog, bodies: Map<string, string>): string {
  const today = new Date().toISOString().slice(0, 10);
  const included = catalog.parts
    .map((p) => ({ ...p, essays: p.essays.filter((e) => bodies.has(e.slug)) }))
    .filter((p) => p.essays.length > 0);
  const count = included.reduce((n, p) => n + p.essays.length, 0);

  const toc = included
    .map(
      (p) => `
    <div class="toc-part">
      <p class="toc-part-title"><a href="#part-${p.id}">Part ${p.number}: ${escapeHtml(p.title)}</a></p>
      <ol>
        ${p.essays.map((e) => `<li><a href="#${e.slug}">${escapeHtml(e.title)}</a></li>`).join("\n        ")}
      </ol>
    </div>`,
    )
    .join("\n");

  const partsHtml = included
    .map((p) => {
      const essays = p.essays
        .map((e) => {
          const body = bodies.get(e.slug)!;
          return `
      <section class="essay">
        <h2 class="essay-title" id="${e.slug}">${escapeHtml(e.title)}</h2>
        ${e.date ? `<p class="essay-date">${escapeHtml(e.date)}</p>` : ""}
        ${body}
        <p class="essay-source">Original: <a href="${e.url}">${e.url}</a></p>
      </section>`;
        })
        .join("\n");
      return `
    <section class="part">
      <h1 class="part-title" id="part-${p.id}">Part ${p.number}: ${escapeHtml(p.title)}</h1>
      <p class="part-subtitle">${escapeHtml(p.subtitle)}</p>
      ${essays}
    </section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${BOOK_TITLE}: ${BOOK_SUBTITLE}</title>
<style>
  body { font-family: Georgia, "Iowan Old Style", "Palatino Linotype", serif; line-height: 1.6;
         max-width: 42em; margin: 0 auto; padding: 2em 1.2em; color: #1a1a1a; }
  a { color: #1e4d8c; }
  img { max-width: 100%; height: auto; }
  pre { overflow-x: auto; font-size: 0.85em; background: #f5f3ef; padding: 0.8em; }
  .title-page { text-align: center; padding: 5em 0 3em; page-break-after: always; }
  .title-page h1 { font-size: 2.6em; margin: 0 0 0.3em; }
  .title-page .subtitle { font-size: 1.2em; color: #444; }
  .title-page .meta { margin-top: 3em; color: #777; font-size: 0.9em; }
  .attribution { font-size: 0.92em; color: #333; page-break-after: always; padding-top: 2em; }
  .toc { page-break-after: always; }
  .toc-part-title { font-weight: bold; margin-bottom: 0.2em; }
  .toc-part ol { margin-top: 0.2em; }
  .toc-part li { margin: 0.1em 0; font-size: 0.95em; }
  h1.part-title { page-break-before: always; font-size: 1.9em; margin-bottom: 0; }
  .part-subtitle { color: #666; font-style: italic; margin-top: 0.3em; }
  h2.essay-title { page-break-before: always; font-size: 1.5em; margin-bottom: 0.1em; }
  .essay-date { color: #777; font-style: italic; margin-top: 0; }
  .essay-source { font-size: 0.8em; color: #888; margin-top: 2em; }
  @page { margin: 2.2cm; }
</style>
</head>
<body>
  <div class="title-page">
    <h1>${BOOK_TITLE}</h1>
    <p class="subtitle">${BOOK_SUBTITLE}</p>
    <p class="meta">${count} essays &middot; compiled ${today} &middot; grahamanack.com</p>
  </div>

  <div class="attribution">
    <p><strong>All essays are &copy; Paul Graham.</strong> The canonical versions live at
    <a href="${PG_BASE}/articles.html">paulgraham.com</a>, where each essay in this book links
    back to its original page.</p>
    <p>This is an unofficial, fan-made compilation for personal reading. It is not affiliated
    with or endorsed by Paul Graham. If you are the rights holder and would like this compilation
    taken down, contact grahamanack.com and it will be removed promptly.</p>
    <p>Inspired by Eric Jorgenson&rsquo;s <em>Navalmanack</em>.</p>
  </div>

  <div class="toc">
    <h1>Contents</h1>
    ${toc}
  </div>

  ${partsHtml}
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Conversion tools
// ---------------------------------------------------------------------------
function which(cmd: string): string | null {
  try {
    return execFileSync("sh", ["-c", `command -v ${cmd}`], { encoding: "utf8" }).trim() || null;
  } catch {
    return null;
  }
}

function run(cmd: string, args: string[], label: string) {
  console.log(`  $ ${cmd} ${args.map((a) => (a.includes(" ") ? `"${a}"` : a)).join(" ")}`.slice(0, 140));
  execFileSync(cmd, args, { stdio: ["ignore", "pipe", "inherit"] });
  console.log(`  ✓ ${label}`);
}

async function sizeOf(p: string): Promise<string> {
  const s = await fs.stat(p);
  return s.size > 1024 * 1024 ? `${(s.size / 1024 / 1024).toFixed(1)} MB` : `${Math.round(s.size / 1024)} KB`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const catalog = JSON.parse(await fs.readFile(path.join(ROOT, "data", "catalog.json"), "utf8")) as Catalog;

  let essays = catalog.parts.flatMap((p) => p.essays);
  if (ONLY) essays = essays.filter((e) => ONLY.includes(e.slug));
  if (LIMIT) essays = essays.slice(0, LIMIT);
  console.log(`Building ebook from ${essays.length} of ${catalog.essayCount} essays…`);

  const bodies = new Map<string, string>();
  const failed: string[] = [];
  for (let i = 0; i < essays.length; i++) {
    const e = essays[i]!;
    process.stdout.write(`\r[${i + 1}/${essays.length}] ${e.slug}`.padEnd(60));
    try {
      const html = await fetchEssayHtml(e.slug, e.url);
      const body = extractEssayHtml(html, e.slug, e.title);
      if (body && body.length > 200) bodies.set(e.slug, body);
      else throw new Error("extraction too small");
    } catch (err) {
      failed.push(e.slug);
      process.stdout.write(`\n  ! failed: ${e.slug} (${(err as Error).message})\n`);
    }
  }
  console.log(`\nExtracted ${bodies.size} essays${failed.length ? `, ${failed.length} failed: ${failed.join(", ")}` : ""}.`);

  await fs.mkdir(OUT_DIR, { recursive: true });
  const htmlPath = path.join(OUT_DIR, "grahamanack.html");
  await fs.writeFile(htmlPath, buildBookHtml(catalog, bodies));
  console.log(`Wrote ${path.relative(ROOT, htmlPath)} (${await sizeOf(htmlPath)})`);

  if (HTML_ONLY) {
    console.log("--html-only: skipping epub/pdf/mobi conversion.");
    return;
  }

  const epubPath = path.join(OUT_DIR, "grahamanack.epub");
  const pdfPath = path.join(OUT_DIR, "grahamanack.pdf");
  const mobiPath = path.join(OUT_DIR, "grahamanack.mobi");

  const pandoc = which("pandoc");
  if (pandoc) {
    run(
      pandoc,
      [
        htmlPath, "-f", "html", "-t", "epub3", "-o", epubPath,
        "--metadata", `title=${BOOK_TITLE}: ${BOOK_SUBTITLE}`,
        "--metadata", "author=Paul Graham",
        "--metadata", "lang=en-US",
        "--metadata", "publisher=grahamanack.com (unofficial)",
        "--toc", "--toc-depth=2", "--epub-chapter-level=2",
      ],
      "grahamanack.epub",
    );
  } else {
    console.warn("  ! pandoc not found — skipping EPUB. Install: brew install pandoc");
  }

  const chrome = existsSync(CHROME_PATH) ? CHROME_PATH : which("chrome") ?? which("google-chrome");
  if (chrome) {
    run(
      chrome,
      [
        "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
        "--virtual-time-budget=60000",
        `--print-to-pdf=${pdfPath}`,
        `file://${htmlPath}`,
      ],
      "grahamanack.pdf",
    );
  } else {
    console.warn("  ! Google Chrome not found — skipping PDF.");
  }

  const ebookConvert = existsSync(CALIBRE_PATH) ? CALIBRE_PATH : which("ebook-convert");
  if (ebookConvert && existsSync(epubPath)) {
    run(ebookConvert, [epubPath, mobiPath], "grahamanack.mobi");
  } else if (!ebookConvert) {
    console.warn("  ! calibre not found — skipping MOBI. Install: brew install --cask calibre");
  }

  console.log("\nDone:");
  for (const f of [htmlPath, epubPath, pdfPath, mobiPath]) {
    if (existsSync(f)) console.log(`  ${path.relative(ROOT, f)}  ${await sizeOf(f)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
