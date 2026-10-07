#!/usr/bin/env tsx
/**
 * Builds three 6×9" print interior PDFs for Lulu linen + dust jacket.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import matter from "gray-matter";
import { PDFDocument } from "pdf-lib";
import {
  parseEssayDate,
  splitEssayContent,
} from "./lib/essay-parts.ts";
import { spineWidthInches } from "./lib/lulu-spine.ts";
import { buildPrintCovers } from "./build-print-covers.ts";
import {
  CONTENT_DIR,
  DATA_DIR,
  GENERATED_DIR,
  ROOT,
} from "./lib/paths.ts";

type PrintConfig = {
  trim: { widthIn: number; heightIn: number };
  maxPagesPerVolume: number;
  pageCountMultiple: number;
  marginsIn: { inner: number; outer: number; top: number; bottom: number };
  typography: {
    fontFamily: string;
    fontSizePt: number;
    leadingPt: number;
  };
  volumes: {
    id: string;
    slug: string;
    title: string;
    subtitle: string;
    throughDate?: string;
    afterDate?: string;
  }[];
};

type EssayRow = {
  slug: string;
  title: string;
  date: string | null;
  url: string;
  partNumber: string;
  partTitle: string;
  wordCount: number;
};

function wordCount(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

async function loadConfig(): Promise<PrintConfig> {
  return JSON.parse(
    await fs.readFile(path.join(ROOT, "print/config.json"), "utf8"),
  );
}

async function loadEssaysChronological(): Promise<EssayRow[]> {
  const partsFile = JSON.parse(
    await fs.readFile(path.join(DATA_DIR, "parts.json"), "utf8"),
  ) as {
    parts: { number: string; title: string; slugs: string[] }[];
  };
  const slugToPart = new Map<string, { number: string; title: string }>();
  for (const p of partsFile.parts) {
    for (const slug of p.slugs) slugToPart.set(slug, { number: p.number, title: p.title });
  }

  const files = (await fs.readdir(CONTENT_DIR)).filter((f) => f.endsWith(".md"));
  const rows: EssayRow[] = [];
  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const raw = await fs.readFile(path.join(CONTENT_DIR, file), "utf8");
    const { data, content } = matter(raw);
    const part = slugToPart.get(slug) ?? { number: "?", title: "?" };
    rows.push({
      slug,
      title: String(data.title ?? slug),
      date: (data.date as string | null) ?? null,
      url: String(data.url ?? `https://paulgraham.com/${slug}.html`),
      partNumber: part.number,
      partTitle: part.title,
      wordCount: wordCount(content),
    });
  }
  rows.sort((a, b) => {
    const da = parseEssayDate(a.date)?.getTime() ?? 0;
    const db = parseEssayDate(b.date)?.getTime() ?? 0;
    if (da !== db) return da - db;
    return a.title.localeCompare(b.title);
  });
  return rows;
}

function assignVolume(
  essay: EssayRow,
  vol: PrintConfig["volumes"][0],
  config: PrintConfig,
): boolean {
  const t = parseEssayDate(essay.date);
  const after = vol.afterDate ? new Date(vol.afterDate) : null;
  const through = vol.throughDate ? new Date(vol.throughDate) : null;

  if (vol.id === "I") {
    if (!t) return true;
    return t <= (through ?? new Date("2006-04-30"));
  }
  if (vol.id === "II") {
    if (!t) return false;
    return t > (after ?? new Date("2006-04-30")) && t <= (through ?? new Date("2012-11-30"));
  }
  if (vol.id === "III") {
    if (!t) return false;
    return t > (after ?? new Date("2012-11-30"));
  }
  return false;
}

async function volumeEssays(
  config: PrintConfig,
  vol: PrintConfig["volumes"][0],
  all: EssayRow[],
): Promise<EssayRow[]> {
  return all.filter((e) => assignVolume(e, vol, config));
}

async function buildVolumeMarkdown(
  vol: PrintConfig["volumes"][0],
  essays: EssayRow[],
  partsInVolume: Map<string, EssayRow[]>,
): Promise<string> {
  let md = "";
  md += `# The Grahamanack\n\n`;
  md += `## ${vol.title}\n\n`;
  md += `${vol.subtitle}\n\n`;
  md += `\\newpage\n\n`;
  md += `# Notice\n\n`;
  md += `© Paul Graham. All essays in this volume are written by and copyright Paul Graham.\n\n`;
  md += `This is an **unofficial fan compilation**, not endorsed by Paul Graham. `;
  md += `Not for sale. Assembled for private hardcover printing via Lulu.\n\n`;
  md += `\\newpage\n\n`;
  md += `# Contents\n\n`;
  for (const e of essays) {
    md += `- ${e.title}${e.date ? ` (${e.date})` : ""}\n`;
  }
  md += `\n\\newpage\n\n`;

  for (const e of essays) {
    const raw = await fs.readFile(path.join(CONTENT_DIR, `${e.slug}.md`), "utf8");
    const { content } = matter(raw);
    const { body, notes, thanks } = splitEssayContent(content);
    md += `\\newpage\n\n`;
    md += `# ${e.title}\n\n`;
    if (e.date) md += `${e.date}\n\n`;
    md += `Source: ${e.url}\n\n`;
    md += body + "\n\n";
    if (notes) md += `\n## Notes\n\n${notes}\n\n`;
    if (thanks) md += `\n${thanks}\n\n`;
  }

  md += `\\newpage\n\n# Themed Index\n\n`;
  md += `Essays grouped as on grahamanack.com (parts may span multiple print volumes).\n\n`;
  for (const [partTitle, list] of partsInVolume) {
    md += `## ${partTitle}\n\n`;
    for (const e of list) {
      md += `- ${e.title}${e.date ? ` (${e.date})` : ""}\n`;
    }
    md += `\n`;
  }
  return md;
}

async function compileInteriorPdf(mdPath: string, pdfPath: string, config: PrintConfig) {
  const template = path.join(ROOT, "print/templates/volume.tex");
  const linespread = (config.typography.leadingPt / config.typography.fontSizePt).toFixed(3);
  const m = config.marginsIn;
  const geoHeader = path.join(GENERATED_DIR, "print-geometry.tex");
  const fontDir = path.join(ROOT, "print/fonts/").replace(/\\/g, "/");
  await fs.writeFile(
    geoHeader,
    `\\usepackage[paperwidth=${config.trim.widthIn}in,paperheight=${config.trim.heightIn}in,inner=${m.inner}in,outer=${m.outer}in,top=${m.top}in,bottom=${m.bottom}in,twoside]{geometry}
\\providecommand{\\tightlist}{\\setlength{\\itemsep}{0pt}\\setlength{\\parskip}{0pt}}
\\setmainfont{EBGaramond}[
  Path=${fontDir},
  Extension=.ttf,
  UprightFont=EBGaramond-Variable,
  BoldFont=EBGaramond-Variable,
  ItalicFont=EBGaramond-Variable,
  BoldItalicFont=EBGaramond-Variable,
  Color=000000
]
`,
  );
  const args = [
    mdPath,
    "-f",
    "commonmark",
    "-o",
    pdfPath,
    "--pdf-engine=xelatex",
    "--template",
    template,
    "-H",
    geoHeader,
    "-V",
    `fontsize=${config.typography.fontSizePt}pt`,
    "-V",
    "classoption=twoside,openany",
    "-V",
    `mainfont=${config.typography.fontFamily}`,
    "-V",
    `linespread=${linespread}`,
  ];
  const run = spawnSync("pandoc", args, { stdio: "inherit", cwd: ROOT });
  if (run.status !== 0) throw new Error(`Pandoc failed for ${pdfPath}`);
}

async function countPdfPages(pdfPath: string): Promise<number> {
  const run = spawnSync("pdfinfo", [pdfPath], { encoding: "utf8" });
  const m = run.stdout?.match(/Pages:\s+(\d+)/);
  if (!m) throw new Error(`Could not read page count for ${pdfPath}`);
  return Number(m[1]);
}

async function padPdfToMultiple(
  pdfPath: string,
  multiple: number,
): Promise<number> {
  const bytes = await fs.readFile(pdfPath);
  const doc = await PDFDocument.load(bytes);
  let pages = doc.getPageCount();
  const remainder = pages % multiple;
  if (remainder !== 0) {
    const add = multiple - remainder;
    const { width, height } = doc.getPage(0)!.getSize();
    for (let i = 0; i < add; i++) {
      doc.addPage([width, height]);
    }
    await fs.writeFile(pdfPath, await doc.save());
    pages += add;
  }
  return pages;
}

async function main() {
  const config = await loadConfig();
  const allEssays = await loadEssaysChronological();
  const printDir = path.join(ROOT, "print");
  const interiorDir = path.join(printDir, "interior");
  const publicPrint = path.join(ROOT, "public/print");
  await fs.mkdir(interiorDir, { recursive: true });
  await fs.mkdir(publicPrint, { recursive: true });
  await fs.mkdir(GENERATED_DIR, { recursive: true });

  const partsFile = JSON.parse(
    await fs.readFile(path.join(DATA_DIR, "parts.json"), "utf8"),
  ) as { parts: { number: string; title: string; slugs: string[] }[] };

  const manifest: {
    generatedAt: string;
    config: string;
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
  } = {
    generatedAt: new Date().toISOString(),
    config: "print/config.json",
    volumes: {},
  };

  for (const vol of config.volumes) {
    console.log(`\n=== ${vol.title} ===`);
    const essays = await volumeEssays(config, vol, allEssays);
    console.log(`Essays: ${essays.length}`);

    const slugSet = new Set(essays.map((e) => e.slug));
    const essayBySlug = new Map(essays.map((e) => [e.slug, e]));
    const partsInVolume = new Map<string, EssayRow[]>();
    for (const p of partsFile.parts) {
      const label = `Part ${p.number}: ${p.title}`;
      const list = p.slugs
        .filter((s) => slugSet.has(s))
        .map((s) => essayBySlug.get(s)!);
      if (list.length) partsInVolume.set(label, list);
    }

    const md = await buildVolumeMarkdown(vol, essays, partsInVolume);
    const mdPath = path.join(GENERATED_DIR, `print-${vol.slug}.md`);
    await fs.writeFile(mdPath, md);

    const pdfName = `grahamanack-${vol.slug}-interior.pdf`;
    const pdfPath = path.join(interiorDir, pdfName);
    await compileInteriorPdf(mdPath, pdfPath, config);

    let pageCount = await countPdfPages(pdfPath);
    if (pageCount > config.maxPagesPerVolume) {
      throw new Error(
        `${vol.title} has ${pageCount} pages (max ${config.maxPagesPerVolume}). Adjust print/config.json splits.`,
      );
    }
    pageCount = await padPdfToMultiple(pdfPath, config.pageCountMultiple);
    const spine = spineWidthInches(pageCount);

    const pubInterior = path.join(publicPrint, pdfName);
    await fs.copyFile(pdfPath, pubInterior);

    const coverBase = `grahamanack-${vol.slug}`;
    const { dustJacket, printedCase } = await buildPrintCovers({
      volumeId: vol.id,
      volumeTitle: vol.title,
      volumeSubtitle: vol.subtitle,
      pageCount,
      spineWidthIn: spine,
      outputBasename: coverBase,
    });

    manifest.volumes[vol.slug] = {
      title: vol.title,
      essayCount: essays.length,
      pageCount,
      spineWidthIn: spine,
      files: {
        interior: `public/print/${pdfName}`,
        dustJacket: `public/print/${coverBase}-dust-jacket.pdf`,
        printedCase: `public/print/${coverBase}-printed-case.pdf`,
      },
    };
    console.log(`Pages: ${pageCount} (spine ${spine}")`);
  }

  await fs.writeFile(
    path.join(printDir, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log("\nWrote print/manifest.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
