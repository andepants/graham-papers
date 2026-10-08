import catalog from "../data/catalog.json";
import predictions from "../data/predictions.json";

const MAX_CLAIM = 280;
const MAX_OUTCOME = 600;

const catalogSlugs = new Set<string>();
for (const part of catalog.parts) {
  for (const essay of part.essays) {
    catalogSlugs.add(essay.slug);
  }
}

const seenIds = new Set<string>();
const errors: string[] = [];
const warnings: string[] = [];

for (const entry of predictions.entries) {
  if (!catalogSlugs.has(entry.slug)) {
    errors.push(`Unknown catalog slug: "${entry.slug}"`);
  }

  if (entry.status !== "draft" && entry.status !== "published") {
    errors.push(`Invalid status for slug "${entry.slug}": ${String(entry.status)}`);
  }

  if (!entry.cards?.length) {
    errors.push(`Slug "${entry.slug}" has no prediction cards`);
  }

  for (const card of entry.cards ?? []) {
    const idKey = `${entry.slug}::${card.id}`;
    if (seenIds.has(idKey)) {
      errors.push(`Duplicate card id: ${idKey}`);
    }
    seenIds.add(idKey);

    if (card.claim.length > MAX_CLAIM) {
      errors.push(`Claim too long (${card.claim.length} > ${MAX_CLAIM}) on ${idKey}`);
    }
    if (card.outcome.length > MAX_OUTCOME) {
      errors.push(`Outcome too long (${card.outcome.length} > ${MAX_OUTCOME}) on ${idKey}`);
    }

    if (!card.sources?.length) {
      errors.push(`Missing sources on ${idKey}`);
    }

    for (const source of card.sources ?? []) {
      let parsed: URL;
      try {
        parsed = new URL(source.url);
      } catch {
        errors.push(`Invalid source URL on ${idKey}: ${source.url}`);
        continue;
      }
      if (parsed.protocol !== "https:") {
        errors.push(`Source must use https on ${idKey}: ${source.url}`);
      }
    }
  }

  if (entry.status === "published") {
    const essay = catalog.byDate.find((e) => e.slug === entry.slug);
    if (essay && !essay.date) {
      warnings.push(`Published predictions for "${entry.slug}" but catalog has no date`);
    }
  }
}

const slugCounts = new Map<string, number>();
for (const entry of predictions.entries) {
  slugCounts.set(entry.slug, (slugCounts.get(entry.slug) ?? 0) + 1);
}
for (const [slug, count] of slugCounts) {
  if (count > 1) {
    errors.push(`Duplicate prediction entry slug: "${slug}" (${count} entries)`);
  }
}

if (warnings.length) {
  for (const w of warnings) {
    console.warn(`warn: ${w}`);
  }
}

if (errors.length) {
  for (const e of errors) {
    console.error(`error: ${e}`);
  }
  process.exit(1);
}

console.log(
  `validate-predictions: OK (${predictions.entries.length} entries, schema v${predictions.schemaVersion})`,
);
