import type { PredictionCard as PredictionCardData } from "@/lib/predictions";
import { PredictionVerdictBadge } from "@/components/PredictionVerdictBadge";

type Props = {
  card: PredictionCardData;
  essayTitle: string;
  headingLevel?: "h3" | "h4";
};

export function PredictionCard({ card, essayTitle, headingLevel = "h3" }: Props) {
  const Heading = headingLevel;

  return (
    <article className="prediction-card" id={card.id}>
      <header className="prediction-card__header">
        <Heading className="prediction-card__claim">{card.claim}</Heading>
        <PredictionVerdictBadge verdict={card.verdict} contextLabel={essayTitle} />
      </header>
      <p className="prediction-card__outcome">
        <span className="prediction-card__outcome-label">What happened: </span>
        {card.outcome}
      </p>
      <p className="prediction-card__meta muted">
        As of {card.asOf}
        {card.confidence ? ` · Confidence: ${card.confidence}` : null}
      </p>
      {card.sources.length > 0 ? (
        <div className="prediction-card__sources">
          <p className="prediction-card__sources-label">Sources</p>
          <ul>
            {card.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} rel="noopener noreferrer">
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
