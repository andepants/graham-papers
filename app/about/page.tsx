import Link from "next/link";
import { CATALOG, DISCLAIMERS } from "@/lib/catalog";
import { siteMetadata } from "@/lib/metadata";

export const metadata = siteMetadata({
  title: "About | The Grahamanack",
});

export default function AboutPage() {
  return (
    <div className="container section page-prose">
      <h1>About The Grahamanack</h1>
      <p>
        <strong>The Grahamanack</strong> is an unofficial, fan-made reading guide to Paul
        Graham&apos;s essays. It is inspired by Eric Jorgenson&apos;s{" "}
        <a href="https://www.navalmanack.com">Navalmanack</a> (a clear path through a large
        body of work), with an unofficial ebook compilation for offline reading.
      </p>
      <h2>What this is</h2>
      <ul>
        <li>{CATALOG.essayCount} essays indexed by theme and date</li>
        <li>Every link goes to the original on paulgraham.com</li>
        <li>A free ebook download (PDF, EPUB, MOBI) compiled from those essays</li>
        <li>Free, non-commercial, no ads or email capture</li>
      </ul>
      <h2>What this is not</h2>
      <ul>
        <li>{DISCLAIMERS.unofficial}</li>
        <li>{DISCLAIMERS.copyright}</li>
        <li>
          Not for redistribution. If you are the rights holder and want the downloads removed,
          they will be taken down promptly.
        </li>
      </ul>
      <h2>Updating the index</h2>
      <p className="muted">
        Maintainers can run <code>npm run refresh-metadata</code> to pull titles and dates from
        paulgraham.com&apos;s articles page (no essay bodies stored).
      </p>
      <p>
        <Link href="/table-of-contents" className="btn btn-primary">
          Browse the essays
        </Link>
      </p>
    </div>
  );
}
