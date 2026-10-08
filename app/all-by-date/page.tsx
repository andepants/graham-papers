import Link from "next/link";
import { Suspense } from "react";
import { AllByDateList } from "@/components/AllByDateList";
import { CATALOG } from "@/lib/catalog";
import { siteMetadata } from "@/lib/metadata";

export const metadata = siteMetadata({
  title: "All essays by date | The Grahamanack",
});

export default function AllByDatePage() {
  return (
    <div className="container section date-index">
      <h1>All essays by date</h1>
      <p className="muted">
        Chronological index. Each link opens the original on paulgraham.com.{" "}
        <Link href="/table-of-contents">Themed table of contents</Link>.
      </p>
      <Suspense fallback={<p className="muted">Loading…</p>}>
        <AllByDateList essays={CATALOG.byDate} />
      </Suspense>
    </div>
  );
}
