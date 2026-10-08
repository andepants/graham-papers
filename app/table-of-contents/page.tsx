import Link from "next/link";
import { EssayListItem } from "@/components/EssayListItem";
import { CATALOG } from "@/lib/catalog";
import { siteMetadata } from "@/lib/metadata";

export const metadata = siteMetadata({
  title: "Read | The Grahamanack",
  description: "Themed index of Paul Graham's essays, linking to paulgraham.com.",
});

export default function TableOfContentsPage() {
  return (
    <div className="container section">
      <h1>Table of Contents</h1>
      <p className="muted">
        Each title opens the original essay on paulgraham.com.{" "}
        <Link href="/all-by-date">View all essays by date</Link>.
      </p>
      <nav className="part-jump" aria-label="Parts">
        {CATALOG.parts.map((part) => (
          <a key={part.id} href={`#${part.id}`} className="chip">
            {part.title}
          </a>
        ))}
      </nav>
      {CATALOG.parts.map((part) => (
        <section key={part.id} id={part.id} className="toc-part">
          <header className="toc-part-header">
            <span className="toc-part-number">Part {part.number}</span>
            <h2>{part.title}</h2>
            <p className="muted">
              {part.subtitle}. {part.essays.length} essays.
            </p>
          </header>
          <ul className="toc-list">
            {part.essays.map((e) => (
              <EssayListItem key={e.slug} essay={e} showPart={false} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
