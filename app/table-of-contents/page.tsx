import Link from "next/link";
import { EssayListItem } from "@/components/EssayListItem";
import { ScrollReveal } from "@/components/ScrollReveal";
import { CATALOG } from "@/lib/catalog";
import { siteMetadata } from "@/lib/metadata";

export const metadata = siteMetadata({
  title: "Read — The Grahamanack",
  description: "Themed index of Paul Graham's essays — links to paulgraham.com.",
});

export default function TableOfContentsPage() {
  return (
    <div className="container section">
      <ScrollReveal>
        <h1>Table of Contents</h1>
        <p className="muted">
          Each title opens the original essay on paulgraham.com.{" "}
          <Link href="/all-by-date">View all essays by date</Link>.
        </p>
      </ScrollReveal>
      {CATALOG.parts.map((part, partIndex) => (
        <ScrollReveal key={part.id} delay={partIndex * 0.04}>
          <section className="toc-part">
            <h2>
              Part {part.number}: {part.title}
            </h2>
            <p className="muted">{part.subtitle}</p>
            <ul className="toc-list">
              {part.essays.map((e) => (
                <EssayListItem key={e.slug} essay={e} />
              ))}
            </ul>
          </section>
        </ScrollReveal>
      ))}
    </div>
  );
}
