// Renders the Catalogue share cards with headless Chrome: public/og.png (home),
// public/og/support.png and public/og/<slug>.png. Fonts and sprites are inlined, nothing is
// fetched at render time. Run: npm run og
import { mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { SPRITES } from "../components/catalogue/sprites.ts";
import { SPECIMENS } from "../lib/specimens.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(here, "../public");
const MAX_BYTES = 300 * 1024;

const font = async (file) =>
  `data:font/woff2;base64,${(await readFile(path.join(here, "og-fonts", file))).toString("base64")}`;
const [serif, italic, sans, mono] = await Promise.all([
  font("instrument-serif-latin-400-normal.woff2"),
  font("instrument-serif-latin-400-italic.woff2"),
  font("instrument-sans-latin-wght-normal.woff2"),
  font("jetbrains-mono-latin-wght-normal.woff2"),
]);

/** Row-string sprite to whole-pixel inline SVG, one path per colour (same scheme as Sprite.tsx). */
function sprite(slug, px) {
  const art = SPRITES[slug];
  if (!art) throw new Error(`no sprite for ${slug}`);
  const colors = { k: "#111827", ...art.palette };
  const w = Math.max(...art.rows.map((r) => r.length));
  const h = art.rows.length;
  const paths = new Map();
  art.rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      if (ch !== "." && colors[ch]) {
        paths.set(ch, `${paths.get(ch) ?? ""}M${x} ${y}h${end - x}v1h-${end - x}z`);
      }
      x = end;
    }
  });
  const body = [...paths].map(([ch, d]) => `<path d="${d}" fill="${colors[ch]}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * px}" height="${h * px}" shape-rendering="crispEdges">${body}</svg>`;
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const CSS = `
@font-face { font-family: Serif; src: url('${serif}'); }
@font-face { font-family: Serif; font-style: italic; src: url('${italic}'); }
@font-face { font-family: Sans; src: url('${sans}'); font-weight: 400 700; }
@font-face { font-family: Mono; src: url('${mono}'); font-weight: 100 800; }
* { box-sizing: border-box; }
body { margin: 0; width: 1200px; height: 630px; background: #fff; color: #111827; position: relative; overflow: hidden; }
.brand { position: absolute; top: 48px; left: 64px; display: flex; align-items: center; gap: 14px; font: 40px Serif; letter-spacing: -1px; }
.brand .q { font-style: normal; background: #d3e58b; padding: 0 4px; margin-left: 1px; }
.label { position: absolute; top: 132px; left: 66px; font: 500 14px Mono; letter-spacing: 2px; text-transform: uppercase; }
h1 { position: absolute; left: 62px; top: 168px; margin: 0; width: 640px; height: 268px; overflow: hidden; font: 400 84px/1.02 Serif; letter-spacing: -2px; }
h1.narrow { width: 560px; }
h1 em, .name em { font-style: italic; background: #d3e58b; padding: 0 .1em; margin: 0 -.1em; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
.sub { position: absolute; left: 66px; top: 452px; width: 600px; margin: 0; font: 24px/1.4 Sans; color: #4b5563; }
.dots { position: absolute; top: 96px; right: 36px; width: 430px; height: 410px; background: radial-gradient(#b3bdb6 1.2px, transparent 1.2px) 0 0 / 22px 22px; opacity: .6; }
.paper { position: absolute; display: flex; flex-wrap: wrap; align-content: center; justify-content: center; border: 1px solid #111827; border-radius: 6px; background: #f8f9fa; box-shadow: 8px 8px 0 #d3e58b; }
.paper.coll { right: 44px; top: 140px; width: 420px; height: 320px; transform: rotate(2deg); gap: 18px 0; padding: 20px 12px 44px; }
.paper.coll .cell { width: 96px; height: 100px; display: flex; align-items: center; justify-content: center; }
.paper .fig { position: absolute; left: 16px; bottom: 10px; font: 500 12px Mono; letter-spacing: 2px; text-transform: uppercase; color: #4b5563; }
.paper.big { right: 64px; top: 112px; width: 400px; height: 380px; padding-bottom: 36px; transform: rotate(2deg); display: flex; align-items: center; justify-content: center; }
.name { position: absolute; left: 62px; top: 168px; margin: 0; width: 640px; height: 112px; overflow: hidden; font: 400 96px/1.1 Serif; letter-spacing: -2px; white-space: nowrap; }
.latin { position: absolute; left: 66px; top: 282px; margin: 0; font: italic 38px/1.3 Serif; color: #4b5563; }
.tiers { position: absolute; left: 66px; top: 440px; display: flex; gap: 12px; }
.tiers span { border: 1px solid #111827; border-radius: 999px; padding: 10px 20px; font: 500 20px Mono; background: #fff; }
.tiers span:nth-child(odd) { background: #d3e58b; }
footer { position: absolute; left: 66px; right: 66px; bottom: 36px; padding-top: 18px; border-top: 2px solid #111827; display: flex; justify-content: space-between; align-items: center; font: 500 14px Mono; letter-spacing: 1.5px; text-transform: uppercase; }
footer .l { display: flex; align-items: center; gap: 12px; }
`;

function page(body) {
  const coin = sprite("coin", 1);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${body.replaceAll("{{COIN}}", coin)}</body></html>`;
}

const brand = `<div class="brand">${sprite("coin", 1).replace('width="32" height="32"', 'width="40" height="40"')}<span>CodesWhat<em class="q">?</em></span></div>`;
const footer = (left) =>
  `<footer><span class="l">${left}</span><span>codeswhat.com</span></footer>`;

const HOME_SLUGS = SPECIMENS.map((s) => s.slug);
const cards = [
  {
    out: path.join(publicDir, "og.png"),
    html: page(`${brand}
      <div class="label">Catalogue of small tools</div>
      <h1>One developer. A lot of agents. <em>Small, sharp</em> tools.</h1>
      <div class="dots"></div>
      <div class="paper coll">${HOME_SLUGS.map((s) => `<div class="cell">${sprite(s, 3)}</div>`).join("")}<span class="fig">Fig. 1 · The collection</span></div>
      ${footer("Open-source developer tools and apps")}`),
  },
  {
    out: path.join(publicDir, "og/support.png"),
    html: page(`${brand}
      <div class="label">Support</div>
      <h1 class="narrow">Feed the <em>specimens.</em></h1>
      <div class="tiers"><span>$5</span><span>$10</span><span>$25</span><span>$100 a month</span></div>
      <div class="dots"></div>
      <div class="paper coll">${HOME_SLUGS.map((s) => `<div class="cell">${sprite(s, 3)}</div>`).join("")}<span class="fig">Fig. 1 · The collection</span></div>
      ${footer("Open-source developer tools and apps")}`),
  },
  ...SPECIMENS.map((s) => {
    const art = SPRITES[s.slug];
    const w = Math.max(...art.rows.map((r) => r.length));
    const px = Math.floor(300 / Math.max(w, art.rows.length)) || 1;
    return {
      out: path.join(publicDir, `og/${s.slug}.png`),
      html: page(`${brand}
        <div class="label">Plate ${esc(s.no)} · ${esc(s.kind)}</div>
        <div class="name" style="font-size:${s.name.length > 12 ? 68 : 96}px"><em>${esc(s.name)}</em></div>
        <p class="latin">${esc(s.latin)}</p>
        <p class="sub" style="top:360px">${esc(s.tagline)}</p>
        <div class="dots"></div>
        <div class="paper big">${sprite(s.slug, Math.max(px, 8))}<span class="fig">Plate ${esc(s.no)} · ${esc(s.kind)}</span></div>
        ${footer("A CodesWhat project")}`),
    };
  }),
];

await mkdir(path.join(publicDir, "og"), { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
try {
  const pg = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const card of cards) {
    await pg.setContent(card.html);
    await pg.evaluate(() => document.fonts.ready);
    const fits = await pg.evaluate(() =>
      [...document.querySelectorAll("h1, .name, .sub, .latin")].every(
        (el) => el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight <= el.clientHeight + 1 &&
          el.getBoundingClientRect().bottom < 590,
      ),
    );
    if (!fits) throw new Error(`Headline overflows its box: ${path.basename(card.out)}`);
    await pg.screenshot({ path: card.out });
    const { size } = await stat(card.out);
    if (size > MAX_BYTES) throw new Error(`${path.basename(card.out)} is ${size} bytes, over ${MAX_BYTES}`);
    console.log(`Rendered ${path.relative(publicDir, card.out)} (${(size / 1024).toFixed(0)} KB)`);
  }
} finally {
  await browser.close();
}
