#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import { execSync, spawnSync } from "node:child_process";
import matter from "gray-matter";
import {
  CONTENT_DIR,
  DOWNLOADS_DIR,
  GENERATED_DIR,
  PUBLIC_DIR,
  ROOT,
} from "./lib/paths.ts";

const BOOK_TITLE = "The Grahamanack";
const SUBTITLE = "Paul Graham's essays — an unofficial fan compilation";

const FRONT_MATTER = `${BOOK_TITLE}

${SUBTITLE}

---

**About this edition**

This is an unofficial, non-commercial fan compilation. It is not endorsed by Paul Graham. Every essay is copyright Paul Graham; each piece links to its original at [paulgraham.com](https://paulgraham.com). This book is free to download and share. It is not for sale.

No ads. No payments. No email capture.

---

`;

function hasPandoc(): boolean {
  try {
    execSync("pandoc --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function hasCalibre(): boolean {
  try {
    execSync("ebook-convert --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function buildCombinedMarkdown(): Promise<string> {
  const siteData = JSON.parse(
    await fs.readFile(path.join(GENERATED_DIR, "site-data.json"), "utf8"),
  );
  let md = FRONT_MATTER + `\n# Table of Contents\n\n`;
  for (const part of siteData.parts) {
    md += `\n## ${part.number}. ${part.title}\n\n*${part.subtitle}*\n\n`;
    for (const e of part.essays) {
      md += `- [${e.title}](#${e.slug})\n`;
    }
  }
  md += `\n\\newpage\n\n`;

  for (const part of siteData.parts) {
    md += `\n# ${part.number}. ${part.title}\n\n*${part.subtitle}*\n\n\\newpage\n\n`;
    for (const e of part.essays) {
      const raw = await fs.readFile(path.join(CONTENT_DIR, `${e.slug}.md`), "utf8");
      const { data, content } = matter(raw);
      md += `\n# ${data.title}\n\n`;
      if (data.date) md += `*Originally published ${data.date}.*\n\n`;
      md += `[Read on paulgraham.com](${data.url})\n\n`;
      md += content.trim() + "\n\n\\newpage\n\n";
    }
  }
  return md;
}

async function main() {
  const combinedPath = path.join(GENERATED_DIR, "grahamanack-combined.md");
  await fs.mkdir(GENERATED_DIR, { recursive: true });
  await fs.mkdir(DOWNLOADS_DIR, { recursive: true });

  console.log("Assembling combined manuscript…");
  const md = await buildCombinedMarkdown();
  await fs.writeFile(combinedPath, md);

  const epubOut = path.join(DOWNLOADS_DIR, "grahamanack.epub");
  const pdfOut = path.join(DOWNLOADS_DIR, "grahamanack.pdf");
  const mobiOut = path.join(DOWNLOADS_DIR, "grahamanack.mobi");
  const cover = path.join(PUBLIC_DIR, "images/cover.svg");

  if (!hasPandoc()) {
    console.warn("pandoc not found — skipping EPUB/PDF. Install pandoc + texlive-xetex.");
    await fs.writeFile(
      path.join(DOWNLOADS_DIR, "BUILD-NOTES.txt"),
      "Install pandoc and texlive-xetex, then run npm run build:books\n",
    );
    return;
  }

  console.log("Building EPUB…");
  const epubFrom = "markdown-yaml_metadata_block-raw_tex-smart";
  const pdfFrom = "commonmark";

  const epubArgs = [
    combinedPath,
    "-f",
    epubFrom,
    "-o",
    epubOut,
    "--toc",
    "--toc-depth=2",
    "--metadata",
    `title=${BOOK_TITLE}`,
    "--metadata",
    "author=Paul Graham (compiled unofficially)",
    "--metadata",
    "lang=en-US",
  ];
  const coverPng = path.join(PUBLIC_DIR, "images/cover.png");
  if (await fs.stat(coverPng).catch(() => null)) {
    epubArgs.push("--epub-cover-image", coverPng);
  }
  const epubRun = spawnSync("pandoc", epubArgs, { stdio: "inherit", cwd: ROOT });
  if (epubRun.status !== 0) throw new Error("EPUB build failed");

  console.log("Building PDF…");
  const latexHeader = path.join(GENERATED_DIR, "pdf-header.tex");
  await fs.writeFile(
    latexHeader,
    String.raw`\usepackage{geometry}
\geometry{margin=1in}
\usepackage{setspace}
\setstretch{1.15}
\usepackage{hyperref}
\usepackage{titlesec}
\titleformat{\chapter}{\huge\bfseries}{\thechapter}{1em}{}
`,
  );
  const pdfArgs = [
    combinedPath,
    "-f",
    pdfFrom,
    "-o",
    pdfOut,
    "--pdf-engine=xelatex",
    "-V",
    "documentclass=book",
    "-V",
    "fontsize=11pt",
    "-V",
    "mainfont=TeX Gyre Termes",
    "-V",
    "geometry:margin=1in",
    "--toc",
    "--toc-depth=2",
    "-H",
    latexHeader,
  ];
  let pdfRun = spawnSync("pandoc", pdfArgs, { stdio: "inherit", cwd: ROOT });
  if (pdfRun.status !== 0) {
    console.warn("PDF build failed (xelatex). Trying pdflatex…");
    pdfRun = spawnSync(
      "pandoc",
      [
        combinedPath,
        "-f",
        pdfFrom,
        "-o",
        pdfOut,
        "-V",
        "documentclass=book",
        "--toc",
        "--toc-depth=2",
      ],
      { stdio: "inherit", cwd: ROOT },
    );
    if (pdfRun.status !== 0) throw new Error("PDF build failed");
  }

  if (hasCalibre()) {
    console.log("Building MOBI via Calibre…");
    execSync(
      `ebook-convert ${JSON.stringify(epubOut)} ${JSON.stringify(mobiOut)}`,
      { stdio: "inherit" },
    );
  } else {
    console.warn(
      "Calibre ebook-convert not found — MOBI skipped. EPUB works on most readers; install calibre for MOBI.",
    );
    await fs.writeFile(
      path.join(DOWNLOADS_DIR, "grahamanack-mobi-note.txt"),
      "MOBI was not generated. Install Calibre and run: ebook-convert public/downloads/grahamanack.epub public/downloads/grahamanack.mobi\n",
    );
  }

  for (const f of ["grahamanack.epub", "grahamanack.pdf", "grahamanack.mobi"]) {
    const p = path.join(DOWNLOADS_DIR, f);
    try {
      const st = await fs.stat(p);
      console.log(`${f}: ${(st.size / 1024 / 1024).toFixed(2)} MB`);
    } catch {
      /* optional */
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
