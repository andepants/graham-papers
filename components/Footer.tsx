import Link from "next/link";
import { DISCLAIMERS } from "@/lib/site";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <p className="footer-title">The Grahamanack</p>
          <p className="muted">{DISCLAIMERS.unofficial}</p>
          <p className="muted">{DISCLAIMERS.copyright}</p>
          <p className="muted">{DISCLAIMERS.free}</p>
        </div>
        <div>
          <p className="footer-title">Paul Graham</p>
          <p>
            <a href="https://paulgraham.com" rel="noopener noreferrer">
              paulgraham.com
            </a>
          </p>
          <p>
            <a href="https://paulgraham.com/articles.html" rel="noopener noreferrer">
              Essay index
            </a>
          </p>
        </div>
        <div>
          <p className="footer-title">This site</p>
          <ul className="footer-links">
            <li>
              <Link href="/table-of-contents">Read online</Link>
            </li>
            <li>
              <Link href="/all-by-date">All essays by date</Link>
            </li>
            <li>
              <Link href="/download">Download</Link>
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
