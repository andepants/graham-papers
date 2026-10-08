import predictionsDoc from "@/data/predictions.json";

export type Verdict =
  | "right"
  | "mostly_right"
  | "mixed"
  | "mostly_wrong"
  | "wrong"
  | "too_early"
  | "not_prediction";

export type Confidence = "low" | "medium" | "high";

export type PredictionSource = {
  label: string;
  url: string;
};

export type PredictionCard = {
  id: string;
  claim: string;
  outcome: string;
  verdict: Verdict;
  confidence?: Confidence;
  asOf: string;
  sources: PredictionSource[];
};

export type PredictionEntry = {
  slug: string;
  status: "draft" | "published";
  cards: PredictionCard[];
};

export type PredictionsDocument = {
  schemaVersion: number;
  updatedAt: string;
  entries: PredictionEntry[];
};

export const PREDICTIONS = predictionsDoc as PredictionsDocument;

const VERDICT_LABELS: Record<Verdict, string> = {
  right: "Right",
  mostly_right: "Mostly right",
  mixed: "Mixed",
  mostly_wrong: "Mostly wrong",
  wrong: "Wrong",
  too_early: "Too early to tell",
  not_prediction: "Not a prediction",
};

export function verdictLabel(verdict: Verdict): string {
  return VERDICT_LABELS[verdict];
}

export function predictionsBySlug(): Map<string, PredictionEntry> {
  return new Map(PREDICTIONS.entries.map((e) => [e.slug, e]));
}

export function publishedPredictions(): PredictionEntry[] {
  return PREDICTIONS.entries.filter((e) => e.status === "published");
}
