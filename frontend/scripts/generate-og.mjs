// Generates the social/OG card as a static PNG (public/og.png).
// Concept: the real CodesWhat emblem tiled across the whole board in a dim blue
// (hue-shifted) variant, with the full lime emblem dropped big in the center on
// a soft halo. Run: npm run og

import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOGO = path.join(root, "public/logos/codeswhat-logo-green.png");
const OUT = path.join(root, "public/og.png");

const W = 1200;
const H = 630;
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

/** The emblem, hue-rotated (lime -> blue) and dimmed to `alphaScale` opacity. */
async function tintedMark(size, hue, alphaScale) {
  const { data, info } = await sharp(LOGO)
    .resize(size, size, { fit: "contain", background: transparent })
    .modulate({ hue })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) data[i] = Math.round(data[i] * alphaScale);
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

/** Center a mark in a padded transparent cell (gives the tiles breathing room). */
async function cell(size, mark) {
  return sharp({ create: { width: size, height: size, channels: 4, background: transparent } })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toBuffer();
}

async function main() {
  // dark background, faint lime/blue drift toward the upper-left
  const bg = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g" cx="32%" cy="30%" r="95%">
          <stop offset="0" stop-color="#10190f"/>
          <stop offset="52%" stop-color="#0a1016"/>
          <stop offset="100%" stop-color="#050607"/>
        </radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
    </svg>`,
  );

  // blue emblem tiled across the whole board
  const fieldTile = await cell(86, await tintedMark(60, 175, 0.24));
  const field = await sharp({
    create: { width: W, height: H, channels: 4, background: transparent },
  })
    .composite([{ input: fieldTile, tile: true }])
    .png()
    .toBuffer();

  // soft lime halo so the hero mark separates from the field
  const halo = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="h" cx="50%" cy="50%" r="50%">
          <stop offset="0" stop-color="#c4ff00" stop-opacity="0.22"/>
          <stop offset="55%" stop-color="#c4ff00" stop-opacity="0.06"/>
          <stop offset="100%" stop-color="#c4ff00" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <ellipse cx="${W / 2}" cy="${H / 2}" rx="330" ry="300" fill="url(#h)"/>
    </svg>`,
  );

  // the real lime emblem, big, in the center
  const heroSize = 340;
  const hero = await sharp(LOGO)
    .resize(heroSize, heroSize, { fit: "contain", background: transparent })
    .png()
    .toBuffer();

  await sharp(await sharp(bg).png().toBuffer())
    .composite([
      { input: field, blend: "over" },
      { input: halo, blend: "over" },
      { input: hero, gravity: "center" },
    ])
    .png()
    .toFile(OUT);

  console.log(`wrote ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
