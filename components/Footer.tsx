import Link from "next/link";
import { DISCLAIMERS } from "@/lib/catalog";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <p className="footer-title">The Grahamanack</p>
          <p className="muted">{DISCLAIMERS.unofficial}</p>
          <p className="muted">{DISCLAIMERS.copyright}</p>
          <p className="muted">{DISCLAIMERS.inspiration}</p>
        </div>
        <div>
          <p className="footer-title">Paul Graham</p>
          <p>
            <a href="https://paulgraham.com">paulgraham.com</a>
          </p>
          <p>
            <a href="https://paulgraham.com/articles.html">Essay index</a>
          </p>
        </div>
        <div>
          <p className="footer-title">Guide</p>
          <ul className="footer-links">
            <li>
              <Link href="/table-of-contents">Themed index</Link>
            </li>
            <li>
              <Link href="/all-by-date">All essays by date</Link>
            </li>
            <li>
              <Link href="/was-pg-right">Was PG right?</Link>
            </li>
            <li>
              <Link href="/about">About</Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
