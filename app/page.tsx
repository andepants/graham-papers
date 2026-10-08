import Link from "next/link";
import Image from "next/image";
import { EssayListItem } from "@/components/EssayListItem";
import { CATALOG, DISCLAIMERS, starterEssays } from "@/lib/catalog";

export default function HomePage() {
  const starters = starterEssays();

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="cover-wrap">
            <Image
              src="/images/cover.svg"
              alt="The Grahamanack cover"
              width={560}
              height={840}
              priority
            />
          </div>
          <div className="intro">
            <h1>The Grahamanack</h1>
            <p className="lead">
              Hello and welcome! This is a fan-made <strong>reading guide</strong> to Paul
              Graham&apos;s essays on{" "}
              <a href="https://paulgraham.com">paulgraham.com</a> — themed links, no hosted
              text.
            </p>
            <p className="muted">{DISCLAIMERS.unofficial}</p>
            <div className="hero-cta">
              <Link href="/table-of-contents" className="btn btn-primary">
                Browse the essays
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="feature-grid">
            <div className="feature-card">
              <h3>{CATALOG.essayCount}+ essays</h3>
              <p>Every entry links straight to the original on paulgraham.com.</p>
            </div>
            <div className="feature-card">
              <h3>25+ years of writing</h3>
              <p>Themed parts plus a chronological index — metadata only.</p>
            </div>
            <div className="feature-card">
              <h3>Startups, wealth, writing, and how to think</h3>
              <p>Five parts inspired by the structure of Navalmanack.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="start-here">
        <div className="container">
          <h2>Start with these 10</h2>
          <p className="muted">
            Same spirit as Paul&apos;s own suggestions on his{" "}
            <a href="https://paulgraham.com/articles.html">essay index</a> — read on his site.
          </p>
          <ul className="toc-list starter-list">
            {starters.map((e) => (
              <EssayListItem key={e.slug} essay={e} />
            ))}
          </ul>
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
            <p>{DISCLAIMERS.copyright}</p>
            <p>{DISCLAIMERS.inspiration}</p>
            <p>
              <Link href="/about">More →</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
