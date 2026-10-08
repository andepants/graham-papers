import Link from "next/link";
import { ArrowRight, ArrowUpRight, DownloadSimple } from "@phosphor-icons/react/dist/ssr";
import { HeroField } from "@/components/HeroField";
import { ReadingLottie } from "@/components/ReadingLottie";
import { Reveal } from "@/components/Reveal";
import { StatsStrip } from "@/components/StatsStrip";
import { CATALOG, DISCLAIMERS, starterEssays, writingYears } from "@/lib/catalog";

export default function HomePage() {
  const starters = starterEssays();
  const years = writingYears();
  const largestPart = [...CATALOG.parts].sort((a, b) => b.essays.length - a.essays.length)[0];

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="intro enter">
            <h1>The Grahamanack</h1>
            <p className="lead">
              A fan-made reading guide to Paul Graham&apos;s essays, sorted by theme and linked
              straight to paulgraham.com.
            </p>
            <div className="hero-cta">
              <Link href="/table-of-contents" className="btn btn-primary">
                Browse the essays
                <ArrowRight size={18} weight="bold" aria-hidden />
              </Link>
              <Link href="/all-by-date" className="btn btn-secondary">
                Read by date
              </Link>
            </div>
            <p className="muted hero-download-note">
              Or download the ebook:{" "}
              <a href="/downloads/grahamanack.epub">EPUB</a>
              {" · "}
              <a href="/downloads/grahamanack.pdf">PDF</a>
              {" · "}
              <a href="/downloads/grahamanack.mobi">MOBI</a>
            </p>
          </div>
          <div className="hero-visual enter enter-late">
            <HeroField essays={starters} />
          </div>
        </div>
      </section>

      <section className="section section-stats">
        <div className="container">
          <StatsStrip
            stats={[
              { value: CATALOG.essayCount, label: "Essays indexed" },
              { value: years.last - years.first, label: `Years of writing, since ${years.first}` },
              { value: CATALOG.parts.length, label: "Themed parts" },
              { value: largestPart.essays.length, label: `Essays on ${largestPart.title.toLowerCase()}` },
            ]}
          />
        </div>
      </section>

      <section className="section" id="start-here">
        <div className="container start-grid">
          <Reveal className="start-intro">
            <ReadingLottie />
            <h2>Start with these 10</h2>
            <p className="muted">
              Same spirit as Paul&apos;s own suggestions on his{" "}
              <a href="https://paulgraham.com/articles.html">essay index</a>. Each one opens on
              his site.
            </p>
          </Reveal>
          <ol className="starter-list">
            {starters.map((e, i) => (
              <li key={e.slug}>
                <Reveal delay={i * 0.04}>
                  <a href={e.url} rel="noopener noreferrer" className="starter-link">
                    <span className="starter-title">{e.title}</span>
                    <span className="starter-meta">
                      {e.date ?? "Undated"}
                      <ArrowUpRight size={16} weight="bold" aria-hidden />
                    </span>
                  </a>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>Five parts</h2>
          <div className="parts-bento">
            {CATALOG.parts.map((part, i) => (
              <Reveal key={part.id} delay={i * 0.06} className={`part-tile part-tile-${i + 1}`}>
                <Link href={`/table-of-contents#${part.id}`}>
                  <span className="part-count">{part.essays.length} essays</span>
                  <span className="part-title">{part.title}</span>
                  <span className="part-subtitle">{part.subtitle}</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="download">
        <div className="container">
          <Reveal>
            <h2>Download the ebook</h2>
            <p className="muted download-lede">
              All {CATALOG.essayCount} essays compiled into one file with a linked table of
              contents. Free, no signup. All essays © Paul Graham — each one links back to the
              original on paulgraham.com.
            </p>
          </Reveal>
          <div className="download-grid">
            {[
              {
                format: "EPUB",
                desc: "Apple Books, Kobo, Google Play — and Kindle via Send to Kindle.",
                href: "/downloads/grahamanack.epub",
              },
              {
                format: "PDF",
                desc: "Desktop reading, printing, or one file to keep anywhere.",
                href: "/downloads/grahamanack.pdf",
              },
              {
                format: "MOBI",
                desc: "Older Kindle devices. Newer Kindles should use EPUB.",
                href: "/downloads/grahamanack.mobi",
              },
            ].map((d, i) => (
              <Reveal key={d.format} delay={i * 0.06}>
                <a href={d.href} className="download-tile">
                  <span className="download-format">{d.format}</span>
                  <span className="download-desc">{d.desc}</span>
                  <span className="download-meta">
                    Download
                    <DownloadSimple size={15} weight="bold" aria-hidden />
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container about-blocks">
          <div>
            <h2>About Paul Graham</h2>
            <p>
              Paul Graham is a programmer, writer, and investor. Essays live at{" "}
              <a href="https://paulgraham.com">paulgraham.com</a>.
            </p>
          </div>
          <div>
            <h2>About this guide</h2>
            <p>{DISCLAIMERS.unofficial}</p>
            <p>{DISCLAIMERS.copyright}</p>
            <p>
              <Link href="/about" className="text-link">
                More about the guide
                <ArrowRight size={16} weight="bold" aria-hidden />
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
