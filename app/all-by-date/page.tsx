import Link from "next/link";
import { SITE } from "@/lib/site";
import { siteMetadata } from "@/lib/metadata";

export const metadata = siteMetadata({
  title: "All essays by date — The Grahamanack",
});

export default function AllByDatePage() {
  const groups = new Map<string, typeof SITE.byDate>();
  for (const e of SITE.byDate) {
    const year = e.date?.match(/\d{4}/)?.[0] ?? "Undated";
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year)!.push(e);
  }
  const years = [...groups.keys()].sort((a, b) => {
    if (a === "Undated") return 1;
    if (b === "Undated") return -1;
    return Number(a) - Number(b);
  });

  return (
    <div className="container section date-index">
      <h1>All essays by date</h1>
      <p className="muted">
        Chronological index (oldest first). For the book order, see the{" "}
        <Link href="/table-of-contents">themed table of contents</Link>.
      </p>
      {years.map((year) => (
        <div key={year} className="year-group">
          <h2>{year}</h2>
          <ul className="toc-list">
            {groups.get(year)!.map((e) => (
              <li key={e.slug}>
                <Link href={`/essays/${e.slug}`}>{e.title}</Link>
                {e.date ? <span className="muted"> — {e.date}</span> : null}
                <span className="muted"> ({e.partTitle})</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
