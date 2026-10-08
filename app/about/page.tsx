import Link from "next/link";
import { CATALOG, DISCLAIMERS } from "@/lib/catalog";
import { siteMetadata } from "@/lib/metadata";

export const metadata = siteMetadata({
  title: "About — The Grahamanack",
});

export default function AboutPage() {
  return (
    <div className="container section">
      <h1>About The Grahamanack</h1>
      <p>
        <strong>The Grahamanack</strong> is an unofficial, fan-made reading guide to Paul
        Graham&apos;s essays. It is inspired by Eric Jorgenson&apos;s{" "}
        <a href="https://www.navalmanack.com">Navalmanack</a> — a clear path through a large
        body of work — but it does <em>not</em> republish any essay text.
      </p>
      <h2>What this is</h2>
      <ul>
        <li>{CATALOG.essayCount} essays indexed by theme and date</li>
        <li>Every link goes to the original on paulgraham.com</li>
        <li>Free, non-commercial, no ads or email capture</li>
      </ul>
      <h2>What this is not</h2>
      <ul>
        <li>{DISCLAIMERS.unofficial}</li>
        <li>Not a download site — no PDF, EPUB, or print files</li>
        <li>{DISCLAIMERS.copyright}</li>
      </ul>
      <h2>Updating the index</h2>
      <p className="muted">
        Maintainers can run <code>npm run refresh-metadata</code> to pull titles and dates from
        paulgraham.com&apos;s articles page (no essay bodies stored).
      </p>
      <p>
        <Link href="/table-of-contents">Browse the essays →</Link>
      </p>
    </div>
  );
}
