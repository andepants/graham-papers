import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { getNeighbors, getEssay, SITE, type EssayMeta } from "./site";

const contentDir = path.join(process.cwd(), "content/essays");

export function getAllSlugs(): string[] {
  return fs.readdirSync(contentDir).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, ""));
}

export function getEssayDocument(slug: string): {
  meta: EssayMeta;
  content: string;
  url: string;
  date: string | null;
  title: string;
} | null {
  const file = path.join(contentDir, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const meta = getEssay(slug);
  if (!meta) return null;
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  return {
    meta,
    content,
    title: String(data.title ?? meta.title),
    date: (data.date as string | null) ?? meta.date,
    url: String(data.url ?? meta.url),
  };
}

export { getNeighbors, SITE, getEssay };
