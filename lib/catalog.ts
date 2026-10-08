import catalog from "@/data/catalog.json";

export type EssayLink = {
  slug: string;
  title: string;
  date: string | null;
  url: string;
  partId: string;
  partNumber: string;
  partTitle: string;
};

export type PartSection = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  essays: EssayLink[];
};

export const CATALOG = catalog as {
  generatedAt: string;
  siteTitle: string;
  domain: string;
  essayCount: number;
  starterSlugs: string[];
  parts: PartSection[];
  byDate: EssayLink[];
};

export const DISCLAIMERS = {
  unofficial:
    "The Grahamanack is an unofficial, fan-made reading guide. It is not affiliated with or endorsed by Paul Graham.",
  copyright:
    "All essays are © Paul Graham. The ebook is an unofficial compilation for personal reading. The canonical versions live at paulgraham.com.",
  inspiration:
    "Inspired by Eric Jorgenson's Navalmanack as a way to navigate a body of writing, without republishing it.",
};

export function writingYears(): { first: number; last: number } {
  const years = CATALOG.byDate
    .map((e) => Number(e.date?.match(/\d{4}/)?.[0]))
    .filter((y) => Number.isFinite(y) && y > 0);
  return { first: Math.min(...years), last: Math.max(...years) };
}

export function starterEssays(): EssayLink[] {
  const bySlug = new Map(CATALOG.byDate.map((e) => [e.slug, e]));
  return CATALOG.starterSlugs.map((s) => bySlug.get(s)).filter(Boolean) as EssayLink[];
}
