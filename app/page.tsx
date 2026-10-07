import Link from "next/link";
import Image from "next/image";
import { DownloadButtons } from "@/components/DownloadButtons";
import { SITE, DISCLAIMERS } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="cover-wrap">
            <Image
              src="/images/cover.svg"
              alt="The Grahamanack book cover"
              width={560}
              height={840}
              priority
            />
          </div>
          <div className="intro">
            <h1>The Grahamanack</h1>
            <p className="lead">
              Hello and welcome! This book collects Paul Graham&apos;s essays from{" "}
              <a href="https://paulgraham.com">paulgraham.com</a> so you can read them
              on the web or download them as a single volume — PDF, EPUB, or MOBI.
            </p>
            <p className="muted">
              An unofficial fan compilation, inspired by the spirit of{" "}
              <a href="https://www.navalmanack.com">Navalmanack</a>. Not endorsed by
              Paul Graham.
            </p>
            <Link href="/table-of-contents" className="btn btn-secondary">
              Read Online
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="feature-grid">
            <div className="feature-card">
              <h3>{SITE.essayCount}+ essays</h3>
              <p>
                The full archive linked from Paul Graham&apos;s essay index, in one
                place.
              </p>
            </div>
            <div className="feature-card">
              <h3>25+ years of writing</h3>
              <p>From early Lisp essays in the 2000s through recent work — ordered by theme and date.</p>
            </div>
            <div className="feature-card">
              <h3>Startups, wealth, writing, and how to think</h3>
              <p>
                Grouped into parts like Navalmanack&apos;s themed table of contents —
                startups, work, programming, writing, and life.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="download">
        <div className="container">
          <h2>Download</h2>
          <p className="muted">
            Direct downloads — no gate, no signup. {DISCLAIMERS.free}
          </p>
          <DownloadButtons variant="hero" />
        </div>
      </section>

      <section className="section">
        <div className="container about-blocks">
          <div>
            <h2>About Paul Graham</h2>
            <p>
              Paul Graham is a programmer, writer, and investor. He co-founded Viaweb
              (acquired by Yahoo), started Y Combinator, and has published essays on
              startups, technology, and how to think since 2001.
            </p>
            <p>
              <a href="https://paulgraham.com">Visit paulgraham.com →</a>
            </p>
          </div>
          <div>
            <h2>About this edition</h2>
            <p>{DISCLAIMERS.unofficial}</p>
            <p>{DISCLAIMERS.copyright}</p>
            <p>
              <Link href="/about">More about The Grahamanack →</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
