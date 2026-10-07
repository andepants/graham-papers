import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { siteMetadata } from "@/lib/metadata";
import { DISCLAIMERS } from "@/lib/site";

export const metadata = siteMetadata({
  title: "Make your own copy — The Grahamanack",
  description:
    "Download print-ready PDFs for a private Lulu hardcover of Paul Graham's essays.",
});

type Manifest = {
  generatedAt: string;
  volumes: Record<
    string,
    {
      title: string;
      essayCount: number;
      pageCount: number;
      spineWidthIn: number;
      files: {
        interior: string;
        dustJacket: string;
        printedCase: string;
      };
    }
  >;
};

function loadManifest(): Manifest | null {
  const p = path.join(process.cwd(), "print/manifest.json");
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8")) as Manifest;
}

export default function PrintPage() {
  const manifest = loadManifest();
  const volumes = manifest
    ? Object.entries(manifest.volumes).sort(([a], [b]) => a.localeCompare(b))
    : [];

  return (
    <div className="container section">
      <h1>Make your own copy</h1>
      <p>
        The Grahamanack can be printed as a <strong>private hardcover</strong> for
        yourself through{" "}
        <a href="https://www.lulu.com" rel="noopener noreferrer">
          Lulu
        </a>
        : 6×9&nbsp;in, linen wrap with dust jacket, black &amp; white interior. We
        do not sell books, take orders, or earn anything — this is for readers who
        want a shelf copy they bind themselves.
      </p>
      <p className="muted">{DISCLAIMERS.unofficial}</p>
      <p className="muted">{DISCLAIMERS.copyright}</p>

      <h2>How it works</h2>
      <ol>
        <li>
          Download the three <strong>interior</strong> PDFs below (Volume I–III,
          chronological split configured in{" "}
          <code>print/config.json</code>).
        </li>
        <li>
          For each volume, download the matching <strong>dust jacket</strong> and{" "}
          <strong>printed case</strong> PDFs (spine width is computed from the
          interior page count using{" "}
          <a
            href="https://help.api.lulu.com/en/support/solutions/articles/64000254616-how-is-spine-width-calculated-"
            rel="noopener noreferrer"
          >
            Lulu&apos;s spine table
          </a>
          ).
        </li>
        <li>
          On Lulu, create a new project: <em>Print book</em> → 6×9 →{" "}
          <em>Linen Wrap with Dust Jacket</em> → upload interior (no bleed) and
          cover files. Order a single copy for yourself.
        </li>
      </ol>

      {!manifest ? (
        <p className="muted">
          Print files are not generated in this build yet. Run{" "}
          <code>npm run build:print</code> locally (requires Pandoc, XeLaTeX, EB
          Garamond, and Puppeteer for covers).
        </p>
      ) : (
        <>
          <p className="muted">
            Last generated: {new Date(manifest.generatedAt).toLocaleString()}.
          </p>
          {volumes.map(([slug, vol]) => (
            <section key={slug} className="toc-part">
              <h2>
                {vol.title}{" "}
                <span className="muted">
                  ({vol.essayCount} essays · {vol.pageCount} pages · spine{" "}
                  {vol.spineWidthIn}&quot;)
                </span>
              </h2>
              <div className="download-row">
                <a className="btn btn-primary" href={`/${vol.files.interior}`} download>
                  Interior PDF
                </a>
                <a
                  className="btn btn-primary"
                  href={`/${vol.files.dustJacket.replace(/^public\//, "")}`}
                  download
                >
                  Dust jacket PDF
                </a>
                <a
                  className="btn btn-primary"
                  href={`/${vol.files.printedCase.replace(/^public\//, "")}`}
                  download
                >
                  Printed case PDF
                </a>
              </div>
            </section>
          ))}
        </>
      )}

      <p style={{ marginTop: "2rem" }}>
        Prefer digital? See <Link href="/download">Download</Link> for EPUB, MOBI,
        and a single-screen PDF. Read online via the{" "}
        <Link href="/table-of-contents">table of contents</Link>.
      </p>
    </div>
  );
}
