import Link from "next/link";
import { DISCLAIMERS, SITE } from "@/lib/site";
import { siteMetadata } from "@/lib/metadata";

export const metadata = siteMetadata({
  title: "About — The Grahamanack",
});

export default function AboutPage() {
  return (
    <div className="container section">
      <h1>About The Grahamanack</h1>
      <p>
        <strong>The Grahamanack</strong> (a play on{" "}
        <a href="https://www.navalmanack.com">Navalmanack</a>) is a free, unofficial,
        non-commercial site that collects Paul Graham&apos;s essays from{" "}
        <a href="https://paulgraham.com/articles.html">paulgraham.com</a> for reading
        on the web and downloading as a book.
      </p>
      <h2>What this is</h2>
      <ul>
        <li>{SITE.essayCount} essays with metadata and links to each original</li>
        <li>Themed parts (startups, wealth, programming, writing, life) plus a date index</li>
        <li>PDF, EPUB, and MOBI built from the same Markdown source</li>
      </ul>
      <h2>What this is not</h2>
      <ul>
        <li>{DISCLAIMERS.unofficial}</li>
        <li>Not for sale — no ads, payments, or email capture</li>
      </ul>
      <h2>Paul Graham</h2>
      <p>
        All essays are written by and copyright Paul Graham. Please read and share
        from{" "}
        <a href="https://paulgraham.com">paulgraham.com</a> when you can; this
        project is a convenience for offline reading and search.
      </p>
      <p>
        <Link href="/table-of-contents">Start reading →</Link>
      </p>
    </div>
  );
}
