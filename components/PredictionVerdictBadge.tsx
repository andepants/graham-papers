import type { Verdict } from "@/lib/predictions";
import { verdictLabel } from "@/lib/predictions";

type Props = {
  verdict: Verdict;
  /** Optional context for screen readers, e.g. essay title */
  contextLabel?: string;
};

export function PredictionVerdictBadge({ verdict, contextLabel }: Props) {
  const text = verdictLabel(verdict);
  const aria = contextLabel ? `${text} — ${contextLabel}` : text;

  return (
    <span className={`verdict-badge verdict-badge--${verdict}`} aria-label={aria}>
      <span className="verdict-badge__prefix" aria-hidden="true">
        Verdict:
      </span>{" "}
      {text}
    </span>
  );
}
