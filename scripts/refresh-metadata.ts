#!/usr/bin/env tsx
/**
 * Refreshes data/catalog.json from paulgraham.com/articles.html.
 * Fetches each essay page only to read <title> and publish date — never stores body text.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT, "data");
const PG_BASE = "https://paulgraham.com";
const ARTICLES_URL = `${PG_BASE}/articles.html`;

const STARTER_SLUGS = [
  "greatwork",
  "kids",
  "selfindulgence",
  "do",
  "wealth",
  "essay",
  "makersschedule",
  "startupideas",
  "love",
  "think",
];

const MONTHS =
  /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/i;

type PartDef = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  slugs: string[];
};

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "GrahamanackMetadata/1.0 (links-only reading guide)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function slugFromHref(href: string): string {
  return href.replace(/\.html$/i, "").split("?")[0]!.split("#")[0]!;
}

function extractArticleLinks(html: string): { slug: string; title: string }[] {
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const items: { slug: string; title: string }[] = [];
  $('a[href$=".html"]').each((_, el) => {
    const href = $(el).attr("href");
    if (!href || href.includes("://") || href.startsWith("#")) return;
    if (
      ["index.html", "articles.html", "books.html", "bio.html", "faq.html", "raq.html", "quo.html", "rss.html"].includes(
        href,
      )
    )
      return;
    const slug = slugFromHref(href);
    if (seen.has(slug)) return;
    seen.add(slug);
    const title = $(el).text().replace(/\s+/g, " ").trim();
    if (title) items.push({ slug, title });
  });
  return items;
}

function extractDateAndTitle(html: string): { title: string; date: string | null } {
  const $ = cheerio.load(html);
  const title = $("title").first().text().trim();
  const text = $("td[width='435'], td[width='374']").first().text() || $("body").text();
  const m = text.match(
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i,
  );
  const date = m && MONTHS.test(m[0].trim()) ? m[0].trim() : m ? m[0] : null;
  return { title, date };
}

function parseDate(date: string | null): number {
  if (!date) return Number.MAX_SAFE_INTEGER;
  const t = new Date(date).getTime();
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

function assignPart(slug: string, title: string): string {
  const text = `${slug} ${title}`.toLowerCase();
  if (/startup|founder|invest|fund|vc|angel|airbnb|viaweb|ycombinator|growth|schlep|hub|ramen|scale/.test(text))
    return "startups";
  if (/wealth|rich|money|work|tax|earn|procrastin|schedule|maker|billion|inequality|superlinear/.test(text))
    return "wealth";
  if (/lisp|hacker|program|software|java|python|spam|arc|language|code|nerd|design|filter/.test(text))
    return "programming";
  if (/essay|write|talk|word|idea|think|read|philosophy|her esy|taste|smart/.test(text)) return "writing";
  return "life";
}

async function loadOrInitParts(): Promise<PartDef[]> {
  const partsPath = path.join(DATA_DIR, "parts.json");
  try {
    const raw = JSON.parse(await fs.readFile(partsPath, "utf8")) as { parts: PartDef[] };
    return raw.parts;
  } catch {
    return [
      { id: "startups", number: "I", title: "Startups", subtitle: "Founding, funding, and growing companies", slugs: [] },
      { id: "wealth", number: "II", title: "Wealth and Work", subtitle: "Making money, working hard, and choosing what to do", slugs: [] },
      { id: "programming", number: "III", title: "Programming and Technology", subtitle: "Languages, hackers, and building software", slugs: [] },
      { id: "writing", number: "IV", title: "Writing and Thinking", subtitle: "Essays, ideas, and how to think clearly", slugs: [] },
      { id: "life", number: "V", title: "Life and Society", subtitle: "Culture, education, and how to live", slugs: [] },
    ];
  }
}

async function main() {
  console.log("Fetching articles index…");
  const indexHtml = await fetchText(ARTICLES_URL);
  const list = extractArticleLinks(indexHtml);
  console.log(`Found ${list.length} essays`);

  const essays: {
    slug: string;
    title: string;
    date: string | null;
    url: string;
    partId: string;
  }[] = [];

  for (let i = 0; i < list.length; i++) {
    const { slug, title: listTitle } = list[i]!;
    const url = `${PG_BASE}/${slug}.html`;
    process.stdout.write(`\r[${i + 1}/${list.length}] ${slug}`.padEnd(50));
    try {
      const html = await fetchText(url);
      const meta = extractDateAndTitle(html);
      essays.push({
        slug,
        title: meta.title || listTitle,
        date: meta.date,
        url,
        partId: assignPart(slug, meta.title || listTitle),
      });
    } catch {
      essays.push({ slug, title: listTitle, date: null, url, partId: assignPart(slug, listTitle) });
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  console.log("\nAssigning parts…");

  let parts = await loadOrInitParts();
  const existingSlugs = new Set(parts.flatMap((p) => p.slugs));
  for (const e of essays) {
    if (!existingSlugs.has(e.slug)) {
      const part = parts.find((p) => p.id === e.partId)!;
      part.slugs.push(e.slug);
      existingSlugs.add(e.slug);
    }
  }
  for (const part of parts) {
    const bySlug = new Map(essays.map((e) => [e.slug, e]));
    part.slugs = part.slugs.filter((s) => bySlug.has(s));
    part.slugs.sort(
      (a, b) =>
        parseDate(bySlug.get(a)!.date) - parseDate(bySlug.get(b)!.date) ||
        bySlug.get(a)!.title.localeCompare(bySlug.get(b)!.title),
    );
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, "parts.json"), JSON.stringify({ parts }, null, 2) + "\n");

  const partMeta = new Map(parts.map((p) => [p.id, p]));
  const catalogParts = parts.map((p) => ({
    id: p.id,
    number: p.number,
    title: p.title,
    subtitle: p.subtitle,
    essays: p.slugs.map((slug) => {
      const e = essays.find((x) => x.slug === slug)!;
      const pm = partMeta.get(p.id)!;
      return {
        slug: e.slug,
        title: e.title,
        date: e.date,
        url: e.url,
        partId: p.id,
        partNumber: pm.number,
        partTitle: pm.title,
      };
    }),
  }));

  const byDate = [...essays]
    .sort(
      (a, b) =>
        parseDate(a.date) - parseDate(b.date) || a.title.localeCompare(b.title),
    )
    .map((e) => {
      const p = partMeta.get(e.partId)!;
      return {
        slug: e.slug,
        title: e.title,
        date: e.date,
        url: e.url,
        partId: e.partId,
        partNumber: p.number,
        partTitle: p.title,
      };
    });

  const catalog = {
    generatedAt: new Date().toISOString(),
    siteTitle: "The Grahamanack",
    domain: "grahamanack.com",
    essayCount: essays.length,
    starterSlugs: STARTER_SLUGS.filter((s) => essays.some((e) => e.slug === s)),
    parts: catalogParts,
    byDate,
  };

  await fs.writeFile(path.join(DATA_DIR, "catalog.json"), JSON.stringify(catalog, null, 2) + "\n");
  console.log(`Wrote data/catalog.json (${catalog.essayCount} essays).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
