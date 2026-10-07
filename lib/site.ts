import siteData from "@/generated/site-data.json";

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

export const SITE = siteData as {
  generatedAt: string;
  bookTitle: string;
  siteTitle: string;
  domain: string;
  essayCount: number;
  parts: PartMeta[];
  byDate: EssayMeta[];
  bookOrder: EssayMeta[];
};

export function getEssay(slug: string): EssayMeta | undefined {
  return SITE.bookOrder.find((e) => e.slug === slug);
}

export function getNeighbors(slug: string): {
  prev: EssayMeta | null;
  next: EssayMeta | null;
} {
  const idx = SITE.bookOrder.findIndex((e) => e.slug === slug);
  if (idx < 0) return { prev: null, next: null };
  return {
    prev: idx > 0 ? SITE.bookOrder[idx - 1]! : null,
    next: idx < SITE.bookOrder.length - 1 ? SITE.bookOrder[idx + 1]! : null,
  };
}

export const DISCLAIMERS = {
  unofficial:
    "The Grahamanack is an unofficial, non-commercial fan compilation. It is not endorsed by or affiliated with Paul Graham.",
  copyright:
    "All essays are written by and copyright Paul Graham. Each essay links to its original on paulgraham.com.",
  free: "Free to read and download. Not for sale. No ads, payments, or email capture.",
};
