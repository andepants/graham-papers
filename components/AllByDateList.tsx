"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { EssayListItem } from "@/components/EssayListItem";
import type { EssayLink } from "@/lib/catalog";

export type DateSortOrder = "newest" | "oldest";

function parseDateKey(date: string | null): number {
  if (!date) return Number.NEGATIVE_INFINITY;
  const t = new Date(date).getTime();
  return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
}

function groupByYear(essays: EssayLink[]): Map<string, EssayLink[]> {
  const groups = new Map<string, EssayLink[]>();
  for (const e of essays) {
    const year = e.date?.match(/\d{4}/)?.[0] ?? "Undated";
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year)!.push(e);
  }
  return groups;
}

function sortYears(years: string[], order: DateSortOrder): string[] {
  return [...years].sort((a, b) => {
    if (a === "Undated") return 1;
    if (b === "Undated") return -1;
    const na = Number(a);
    const nb = Number(b);
    return order === "newest" ? nb - na : na - nb;
  });
}

function essaysInYearOrder(items: EssayLink[], order: DateSortOrder): EssayLink[] {
  const sorted = [...items].sort(
    (a, b) => parseDateKey(a.date) - parseDateKey(b.date) || a.title.localeCompare(b.title),
  );
  return order === "newest" ? sorted.reverse() : sorted;
}

function readSortFromLocation(): DateSortOrder {
  if (typeof window === "undefined") return "newest";
  const param = new URLSearchParams(window.location.search).get("sort");
  return param === "oldest" ? "oldest" : "newest";
}

function subscribeToSort(callback: () => void): () => void {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

export function AllByDateList({ essays }: { essays: EssayLink[] }) {
  const sort = useSyncExternalStore(
    subscribeToSort,
    readSortFromLocation,
    () => "newest" as DateSortOrder,
  );

  const setSort = useCallback((next: DateSortOrder) => {
    const url = new URL(window.location.href);
    if (next === "oldest") url.searchParams.set("sort", "oldest");
    else url.searchParams.delete("sort");
    window.history.replaceState(null, "", url.pathname + url.search);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  const years = useMemo(() => {
    const groups = groupByYear(essays);
    return sortYears([...groups.keys()], sort);
  }, [essays, sort]);

  const groups = useMemo(() => groupByYear(essays), [essays]);

  return (
    <>
      <div className="sort-toggle" role="group" aria-label="Sort order">
        <button
          type="button"
          className={`sort-toggle-btn${sort === "newest" ? " is-active" : ""}`}
          aria-pressed={sort === "newest"}
          onClick={() => setSort("newest")}
        >
          Newest first
        </button>
        <button
          type="button"
          className={`sort-toggle-btn${sort === "oldest" ? " is-active" : ""}`}
          aria-pressed={sort === "oldest"}
          onClick={() => setSort("oldest")}
        >
          Oldest first
        </button>
      </div>
      {years.map((year) => (
        <div key={year} className="year-group">
          <h2>{year}</h2>
          <ul className="toc-list">
            {essaysInYearOrder(groups.get(year)!, sort).map((e) => (
              <EssayListItem key={e.slug} essay={e} />
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
