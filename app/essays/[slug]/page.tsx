import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownBody } from "@/components/MarkdownBody";
import { DownloadButtons } from "@/components/DownloadButtons";
import {
  getAllSlugs,
  getEssayDocument,
  getNeighbors,
} from "@/lib/essays";
import { siteMetadata } from "@/lib/metadata";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const doc = getEssayDocument(slug);
  if (!doc) return siteMetadata({ title: "Essay — The Grahamanack" });
  return siteMetadata({
    title: `${doc.title} — The Grahamanack`,
    description: `Read "${doc.title}" from The Grahamanack. Originally on paulgraham.com.`,
  });
}

export default async function EssayPage({ params }: Props) {
  const { slug } = await params;
  const doc = getEssayDocument(slug);
  if (!doc) notFound();
  const { prev, next } = getNeighbors(slug);

  return (
    <div className="container essay-layout">
      <article>
        <header className="essay-header">
          <p className="muted">
            Part {doc.meta.partNumber}: {doc.meta.partTitle}
          </p>
          <h1>{doc.title}</h1>
          <div className="essay-meta">
            {doc.date ? <time>{doc.date}</time> : null}
            {" · "}
            <a href={doc.url} rel="noopener noreferrer">
              Original on paulgraham.com
            </a>
          </div>
        </header>
        <MarkdownBody content={doc.content} />
        <nav className="essay-nav" aria-label="Essay pagination">
          <div>
            {prev ? (
              <Link href={`/essays/${prev.slug}`}>← {prev.title}</Link>
            ) : (
              <span className="muted"> </span>
            )}
          </div>
          <div>
            <Link href="/table-of-contents">Contents</Link>
          </div>
          <div style={{ textAlign: "right" }}>
            {next ? (
              <Link href={`/essays/${next.slug}`}>{next.title} →</Link>
            ) : (
              <span className="muted"> </span>
            )}
          </div>
        </nav>
      </article>
      <aside className="sidebar-card">
        <h3>About the book</h3>
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          The Grahamanack is free to download — unofficial fan compilation, not for
          sale.
        </p>
        <DownloadButtons variant="sidebar" />
      </aside>
    </div>
  );
}
