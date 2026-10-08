import type { EssayLink } from "@/lib/catalog";

export function EssayListItem({ essay }: { essay: EssayLink }) {
  return (
    <li className="essay-link-item">
      <a href={essay.url} rel="noopener noreferrer">
        {essay.title}
      </a>
      {essay.date ? <span className="muted"> — {essay.date}</span> : null}
      <span className="muted part-tag">
        {" "}
        · Part {essay.partNumber}
      </span>
    </li>
  );
}
