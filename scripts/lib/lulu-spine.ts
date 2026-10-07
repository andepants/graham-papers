import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const tablePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../print/lulu-spine-width.json",
);

type SpineRow = { minPages: number; maxPages: number; spineWidthIn: number };

export function spineWidthInches(pageCount: number): number {
  const data = JSON.parse(fs.readFileSync(tablePath, "utf8")) as {
    table: SpineRow[];
  };
  const pages = Math.max(24, Math.min(800, pageCount));
  for (const row of data.table) {
    if (pages >= row.minPages && pages <= row.maxPages) {
      return row.spineWidthIn;
    }
  }
  return data.table[data.table.length - 1]!.spineWidthIn;
}
