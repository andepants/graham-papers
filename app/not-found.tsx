import Link from "next/link";
import { CATALOG } from "@/lib/catalog";

export default function NotFound() {
  return (
    <div className="container section">
      <h1>Page not found</h1>
      <p className="muted">
        That page doesn&apos;t exist — but all {CATALOG.essayCount} essays are one click away.
      </p>
      <div className="hero-cta">
        <Link href="/" className="btn btn-primary">
          Back home
        </Link>
        <Link href="/table-of-contents" className="btn btn-secondary">
          Browse the essays
        </Link>
      </div>
    </div>
  );
}
