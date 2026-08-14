// Mints CodesWhat brand assets from the live 3D scene: renders a subject on a
// transparent canvas via a dev-only /studio route, drives it headlessly through
// the system Chrome (playwright-core — no bundled browser), reads the WebGL
// buffer per frame with canvas.toDataURL, then encodes with ffmpeg + img2webp.
//
//   npm run coin                         # coin spin, light + dark
//   npm run balloon                      # portkey balloon: avatar still + spin
//   npm run balloon -- --balloon drydock # a different mascot
//   npm run balloon -- --still           # just the avatar   (--spin for just the loop)
//   npm run balloon -- --both            # light + dark variants
//   shared flags: --size 512 --ss 3 --frames 72 --fps 30 --tilt --world --angle
//
// Requires the dev server (npm run dev → http://localhost:4321) + ffmpeg/img2webp.
// Spins emit WebP (full 8-bit alpha, ~1.3MB, the pick), plus GIF/APNG fallbacks.
// Stills emit a transparent square PNG — the icon/avatar.

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
const DELAY = String(Math.round(1000 / FPS));
const framesRoot = path.join(root, ".capture-frames");
const SUBJECT = opt.subject || "coin";
const BALLOON = typeof opt.balloon === "string" ? opt.balloon : "portkey";

function variantList(fallback) {
  if (opt.both) return ["light", "dark"];
  if (opt.dark && !opt.light) return ["dark"];
  if (opt.light && !opt.dark) return ["light"];
  return fallback;
}

/** Resolve the capture plan for the requested subject. */
function buildPlan() {
  if (SUBJECT === "coin") {
    const tilt = opt.tilt != null ? Number(opt.tilt) : 0.32;
    return {
      outDir: path.join(repoRoot, "exports", "coin"),
      variants: variantList(["light", "dark"]),
      route: (v) => `/studio/coin?size=${SIZE}&ss=${SS}&tilt=${tilt}&dark=${v === "dark" ? 1 : 0}`,
      still: false,
      spin: true,
      spinName: (v) => `coin-spin-${v}`,
    };
  }
  // balloon mascot → avatar still + spin
  const tilt = opt.tilt != null ? Number(opt.tilt) : 0.3;
  const world = opt.world != null ? Number(opt.world) : 3.3;
  const stillAngle = opt.angle != null ? Number(opt.angle) : 0.5; // hero 3/4 view
  const onlyStill = opt.still && !opt.spin;
  const onlySpin = opt.spin && !opt.still;
  return {
    outDir: path.join(repoRoot, "exports", BALLOON),
    variants: variantList(["light"]),
    route: (v) =>
      `/studio/balloon?balloon=${BALLOON}&size=${SIZE}&ss=${SS}&tilt=${tilt}&world=${world}` +
      `&dark=${v === "dark" ? 1 : 0}`,
    still: !onlySpin,
    spin: !onlyStill,
    stillAngle,
    stillName: (v) => `${BALLOON}-balloon-avatar${v === "dark" ? "-dark" : ""}`,
    spinName: (v) => `${BALLOON}-balloon-spin-${v}`,
  };
}

/** Read the current transparent WebGL buffer as PNG bytes. */
async function grab(page) {
  const dataUrl = await page.evaluate(() =>
    document.querySelector("canvas").toDataURL("image/png"),
  );
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

/** Render one pinned angle → a downscaled transparent PNG (the icon/avatar). */
async function renderStill(page, angle, outPath) {
  await page.evaluate((a) => window.__captureRenderAt(a), angle);
  await mkdir(framesRoot, { recursive: true });
  const tmp = path.join(framesRoot, "still.png");
  await writeFile(tmp, await grab(page));
  await run("ffmpeg", ["-y", "-i", tmp, "-vf", `scale=${SIZE}:-1:flags=lanczos`, outPath]);
}

/** Sweep 0→2π, dumping one PNG frame per step for a seamless loop. */
async function dumpFrames(page, frameDir) {
  await mkdir(frameDir, { recursive: true });
  for (let i = 0; i < FRAMES; i++) {
    const angle = (i / FRAMES) * Math.PI * 2;
    await page.evaluate((a) => window.__captureRenderAt(a), angle);
    await writeFile(
      path.join(frameDir, `frame_${String(i).padStart(3, "0")}.png`),
      await grab(page),
    );
  }
}

/** Frames → GIF (2-pass palette) + APNG + animated WebP, named from outBase. */
async function encodeSpin(frameDir, outBase) {
  const seq = path.join(frameDir, "frame_%03d.png");
  const scale = `scale=${SIZE}:-1:flags=lanczos`;
  const palette = path.join(frameDir, "palette.png");

  // APNG — full 8-bit alpha, lossless
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
    `${outBase}.apng.png`,
  ]);
  // GIF — 1-bit alpha via a palette that reserves a transparent slot
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
    `${outBase}.gif`,
  ]);
  // WebP — full 8-bit alpha, small; downscale then img2webp (-lossy is required
  // or libwebp encodes every alpha frame losslessly and the file balloons)
  await run("ffmpeg", ["-y", "-i", seq, "-vf", scale, path.join(frameDir, "s_%03d.png")]);
  const scaled = (await readdir(frameDir))
    .filter((f) => /^s_\d+\.png$/.test(f))
    .sort()
    .map((f) => path.join(frameDir, f));
  await run("img2webp", [
    "-loop",
    "0",
    "-d",
    DELAY,
    "-lossy",
    "-q",
    "80",
    "-m",
    "6",
    ...scaled,
    "-o",
    `${outBase}.webp`,
  ]);
}

async function main() {
  const plan = buildPlan();
  await rm(framesRoot, { recursive: true, force: true });
  await mkdir(plan.outDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--use-gl=angle", "--ignore-gpu-blocklist", "--enable-webgl"],
  });
  const page = await browser.newPage({
    viewport: { width: SIZE + 40, height: SIZE + 40 },
    deviceScaleFactor: 1,
  });

  const wrote = [];
  try {
    for (const v of plan.variants) {
      await page.goto(BASE + plan.route(v), { waitUntil: "networkidle" });
      await page.waitForFunction(() => window.__captureReady === true, { timeout: 30000 });

      if (plan.still) {
        const out = path.join(plan.outDir, `${plan.stillName(v)}.png`);
        await renderStill(page, plan.stillAngle, out);
        wrote.push(out);
      }
      if (plan.spin) {
        const frameDir = path.join(framesRoot, `${SUBJECT}-${v}`);
        await dumpFrames(page, frameDir);
        const outBase = path.join(plan.outDir, plan.spinName(v));
        await encodeSpin(frameDir, outBase);
        wrote.push(`${outBase}.webp`);
      }
      process.stdout.write(`  ${v}: done\n`);
    }
  } finally {
    await browser.close();
  }

  await rm(framesRoot, { recursive: true, force: true });
  process.stdout.write(
    `\nwrote:\n${wrote.map((f) => `  ${path.relative(repoRoot, f)}`).join("\n")}\n`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
