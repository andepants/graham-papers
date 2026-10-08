import Link from "next/link";
import { PredictionCard } from "@/components/PredictionCard";
import { PredictionVerdictBadge } from "@/components/PredictionVerdictBadge";
import { CATALOG, DISCLAIMERS } from "@/lib/catalog";
import { siteMetadata } from "@/lib/metadata";
import { PREDICTIONS, publishedPredictions, type Verdict } from "@/lib/predictions";

export const metadata = siteMetadata({
  title: "Was PG right? — The Grahamanack",
  description:
    "An unofficial retrospective on falsifiable claims in selected Paul Graham essays—paraphrased claims, outcomes, and sources linking to paulgraham.com.",
});

function essayBySlug(slug: string) {
  return CATALOG.byDate.find((e) => e.slug === slug);
}

function verdictCounts(entries: ReturnType<typeof publishedPredictions>) {
  const counts = new Map<Verdict, number>();
  for (const entry of entries) {
    for (const card of entry.cards) {
      counts.set(card.verdict, (counts.get(card.verdict) ?? 0) + 1);
    }
  }
  return counts;
}

export default function WasPgRightPage() {
  const entries = publishedPredictions();
  const counts = verdictCounts(entries);

  return (
    <div className="container section">
      <h1>Was PG right?</h1>
      <p className="lede">
        A fan-made retrospective on a pilot set of Paul Graham essays. Each card paraphrases a
        directional claim, summarizes how things played out as of the date shown, and links to
        third-party sources—not to essay text on this site.
      </p>
      <p className="muted">
        <strong>Disclaimer:</strong> This is an unofficial reading guide. These verdicts are
        editorial judgments by maintainers of The Grahamanack; they are not Paul Graham&apos;s
        views. {DISCLAIMERS.copyright}
      </p>
      <p className="muted">
        Last updated: {PREDICTIONS.updatedAt} · {entries.length} essays in this pilot.
      </p>

      {counts.size > 0 ? (
        <section aria-labelledby="verdict-summary-heading" className="verdict-summary">
          <h2 id="verdict-summary-heading">Verdict summary (pilot cards)</h2>
          <ul className="verdict-summary__list">
            {[...counts.entries()]
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([verdict, n]) => (
                <li key={verdict}>
                  <PredictionVerdictBadge verdict={verdict} />
                  <span className="verdict-summary__count">{n}</span>
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      <div className="prediction-essay-groups">
        {entries.map((entry) => {
          const essay = essayBySlug(entry.slug);
          if (!essay) {
            return null;
          }

          return (
            <section
              key={entry.slug}
              className="prediction-essay-group"
              aria-labelledby={`essay-${entry.slug}`}
            >
              <header className="prediction-essay-group__header">
                <h2 id={`essay-${entry.slug}`}>
                  <a href={essay.url} rel="noopener noreferrer">
                    {essay.title}
                  </a>
                </h2>
                <p className="essay-meta">
                  {essay.date ? <span>{essay.date} · </span> : null}
                  Part {essay.partNumber}: {essay.partTitle}
                  {" · "}
                  <a href={essay.url} rel="noopener noreferrer">
                    Read on paulgraham.com →
                  </a>
                </p>
              </header>
              <div className="prediction-essay-group__cards">
                {entry.cards.map((card) => (
                  <PredictionCard key={card.id} card={card} essayTitle={essay.title} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <p>
        <Link href="/table-of-contents">Browse all essays in the guide →</Link>
      </p>
    </div>
  );
}
