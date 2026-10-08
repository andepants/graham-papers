import type { EssayLink } from "@/lib/catalog";

export function EssayListItem({ essay, showPart = true }: { essay: EssayLink; showPart?: boolean }) {
  return (
    <li className="essay-link-item">
      <a href={essay.url} rel="noopener noreferrer">
        {essay.title}
      </a>
      <span className="essay-link-meta">
        {essay.date ?? "Undated"}
        {showPart ? <span className="part-tag">Part {essay.partNumber}</span> : null}
      </span>
    </li>
  );
}
