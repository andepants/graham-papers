import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { CATALOG, DISCLAIMERS } from "@/lib/catalog";
import { siteMetadata } from "@/lib/metadata";

export const metadata = siteMetadata({
  title: "About — The Grahamanack",
});

export default function AboutPage() {
  return (
    <div className="container section page-prose">
      <ScrollReveal>
        <h1>About The Grahamanack</h1>
        <p>
          <strong>The Grahamanack</strong> is an unofficial, fan-made reading guide to Paul
          Graham&apos;s essays. It is inspired by Eric Jorgenson&apos;s{" "}
          <a href="https://www.navalmanack.com">Navalmanack</a> — a clear path through a large
          body of work — but it does <em>not</em> republish any essay text.
        </p>
      </ScrollReveal>
      <ScrollReveal delay={0.05}>
        <h2>What this is</h2>
        <ul>
          <li>{CATALOG.essayCount} essays indexed by theme and date</li>
          <li>Every link goes to the original on paulgraham.com</li>
          <li>Free, non-commercial, no ads or email capture</li>
        </ul>
      </ScrollReveal>
      <ScrollReveal delay={0.08}>
        <h2>What this is not</h2>
        <ul>
          <li>{DISCLAIMERS.unofficial}</li>
          <li>Not a download site — no PDF, EPUB, or print files</li>
          <li>{DISCLAIMERS.copyright}</li>
        </ul>
      </ScrollReveal>
      <ScrollReveal delay={0.1}>
        <h2>Updating the index</h2>
        <p className="muted">
          Maintainers can run <code>npm run refresh-metadata</code> to pull titles and dates from
          paulgraham.com&apos;s articles page (no essay bodies stored).
        </p>
      </ScrollReveal>
      <ScrollReveal delay={0.12}>
        <h2>Credits</h2>
        <ul className="credits-list">
          <li>
            Book motion on the home page: community Lottie animation (Lottie Simple License), via{" "}
            <a href="https://lottiefiles.com/free-animation/books-c50aYlU1Qm">LottieFiles</a>.
          </li>
          <li>
            Springy cursor: adapted from{" "}
            <a href="https://cursify.vercel.app">Cursify</a> (ui-layouts/cursify, MIT).
          </li>
          <li>
            Magnetic call-to-action: motion pattern from{" "}
            <a href="https://www.fancycomponents.dev">Fancy Components</a>.
          </li>
          <li>
            Animated statistics:{" "}
            <a href="https://number-flow.barvian.me">NumberFlow</a> (@number-flow/react, MIT).
          </li>
        </ul>
        <p>
          <Link href="/table-of-contents">Browse the essays →</Link>
        </p>
      </ScrollReveal>
    </div>
  );
}
