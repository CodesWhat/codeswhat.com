// Renders the CodesWhat 3D coin on a transparent canvas and mints a seamless
// spinning loop as a transparent WebP + GIF + APNG for reuse on other sites.
//
// It reuses the *real* R3F coin (same geometry, materials, lighting, dark-mode
// invert) via the dev-only /studio/coin route, drives it headlessly through the
// system Chrome (playwright-core — no bundled browser to download), reads the
// WebGL buffer per frame with canvas.toDataURL (so page chrome is irrelevant),
// then encodes with ffmpeg.
//
//   npm run coin                     # both light (lime) + dark (indigo) coins
//   npm run coin -- --dark           # just the dark coin
//   npm run coin -- --light          # just the light coin
//   npm run coin -- --size 640 --frames 90 --fps 30 --tilt 0.35
//
// Requires: dev server running (npm run dev → http://localhost:4321) and ffmpeg.
// WebP is the pick for the web: full 8-bit alpha (crisp edges), <img>-embeddable,
// a fraction of the size. GIF only has 1-bit alpha so its edge fringes; APNG is
// the lossless full-alpha fallback.

import { execFile } from "node:child_process";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { chromium } from "playwright-core";

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(root, "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/** parse `--flag value` / `--bool` from argv */
function args() {
  const a = process.argv.slice(2);
  const o = {};
  for (let i = 0; i < a.length; i++) {
    if (!a[i].startsWith("--")) continue;
    const key = a[i].slice(2);
    const next = a[i + 1];
    if (next == null || next.startsWith("--")) o[key] = true;
    else {
      o[key] = next;
      i++;
    }
  }
  return o;
}

const opt = args();
const BASE = opt.base || "http://localhost:4321";
const SIZE = Number(opt.size || 512);
const SS = Number(opt.ss || 3);
const FRAMES = Number(opt.frames || 72);
const FPS = Number(opt.fps || 30);
const TILT = opt.tilt != null ? Number(opt.tilt) : 0.32;
const outDir = path.join(repoRoot, "exports", "coin");
const framesRoot = path.join(root, ".coin-frames");

const variants =
  opt.dark && !opt.light ? ["dark"] : opt.light && !opt.dark ? ["light"] : ["light", "dark"];

/** Drive the /studio/coin page through one seamless turn, dumping PNG frames. */
async function captureFrames(page, variant, frameDir) {
  const url =
    `${BASE}/studio/coin?size=${SIZE}&ss=${SS}&tilt=${TILT}` +
    `&dark=${variant === "dark" ? 1 : 0}`;
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__coinReady === true, { timeout: 30000 });

  for (let i = 0; i < FRAMES; i++) {
    const angle = (i / FRAMES) * Math.PI * 2;
    await page.evaluate((a) => window.__coinRenderAt(a), angle);
    const dataUrl = await page.evaluate(() =>
      document.querySelector("canvas").toDataURL("image/png"),
    );
    const buf = Buffer.from(dataUrl.split(",")[1], "base64");
    await writeFile(path.join(frameDir, `frame_${String(i).padStart(3, "0")}.png`), buf);
  }
  process.stdout.write(`  ${variant}: captured ${FRAMES} frames @ ${SIZE * SS}px\n`);
}

/** Encode the PNG frames → animated WebP (full 8-bit alpha, ~1.3MB) via libwebp.
 *  sharp/libvips won't emit a true animation from a frame array here, so we shell
 *  out to img2webp: ffmpeg downscales the supersampled frames to SIZE, then
 *  img2webp assembles the loop. -lossy is required — without it libwebp encodes
 *  every alpha frame losslessly and the file balloons past the GIF. */
async function encodeWebp(frameDir, variant) {
  const webp = path.join(outDir, `coin-spin-${variant}.webp`);
  await run("ffmpeg", [
    "-y",
    "-i",
    path.join(frameDir, "frame_%03d.png"),
    "-vf",
    `scale=${SIZE}:-1:flags=lanczos`,
    path.join(frameDir, "s_%03d.png"),
  ]);
  const scaled = (await readdir(frameDir))
    .filter((f) => /^s_\d+\.png$/.test(f))
    .sort()
    .map((f) => path.join(frameDir, f));
  await run("img2webp", [
    "-loop",
    "0",
    "-d",
    String(Math.round(1000 / FPS)),
    "-lossy",
    "-q",
    "80",
    "-m",
    "6",
    ...scaled,
    "-o",
    webp,
  ]);
  return webp;
}

/** Encode PNG frames → transparent GIF (2-pass palette) + APNG + WebP. */
async function encode(frameDir, variant) {
  const seq = path.join(frameDir, "frame_%03d.png");
  const gif = path.join(outDir, `coin-spin-${variant}.gif`);
  const apng = path.join(outDir, `coin-spin-${variant}.apng.png`);
  const palette = path.join(frameDir, "palette.png");
  const scale = `scale=${SIZE}:-1:flags=lanczos`;

  // APNG — full 8-bit alpha, crisp edges, loops forever
  await run("ffmpeg", [
    "-y",
    "-framerate",
    String(FPS),
    "-i",
    seq,
    "-vf",
    scale,
    "-plays",
    "0",
    "-f",
    "apng",
    apng,
  ]);

  // GIF pass 1: build a palette that reserves a slot for transparency
  await run("ffmpeg", [
    "-y",
    "-framerate",
    String(FPS),
    "-i",
    seq,
    "-vf",
    `${scale},palettegen=reserve_transparent=1:stats_mode=full`,
    palette,
  ]);
  // GIF pass 2: map fully-transparent pixels out via alpha_threshold
  await run("ffmpeg", [
    "-y",
    "-framerate",
    String(FPS),
    "-i",
    seq,
    "-i",
    palette,
    "-lavfi",
    `${scale}[x];[x][1:v]paletteuse=alpha_threshold=128:dither=bayer:bayer_scale=3`,
    "-loop",
    "0",
    gif,
  ]);

  const webp = await encodeWebp(frameDir, variant);
  process.stdout.write(
    `  ${variant}: wrote ${[gif, apng, webp].map((f) => path.relative(repoRoot, f)).join(", ")}\n`,
  );
}

async function main() {
  await rm(framesRoot, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--use-gl=angle", "--ignore-gpu-blocklist", "--enable-webgl"],
  });
  const page = await browser.newPage({
    viewport: { width: SIZE + 40, height: SIZE + 40 },
    deviceScaleFactor: 1,
  });

  try {
    for (const variant of variants) {
      const frameDir = path.join(framesRoot, variant);
      await mkdir(frameDir, { recursive: true });
      await captureFrames(page, variant, frameDir);
      await encode(frameDir, variant);
    }
  } finally {
    await browser.close();
  }

  await rm(framesRoot, { recursive: true, force: true });
  process.stdout.write(`\ndone → ${path.relative(repoRoot, outDir)}/\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
