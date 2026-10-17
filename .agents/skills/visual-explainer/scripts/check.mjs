// Drives every figure through every state, screenshots each one, and audits what a reviewer would miss.
//
//   node check.mjs PAGE.html OUT_DIR [--widths 1440,390] [--only figId,figId]
//
// Errors (exit 1): a page or console error, horizontal page scroll, SVG text outside its viewBox.
// Warnings: two labels overlapping. Screenshots are the real check; this only points at where to look.
// A real browser is needed: only a layout engine can say where text actually lands.
// Uses CHROMIUM_PATH if set, else an installed Chrome or Edge, else Playwright's own Chromium
// (`npx playwright install chromium`, only needed when neither browser is installed).
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : dflt };
const widths = opt("--widths", "1440,390").split(",").map(Number);
const only = opt("--only", "");
const [pagePath, outDir] = args;
if (!pagePath || !outDir) { console.error("usage: node check.mjs PAGE.html OUT_DIR [--widths 1440,390] [--only a,b]"); process.exit(2) }
mkdirSync(outDir, { recursive: true });

async function launch() {
  const tries = process.env.CHROMIUM_PATH ? [{ executablePath: process.env.CHROMIUM_PATH }] : [{ channel: "chrome" }, { channel: "msedge" }, {}];
  for (const t of tries) { try { return await chromium.launch(t) } catch { /* next */ } }
  console.error("No browser found: install Chrome, set CHROMIUM_PATH, or run `npx playwright install chromium`."); process.exit(2);
}
const browser = await launch();
const report = { errors: [], warnings: [], shots: [] };

// Runs in the page: every text's box against the viewBox and against every other text.
function audit(id) {
  const svg = document.getElementById(id), vb = svg.viewBox.baseVal, out = { clipped: [], overlaps: [] };
  const boxes = [...svg.querySelectorAll("text")].filter(t => t.textContent.trim() && getComputedStyle(t).display !== "none" && +(t.getAttribute("opacity") ?? 1) > .15)
    .map(t => { const b = t.getBBox(); return { t: t.textContent.trim(), x: b.x, y: b.y, w: b.width, h: b.height } });
  for (const b of boxes) if (b.x < vb.x - 1 || b.y < vb.y - 1 || b.x + b.w > vb.x + vb.width + 1 || b.y + b.h > vb.y + vb.height + 1) out.clipped.push(b.t);
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (ix > 2 && iy > 2 && ix * iy > .15 * Math.min(a.w * a.h, b.w * b.h)) out.overlaps.push(`"${a.t}" × "${b.t}"`);
  }
  return out;
}

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  page.on("pageerror", e => report.errors.push(`[${width}] page error: ${e.message}`));
  page.on("console", m => { if (m.type() === "error") report.errors.push(`[${width}] console: ${m.text()}`) });
  await page.goto("file://" + resolve(pagePath));
  await page.waitForTimeout(400);
  const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  if (sw > cw) report.errors.push(`[${width}] page scrolls sideways: scrollWidth ${sw} > ${cw}`);
  const ids = (await page.$$eval("figure svg.flat", s => s.map(x => x.id))).filter(id => !only || only.split(",").includes(id));
  for (const id of ids) {
    // reveal a figure inside a hidden tab before driving it
    await page.evaluate(id => { const p = document.getElementById(id).closest("[role=tabpanel]"); if (p && p.hidden) document.querySelector(`[aria-controls="${p.id}"]`).click() }, id);
    const fig = await (await page.$("#" + id)).evaluateHandle(e => e.closest("figure"));
    const shot = async label => {
      await page.waitForTimeout(120);
      const a = await page.evaluate(audit, id);
      a.clipped.forEach(t => report.errors.push(`[${width}] ${id} ${label}: text outside the viewBox: "${t}"`));
      a.overlaps.forEach(o => report.warnings.push(`[${width}] ${id} ${label}: labels overlap ${o}`));
      const path = `${outDir}/${id}-${width}-${label}.png`;
      await fig.asElement().scrollIntoViewIfNeeded();
      await fig.asElement().screenshot({ path });
      report.shots.push(path);
    };
    const has = async sel => (await page.$(sel)) !== null;
    const drive = async prefix => {
      let n = 1; await shot(`${prefix}01`);
      while (await has(`#${id}Next`) && !(await page.$eval(`#${id}Next`, b => b.disabled)) && n < 60) {
        await page.click(`#${id}Next`); n++; await shot(prefix + String(n).padStart(2, "0"));
      }
    };
    const acts = await page.$$(`#${id}Act button`);
    if (acts.length) {
      for (let i = 0; i < acts.length; i++) {
        const b = (await page.$$(`#${id}Act button`))[i];
        const k = await b.getAttribute("data-k"); await b.click();
        if (await has(`#${id}Next`)) await drive(`${k}-`); else await shot(k);
      }
    } else if (await has(`#${id}Next`)) await drive("step");
    else await shot("static");
  }
  await page.close();
}
await browser.close();
writeFileSync(`${outDir}/report.json`, JSON.stringify(report, null, 2));
console.log(`${report.shots.length} screenshots in ${outDir}`);
console.log(report.errors.length ? `ERRORS (${report.errors.length}):\n  ` + report.errors.join("\n  ") : "no errors");
if (report.warnings.length) console.log(`WARNINGS (${report.warnings.length}):\n  ` + [...new Set(report.warnings)].join("\n  "));
process.exit(report.errors.length ? 1 : 0);
