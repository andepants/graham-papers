#!/usr/bin/env tsx
/**
 * Fetches every essay linked from paulgraham.com/articles.html,
 * extracts body text, and writes Markdown with YAML front matter.
 */
import fs from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";
import {
  absolutizeLinks,
  htmlFragmentToMarkdown,
} from "./lib/html-to-markdown.ts";
import {
  ARTICLES_URL,
  CONTENT_DIR,
  PG_BASE,
} from "./lib/paths.ts";

const MONTHS =
  /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/i;

type FetchIssue = { slug: string; issue: string };

function slugFromHref(href: string): string {
  const clean = href.split("?")[0]!.split("#")[0]!;
  return clean.replace(/\.html$/i, "").replace(/^\//, "");
}

function parseDate(text: string): string | null {
  const line = text.trim();
  if (MONTHS.test(line)) return line;
  const m = line.match(
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i,
  );
  if (m) return `${m[1]} ${m[2]}`;
  return null;
}

function dateSortKey(date: string | null): number {
  if (!date) return 99999999;
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? 99999999 : d.getTime();
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "GrahamanackBot/1.0 (unofficial fan compilation)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function extractEssayList(html: string): { slug: string; title: string }[] {
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const items: { slug: string; title: string }[] = [];

  $('a[href$=".html"]').each((_, el) => {
    const href = $(el).attr("href");
    if (!href || href.includes("://") || href.startsWith("#")) return;
    if (
      [
        "index.html",
        "articles.html",
        "books.html",
        "bio.html",
        "faq.html",
        "raq.html",
        "quo.html",
        "rss.html",
      ].includes(href)
    )
      return;
    const slug = slugFromHref(href);
    if (seen.has(slug)) return;
    seen.add(slug);
    const title = $(el).text().replace(/\s+/g, " ").trim();
    if (!title) return;
    items.push({ slug, title });
  });

  return items;
}

function extractEssayBody(
  html: string,
  pageUrl: string,
): { title: string; date: string | null; markdown: string; warnings: string[] } {
  const $ = cheerio.load(html);
  const warnings: string[] = [];
  const title = $("title").first().text().trim() || "Untitled";

  $("script, style, map, noscript").remove();

  let contentTd = $("td[width='435']").first();
  if (!contentTd.length) {
    contentTd = $("table[width='435'] td").first();
  }
  if (!contentTd.length) {
    contentTd = $("td[width='374']").first();
  }
  if (!contentTd.length) {
    let best: cheerio.Cheerio<any> | null = null;
    let bestLen = 0;
    $("td").each((_, td) => {
      const len = $(td).text().replace(/\s+/g, " ").trim().length;
      if (len > bestLen) {
        bestLen = len;
        best = $(td);
      }
    });
    if (best && bestLen > 400) contentTd = best;
  }
  if (!contentTd.length) {
    warnings.push("missing main content cell");
    return { title, date: null, markdown: "", warnings };
  }

  const clone = contentTd.clone();
  clone.find("img[alt]").each((_, img) => {
    const alt = $(img).attr("alt")?.trim();
    if (alt && alt.length > 2 && !alt.match(/^(Essays|The Age)/)) {
      $(img).replaceWith(`<h1>${alt}</h1>`);
    }
  });
  clone.find("img").each((_, img) => {
    $(img).remove();
  });
  clone.find("table").each((_, table) => {
    const t = $(table).text().toLowerCase();
    if (
      t.includes("if you liked this") ||
      t.includes("translation") ||
      t.includes("japanese translation")
    ) {
      $(table).remove();
      return;
    }
    const text = $(table).text().replace(/\s+/g, " ").trim();
    if (text.length > 0) {
      $(table).replaceWith(`<p>${text}</p>`);
    } else {
      $(table).remove();
    }
  });
  clone.find("hr").remove();
  clone.find("font").each((_, font) => {
    const $font = $(font);
    const inner = $font.html();
    if (inner != null && $font.parent().length) {
      $font.replaceWith(inner);
    }
  });

  let rawText = clone.text().replace(/\s+/g, " ");
  let date: string | null = null;
  const dateMatch = rawText.match(
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i,
  );
  if (dateMatch) date = parseDate(dateMatch[0]);

  clone.find("br").replaceWith("\n\n");
  clone.find("b").each((_, b) => {
    const t = $(b).text().trim();
    if (t.length < 80 && !t.includes(".")) {
      $(b).replaceWith(`<h2>${t}</h2>`);
    }
  });

  let innerHtml = clone.html() ?? "";
  innerHtml = absolutizeLinks(innerHtml, pageUrl);

  const markdown = htmlFragmentToMarkdown(innerHtml);

  if (/\[[0-9]+\]/.test(markdown) && !/^\[[0-9]+\]/m.test(markdown)) {
    // footnote markers inline are ok
  }
  if (markdown.includes("![](")) warnings.push("empty image alt");
  if (markdown.length < 200) warnings.push("very short body");

  return { title, date, markdown, warnings };
}

async function main() {
  console.log("Fetching articles index…");
  const indexHtml = await fetchText(ARTICLES_URL);
  let list = extractEssayList(indexHtml);
  const onlySlug = process.env.SLUG;
  if (onlySlug) list = list.filter((x) => x.slug === onlySlug);
  console.log(`Found ${list.length} essays on articles.html`);

  await fs.mkdir(CONTENT_DIR, { recursive: true });
  const issues: FetchIssue[] = [];
  const meta: Record<
    string,
    { title: string; date: string | null; url: string; warnings: string[] }
  > = {};

  for (let i = 0; i < list.length; i++) {
    const { slug, title: listTitle } = list[i]!;
    const url = `${PG_BASE}/${slug}.html`;
    process.stdout.write(`\r[${i + 1}/${list.length}] ${slug}`.padEnd(60));
    try {
      const html = await fetchText(url);
      const extracted = extractEssayBody(html, url);
      const title = extracted.title || listTitle;
      const frontmatter = {
        title,
        slug,
        date: extracted.date,
        url,
        listTitle,
      };
      const file = `---\ntitle: ${JSON.stringify(title)}\nslug: ${JSON.stringify(slug)}\ndate: ${extracted.date ? JSON.stringify(extracted.date) : "null"}\nurl: ${JSON.stringify(url)}\n---\n\n${extracted.markdown}\n`;
      await fs.writeFile(path.join(CONTENT_DIR, `${slug}.md`), file, "utf8");
      meta[slug] = {
        title,
        date: extracted.date,
        url,
        warnings: extracted.warnings,
      };
      for (const w of extracted.warnings) {
        issues.push({ slug, issue: w });
      }
    } catch (e) {
      issues.push({
        slug,
        issue: e instanceof Error ? e.message : String(e),
      });
    }
    await new Promise((r) => setTimeout(r, 120));
  }

  console.log("\nWriting fetch report…");
  const report = {
    fetchedAt: new Date().toISOString(),
    count: Object.keys(meta).length,
    issues,
    essays: Object.entries(meta)
      .map(([slug, m]) => ({ slug, ...m }))
      .sort((a, b) => dateSortKey(a.date) - dateSortKey(b.date)),
  };
  await fs.mkdir(path.join(CONTENT_DIR, ".."), { recursive: true });
  await fs.writeFile(
    path.join(CONTENT_DIR, "../fetch-report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(`Done. ${report.count} essays saved. ${issues.length} issue(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
