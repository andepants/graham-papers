import { DownloadButtons } from "@/components/DownloadButtons";
import { DISCLAIMERS } from "@/lib/site";
import { siteMetadata } from "@/lib/metadata";

export const metadata = siteMetadata({
  title: "Download — The Grahamanack",
});

export default function DownloadPage() {
  return (
    <div className="container section">
      <h1>Download The Grahamanack</h1>
      <p className="muted">{DISCLAIMERS.free}</p>
      <p>{DISCLAIMERS.unofficial}</p>
      <p>{DISCLAIMERS.copyright}</p>
      <DownloadButtons variant="hero" />
      <p className="muted" style={{ marginTop: "2rem" }}>
        Files: <code>grahamanack.pdf</code>, <code>grahamanack.epub</code>,{" "}
        <code>grahamanack.mobi</code> in <code>/downloads</code>.
      </p>
    </div>
  );
}
