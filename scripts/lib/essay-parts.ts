/** Split essay markdown into body, notes (PG footnotes), and optional thanks block. */
export function splitEssayContent(content: string): {
  body: string;
  notes: string;
  thanks: string;
} {
  let text = content.trim();
  text = text.replace(/^\[\]\([^)]+\)/, "").trim();

  const thanksMatch = text.match(/\n## Thanks\n[\s\S]*$/i);
  const thanks = thanksMatch ? thanksMatch[0].trim() : "";
  if (thanksMatch) text = text.slice(0, thanksMatch.index).trim();

  const footnoteStart = text.search(/\n\\?\[\d+\]\s/);
  if (footnoteStart === -1) {
    return { body: text, notes: "", thanks };
  }

  const body = text.slice(0, footnoteStart).trim();
  const notes = text.slice(footnoteStart).trim();
  return { body, notes, thanks };
}

export function parseEssayDate(date: string | null | undefined): Date | null {
  if (!date) return null;
  const t = new Date(date);
  return Number.isNaN(t.getTime()) ? null : t;
}
