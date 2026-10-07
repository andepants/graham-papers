import type { Metadata } from "next";

const DEFAULT_DOMAIN = "grahamanack.com";

export function siteMetadata(overrides?: Partial<Metadata>): Metadata {
  const title = overrides?.title ?? "The Grahamanack";
  const description =
    (typeof overrides?.description === "string" ? overrides.description : undefined) ??
    "Paul Graham's essays collected for reading on the web and downloading as PDF, EPUB, and MOBI. Free, unofficial, non-commercial.";

  return {
    title,
    description,
    metadataBase: new URL(`https://${DEFAULT_DOMAIN}`),
    openGraph: {
      title: String(title),
      description,
      siteName: "The Grahamanack",
      type: "website",
    },
    ...overrides,
  };
}

export const DOWNLOADS = {
  pdf: "/downloads/grahamanack.pdf",
  epub: "/downloads/grahamanack.epub",
  mobi: "/downloads/grahamanack.mobi",
} as const;
