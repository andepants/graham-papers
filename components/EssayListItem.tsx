import type { EssayLink } from "@/lib/catalog";

export function EssayListItem({ essay }: { essay: EssayLink }) {
  return (
    <li className="essay-link-item">
      <a href={essay.url} rel="noopener noreferrer" className="essay-row-link">
        <span className="essay-row-title">{essay.title}</span>
        <span className="essay-row-meta">
          {essay.date ? <span className="essay-row-date">{essay.date}</span> : null}
          <span className="part-tag">Part {essay.partNumber}</span>
        </span>
      </a>
    </li>
  );
}
