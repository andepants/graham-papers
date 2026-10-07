#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { CONTENT_DIR, DATA_DIR, GENERATED_DIR } from "./lib/paths.ts";

export type EssayMeta = {
  slug: string;
  title: string;
  date: string | null;
  url: string;
  partId: string;
  partTitle: string;
  partNumber: string;
  bookIndex: number;
};

export type PartMeta = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  essays: EssayMeta[];
};

export type SiteData = {
  generatedAt: string;
  bookTitle: string;
  siteTitle: string;
  domain: string;
  essayCount: number;
  parts: PartMeta[];
  byDate: EssayMeta[];
  bookOrder: EssayMeta[];
};

function parseDateKey(date: string | null): number {
  if (!date) return Number.MAX_SAFE_INTEGER;
  const t = new Date(date).getTime();
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

async function main() {
  const partsFile = JSON.parse(
    await fs.readFile(path.join(DATA_DIR, "parts.json"), "utf8"),
  ) as {
    parts: {
      id: string;
      number: string;
      title: string;
      subtitle: string;
      slugs: string[];
    }[];
  };

  const slugToPart = new Map<string, (typeof partsFile.parts)[0]>();
  for (const part of partsFile.parts) {
    for (const slug of part.slugs) {
      if (slugToPart.has(slug)) {
        throw new Error(`Duplicate assignment for ${slug}`);
      }
      slugToPart.set(slug, part);
    }
  }

  const files = (await fs.readdir(CONTENT_DIR)).filter((f) => f.endsWith(".md"));
  const allEssays: EssayMeta[] = [];
  let bookIndex = 0;

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const raw = await fs.readFile(path.join(CONTENT_DIR, file), "utf8");
    const { data } = matter(raw);
    const part = slugToPart.get(slug);
    if (!part) {
      throw new Error(`Essay ${slug} not assigned to any part. Run npm run assign-parts.`);
    }
    allEssays.push({
      slug,
      title: String(data.title ?? slug),
      date: data.date ?? null,
      url: String(data.url ?? `https://paulgraham.com/${slug}.html`),
      partId: part.id,
      partTitle: part.title,
      partNumber: part.number,
      bookIndex: -1,
    });
  }

  const parts: PartMeta[] = partsFile.parts.map((p) => {
    const essays = allEssays
      .filter((e) => e.partId === p.id)
      .sort(
        (a, b) =>
          parseDateKey(a.date) - parseDateKey(b.date) ||
          a.title.localeCompare(b.title),
      )
      .map((e) => ({ ...e, bookIndex: bookIndex++ }));
    return {
      id: p.id,
      number: p.number,
      title: p.title,
      subtitle: p.subtitle,
      essays,
    };
  });

  const bookOrder = parts.flatMap((p) => p.essays);
  const byDate = [...allEssays].sort(
    (a, b) =>
      parseDateKey(a.date) - parseDateKey(b.date) || a.title.localeCompare(b.title),
  );

  const siteData: SiteData = {
    generatedAt: new Date().toISOString(),
    bookTitle: "The Grahamanack",
    siteTitle: "The Grahamanack",
    domain: "grahamanack.com",
    essayCount: allEssays.length,
    parts,
    byDate,
    bookOrder,
  };

  await fs.mkdir(GENERATED_DIR, { recursive: true });
  await fs.writeFile(
    path.join(GENERATED_DIR, "site-data.json"),
    JSON.stringify(siteData, null, 2),
  );

  console.log(
    `Generated site data: ${siteData.essayCount} essays, ${parts.length} parts.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
