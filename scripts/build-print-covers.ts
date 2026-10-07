import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";
import { ROOT } from "./lib/paths.ts";

type CoverInput = {
  volumeId: string;
  volumeTitle: string;
  volumeSubtitle: string;
  pageCount: number;
  spineWidthIn: number;
  outputBasename: string;
};

type CoverSpec = {
  dpi: number;
  dustJacket: {
    heightIn: number;
    flapWidthIn: number;
    panelWidthIn: number;
    bleedIn: number;
  };
  printedCase: {
    heightIn: number;
    panelWidthIn: number;
    wrapWidthIn: number;
    bleedIn: number;
  };
};

async function loadCoverSpec(): Promise<CoverSpec> {
  const config = JSON.parse(
    await fs.readFile(path.join(ROOT, "print/config.json"), "utf8"),
  );
  return config.cover as CoverSpec;
}

function dustJacketWidthIn(spec: CoverSpec, spineIn: number): number {
  const d = spec.dustJacket;
  return (
    2 * d.bleedIn + 2 * d.flapWidthIn + 2 * d.panelWidthIn + spineIn
  );
}

function printedCaseWidthIn(spec: CoverSpec, spineIn: number): number {
  const c = spec.printedCase;
  return 2 * c.bleedIn + 2 * c.wrapWidthIn + 2 * c.panelWidthIn + spineIn;
}

function coverHtml(opts: {
  type: "dust" | "case";
  totalWidthIn: number;
  heightIn: number;
  spineIn: number;
  panelIn: number;
  flapIn: number;
  wrapIn: number;
  volumeTitle: string;
  volumeSubtitle: string;
  pageCount: number;
}): string {
  const bg = "#1e3a5f";
  const accent = "#c9a962";
  const text = "#f5f0e6";
  const spinePx = opts.spineIn;
  const panelPx = opts.panelIn;
  const flapPx = opts.flapIn;
  const wrapPx = opts.wrapIn;

  const panels =
    opts.type === "dust"
      ? `
    <div class="flap"></div>
    <div class="panel back"><p>Unofficial fan compilation of Paul Graham&apos;s essays. Not for sale.</p></div>
    <div class="spine"><div class="spine-text">The Grahamanack · ${opts.volumeTitle} · Paul Graham</div></div>
    <div class="panel front">
      <div class="vol">${opts.volumeTitle}</div>
      <h1>The Grahamanack</h1>
      <p class="sub">${opts.volumeSubtitle}</p>
      <p class="meta">${opts.pageCount} pages · private Lulu edition</p>
    </div>
    <div class="flap"></div>`
      : `
    <div class="wrap"></div>
    <div class="panel back"></div>
    <div class="spine"><div class="spine-text">The Grahamanack · ${opts.volumeTitle}</div></div>
    <div class="panel front">
      <div class="vol">${opts.volumeTitle}</div>
      <h1>The Grahamanack</h1>
    </div>
    <div class="wrap"></div>`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  @page { margin: 0; size: ${opts.totalWidthIn}in ${opts.heightIn}in; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: ${opts.totalWidthIn}in;
    height: ${opts.heightIn}in;
    display: flex;
    flex-direction: row;
    font-family: Georgia, 'Times New Roman', serif;
    background: ${bg};
    color: ${text};
  }
  .flap { width: ${flapPx}in; height: 100%; background: ${bg}; }
  .wrap { width: ${wrapPx}in; height: 100%; background: ${bg}; }
  .panel {
    width: ${panelPx}in;
    height: 100%;
    padding: 0.6in 0.5in;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }
  .panel.back { font-size: 11pt; line-height: 1.5; opacity: 0.9; }
  .spine {
    width: ${spinePx}in;
    height: 100%;
    background: #0f1f33;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .spine-text {
    transform: rotate(90deg);
    white-space: nowrap;
    font-size: 9pt;
    letter-spacing: 0.08em;
    color: ${accent};
  }
  h1 { font-size: 28pt; font-weight: normal; margin: 0.2in 0; }
  .vol { font-size: 14pt; color: ${accent}; letter-spacing: 0.12em; text-transform: uppercase; }
  .sub { font-size: 12pt; max-width: 4in; line-height: 1.4; margin-top: 0.15in; }
  .meta { font-size: 9pt; margin-top: 0.35in; opacity: 0.75; }
</style></head>
<body>${panels}</body></html>`;
}

async function renderCoverPdf(
  html: string,
  outPath: string,
  widthIn: number,
  heightIn: number,
  dpi: number,
): Promise<void> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.setViewport({
      width: Math.round(widthIn * 96),
      height: Math.round(heightIn * 96),
      deviceScaleFactor: dpi / 96,
    });
    await page.pdf({
      path: outPath,
      width: `${widthIn}in`,
      height: `${heightIn}in`,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
  } finally {
    await browser.close();
  }
}

export async function buildPrintCovers(input: CoverInput): Promise<{
  dustJacket: string;
  printedCase: string;
}> {
  const spec = await loadCoverSpec();
  const coverDir = path.join(ROOT, "print/covers");
  const publicDir = path.join(ROOT, "public/print");
  await fs.mkdir(coverDir, { recursive: true });
  await fs.mkdir(publicDir, { recursive: true });

  const dustW = dustJacketWidthIn(spec, input.spineWidthIn);
  const caseW = printedCaseWidthIn(spec, input.spineWidthIn);
  const dustH = spec.dustJacket.heightIn;
  const caseH = spec.printedCase.heightIn;

  const dustHtml = coverHtml({
    type: "dust",
    totalWidthIn: dustW,
    heightIn: dustH,
    spineIn: input.spineWidthIn,
    panelIn: spec.dustJacket.panelWidthIn,
    flapIn: spec.dustJacket.flapWidthIn,
    wrapIn: 0,
    volumeTitle: input.volumeTitle,
    volumeSubtitle: input.volumeSubtitle,
    pageCount: input.pageCount,
  });

  const caseHtml = coverHtml({
    type: "case",
    totalWidthIn: caseW,
    heightIn: caseH,
    spineIn: input.spineWidthIn,
    panelIn: spec.printedCase.panelWidthIn,
    flapIn: 0,
    wrapIn: spec.printedCase.wrapWidthIn,
    volumeTitle: input.volumeTitle,
    volumeSubtitle: input.volumeSubtitle,
    pageCount: input.pageCount,
  });

  const dustName = `${input.outputBasename}-dust-jacket.pdf`;
  const caseName = `${input.outputBasename}-printed-case.pdf`;
  const dustPath = path.join(coverDir, dustName);
  const casePath = path.join(coverDir, caseName);

  await renderCoverPdf(dustHtml, dustPath, dustW, dustH, spec.dpi);
  await renderCoverPdf(caseHtml, casePath, caseW, caseH, spec.dpi);

  await fs.copyFile(dustPath, path.join(publicDir, dustName));
  await fs.copyFile(casePath, path.join(publicDir, caseName));

  return { dustJacket: dustPath, printedCase: casePath };
}
