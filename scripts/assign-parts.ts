#!/usr/bin/env tsx
/**
 * Ensures every fetched essay appears in exactly one part in data/parts.json.
 * Preserves manual assignments; auto-assigns new essays by keyword rules.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { CONTENT_DIR, DATA_DIR } from "./lib/paths.ts";

type PartDef = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  slugs: string[];
};

type PartsFile = { parts: PartDef[] };

const STARTUP_KW =
  /\b(startup|founder|y combinator|yc|investor|venture|fundraising|angel|vc|airbnb|viaweb|silicon valley|hub|ramen|scale|growth|pitch|corp dev|equity|valuation|default alive|schlep|nintendo|tablet|segway|visa|twitter is a big deal)\b/i;
const WEALTH_KW =
  /\b(wealth|rich|money|work hard|procrastinat|do what you love|earn|tax|inequality|billion|million|default dead|schedule|maker|manager|expert|stubborn|superlinear|returns)\b/i;
const PROG_KW =
  /\b(lisp|hacker|program|software|java|python|arc|spam|bayesian|language|code|ansi common|bottom-up|beating the average|web-based|succinct|object-oriented|design and research|filters|nerds|revenge of the nerds|great hackers|100-year|word \"hacker\"|if lisp|roots of lisp|plan for spam)\b/i;
const WRITING_KW =
  /\b(essay|write|writing|talk|words|ideas|think|philosophy|her esy|taste|smart|read|novelty|noob|usefully|simply|good writing|shape of the essay field|best essay|putting ideas)\b/i;

function scorePart(slug: string, title: string, body: string): string {
  const text = `${slug} ${title} ${body.slice(0, 500)}`;
  const scores: Record<string, number> = {
    startups: 0,
    wealth: 0,
    programming: 0,
    writing: 0,
    life: 0,
  };
  if (STARTUP_KW.test(text)) scores.startups! += 3;
  if (WEALTH_KW.test(text)) scores.wealth! += 3;
  if (PROG_KW.test(text)) scores.programming! += 3;
  if (WRITING_KW.test(text)) scores.writing! += 3;

  const lifeKw =
    /\b(kids|life is short|lies we tell|high school|university|college|inequality|wokeness|death penalty|nft|coronavirus|fashion|charisma|popular|her o|society|city|cities|ambition|good|be good|disagree|boss|troll|philosophy|undergrad|education|brand age|reddit)\b/i;
  if (lifeKw.test(text)) scores.life! += 2;

  if (/^(startup|founder|invest|fund|vc|angel|ycombinator|airbnb|viaweb)/i.test(slug))
    scores.startups! += 2;
  if (/^(wealth|rich|money|tax|earn|work|schedule|procrast|love)/i.test(slug))
    scores.wealth! += 2;
  if (/^(lisp|java|python|spam|arc|hacker|program|design|filter|nerd|code|lang)/i.test(slug))
    scores.programming! += 2;
  if (/^(essay|write|talk|idea|think|read|word|useful|simply)/i.test(slug))
    scores.writing! += 2;

  let best = "life";
  let bestScore = -1;
  for (const [id, s] of Object.entries(scores)) {
    if (s > bestScore) {
      bestScore = s;
      best = id;
    }
  }
  if (bestScore === 0) {
    if (slug.includes("startup") || slug.includes("founder")) return "startups";
    if (slug.includes("lisp") || slug.includes("hacker")) return "programming";
    return "writing";
  }
  return best;
}

function parseDate(date: string | null): number {
  if (!date) return Number.MAX_SAFE_INTEGER;
  const t = new Date(date).getTime();
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

async function main() {
  const partsPath = path.join(DATA_DIR, "parts.json");
  let partsFile: PartsFile;
  try {
    partsFile = JSON.parse(await fs.readFile(partsPath, "utf8"));
  } catch {
    const template = JSON.parse(
      await fs.readFile(path.join(DATA_DIR, "parts.schema.json"), "utf8"),
    );
    partsFile = {
      parts: template.parts.map((p: Omit<PartDef, "slugs">) => ({ ...p, slugs: [] })),
    };
  }

  const assigned = new Set<string>();
  for (const part of partsFile.parts) {
    part.slugs = part.slugs ?? [];
    for (const s of part.slugs) assigned.add(s);
  }

  const files = (await fs.readdir(CONTENT_DIR)).filter((f) => f.endsWith(".md"));
  const slugs = files.map((f) => f.replace(/\.md$/, ""));

  for (const slug of slugs) {
    if (assigned.has(slug)) continue;
    const raw = await fs.readFile(path.join(CONTENT_DIR, `${slug}.md`), "utf8");
    const titleMatch = raw.match(/^title:\s*(.+)$/m);
    const title = titleMatch
      ? JSON.parse(titleMatch[1]!.startsWith('"') ? titleMatch[1]! : `"${titleMatch[1]}"`)
      : slug;
    const body = raw.replace(/^---[\s\S]*?---\n/, "");
    const partId = scorePart(slug, title, body);
    const part = partsFile.parts.find((p) => p.id === partId)!;
    part.slugs.push(slug);
    assigned.add(slug);
  }

  for (const part of partsFile.parts) {
    const withDates: { slug: string; t: number; title: string }[] = [];
    for (const slug of part.slugs) {
      const raw = await fs.readFile(path.join(CONTENT_DIR, `${slug}.md`), "utf8");
      const dateMatch = raw.match(/^date:\s*(.+)$/m);
      let date: string | null = null;
      if (dateMatch && dateMatch[1] !== "null") {
        date = JSON.parse(
          dateMatch[1]!.startsWith('"') ? dateMatch[1]! : `"${dateMatch[1]}"`,
        );
      }
      const titleMatch = raw.match(/^title:\s*(.+)$/m);
      const title = titleMatch
        ? JSON.parse(
            titleMatch[1]!.startsWith('"') ? titleMatch[1]! : `"${titleMatch[1]}"`,
          )
        : slug;
      withDates.push({ slug, t: parseDate(date), title });
    }
    withDates.sort((a, b) => a.t - b.t || a.title.localeCompare(b.title));
    part.slugs = withDates.map((x) => x.slug);
  }

  const allSlugs = new Set(slugs);
  for (const part of partsFile.parts) {
    for (const s of part.slugs) {
      if (!allSlugs.has(s)) {
        console.warn(`Warning: parts.json lists missing essay ${s}`);
      }
    }
  }
  if (assigned.size !== slugs.length) {
    console.warn(`Assignment count mismatch: ${assigned.size} vs ${slugs.length}`);
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(partsPath, JSON.stringify(partsFile, null, 2) + "\n");
  console.log(`Updated ${partsPath} (${slugs.length} essays across ${partsFile.parts.length} parts).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
