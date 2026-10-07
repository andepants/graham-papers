import { DOWNLOADS } from "@/lib/metadata";

type Props = { variant?: "hero" | "inline" | "sidebar" };

export function DownloadButtons({ variant = "hero" }: Props) {
  const cls =
    variant === "hero"
      ? "download-row hero-downloads"
      : variant === "sidebar"
        ? "download-row sidebar-downloads"
        : "download-row";

  return (
    <div className={cls}>
      <a className="btn btn-primary" href={DOWNLOADS.pdf} download>
        Download PDF
      </a>
      <a className="btn btn-primary" href={DOWNLOADS.epub} download>
        Download EPUB
      </a>
      <a className="btn btn-primary" href={DOWNLOADS.mobi} download>
        Download MOBI
      </a>
    </div>
  );
}
