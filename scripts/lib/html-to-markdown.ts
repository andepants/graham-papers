import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  emDelimiter: "*",
  codeBlockStyle: "fenced",
});

turndown.use(gfm);

turndown.addRule("preserveFootnoteRefs", {
  filter(node) {
    return (
      node.nodeName === "A" &&
      !!(node as HTMLAnchorElement).getAttribute("href")?.startsWith("#")
    );
  },
  replacement(content, node) {
    const el = node as HTMLAnchorElement;
    const href = el.getAttribute("href") ?? "";
    return `[${content}](${href})`;
  },
});

/** Resolve relative paulgraham.com links to absolute URLs. */
export function absolutizeLinks(html: string, pageUrl: string): string {
  return html.replace(/href="([^"#][^"]*)"/g, (_m, href: string) => {
    if (/^(https?:|mailto:|#)/i.test(href)) return `href="${href}"`;
    const base = pageUrl.replace(/[^/]+$/, "");
    try {
      const abs = new URL(href, base).href;
      return `href="${abs}"`;
    } catch {
      return `href="${href}"`;
    }
  });
}

export function htmlFragmentToMarkdown(html: string): string {
  let md = turndown.turndown(html);
  md = md.replace(/\n{3,}/g, "\n\n");
  return md.trim();
}
