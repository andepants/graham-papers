import Link from "next/link";
import { SITE } from "@/lib/site";
import { siteMetadata } from "@/lib/metadata";

export const metadata = siteMetadata({
  title: "Read — The Grahamanack",
  description: "Table of contents: Paul Graham's essays by part.",
});

export default function TableOfContentsPage() {
  return (
    <div className="container section">
      <h1>Table of Contents</h1>
      <p className="muted">
        Essays grouped by theme, ordered by original publish date within each part.{" "}
        <Link href="/all-by-date">View all essays by date</Link>.
      </p>
      {SITE.parts.map((part) => (
        <section key={part.id} className="toc-part">
          <h2>
            Part {part.number}: {part.title}
          </h2>
          <p className="muted">{part.subtitle}</p>
          <ul className="toc-list">
            {part.essays.map((e) => (
              <li key={e.slug}>
                <Link href={`/essays/${e.slug}`}>{e.title}</Link>
                {e.date ? <span className="muted"> — {e.date}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
