import type { Metadata } from "next";

export function siteMetadata(overrides?: Partial<Metadata>): Metadata {
  const title = overrides?.title ?? "The Grahamanack";
  const description =
    (typeof overrides?.description === "string" ? overrides.description : undefined) ??
    "An unofficial reading guide to Paul Graham's essays on paulgraham.com — themed index, no hosted text.";

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
