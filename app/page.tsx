import Link from "next/link";
import { EssayListItem } from "@/components/EssayListItem";
import { HeroSection } from "@/components/HeroSection";
import { HomeStats } from "@/components/HomeStats";
import { ScrollReveal } from "@/components/ScrollReveal";
import { CATALOG, starterEssays } from "@/lib/catalog";
import { writingYearSpan } from "@/lib/years";
import bookLottie from "@/public/lottie/book-pages.json";

export default function HomePage() {
  const starters = starterEssays();
  const yearSpan = writingYearSpan(CATALOG.byDate);

  return (
    <>
      <HeroSection lottieData={bookLottie} />

      <section className="section section-tight">
        <div className="container">
          <ScrollReveal>
            <HomeStats
              essayCount={CATALOG.essayCount}
              partCount={CATALOG.parts.length}
              yearSpan={yearSpan}
            />
          </ScrollReveal>
        </div>
      </section>

      <section className="section" id="start-here">
        <div className="container">
          <ScrollReveal>
            <h2>Start with these 10</h2>
            <p className="muted">
              Same spirit as Paul&apos;s own suggestions on his{" "}
              <a href="https://paulgraham.com/articles.html">essay index</a> — read on his site.
            </p>
          </ScrollReveal>
          <ul className="toc-list starter-list">
            {starters.map((e) => (
              <EssayListItem key={e.slug} essay={e} />
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container about-blocks">
          <ScrollReveal>
            <div>
              <h2>About Paul Graham</h2>
              <p>
                Paul Graham is a programmer, writer, and investor. Essays live at{" "}
                <a href="https://paulgraham.com">paulgraham.com</a>.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.08}>
            <div>
              <h2>About this guide</h2>
              <p>{CATALOG.parts.length} themed parts, {CATALOG.essayCount} essays linked — no hosted text.</p>
              <p>
                <Link href="/about">More →</Link>
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
