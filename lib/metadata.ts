import type { Metadata } from "next";

export function siteMetadata(overrides?: Partial<Metadata>): Metadata {
  const title = overrides?.title ?? "The Grahamanack";
  const description =
    (typeof overrides?.description === "string" ? overrides.description : undefined) ??
    "An unofficial reading guide to Paul Graham's essays on paulgraham.com, with a themed index and a chronological list.";

  return {
    title,
    description,
    metadataBase: new URL("https://grahamanack.com"),
    openGraph: {
      title: String(title),
      description,
      siteName: "The Grahamanack",
      type: "website",
    },
    ...overrides,
  };
}
