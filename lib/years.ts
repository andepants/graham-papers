import type { EssayLink } from "@/lib/catalog";

/** Inclusive span of calendar years covered by dated essays (minimum 25 for display). */
export function writingYearSpan(essays: EssayLink[]): number {
  let min = Infinity;
  let max = -Infinity;
  for (const e of essays) {
    const y = e.date?.match(/\d{4}/)?.[0];
    if (!y) continue;
    const n = Number(y);
    if (n < min) min = n;
    if (n > max) max = n;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return 25;
  return Math.max(25, max - min + 1);
}
