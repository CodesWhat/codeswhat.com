import { type Palette, SPRITES } from "./sprites";

const BASE: Palette = { k: "var(--ink)" };

/** Longest side across the whole set, so one integer scale fits every sprite and they all share an art-pixel size. */
const SET_MAX = Math.max(
  ...Object.values(SPRITES).flatMap((a) => [a.rows.length, ...a.rows.map((r) => r.length)]),
);

/**
 * Draws a row-string sprite as whole-pixel SVG paths, one path per colour. Width and height are
 * the grid size times an integer scale, so every art pixel lands on whole CSS pixels.
 */
export function Sprite({
  slug,
  scale,
  fit,
  label,
  decorative = false,
  className,
}: {
  slug: string;
  scale: number;
  /** when set, the largest whole-number scale that keeps the biggest sprite in the set inside a fit x fit box, so every sprite uses the same scale */
  fit?: number;
  label: string;
  decorative?: boolean;
  className?: string;
}) {
  const art = SPRITES[slug];
  if (!art) throw new Error(`no sprite for ${slug}`);
  const colors = { ...BASE, ...art.palette };
  const w = Math.max(...art.rows.map((r) => r.length));
  const h = art.rows.length;
  const px = fit ? Math.max(1, Math.floor(fit / SET_MAX)) : scale;
  const paths = new Map<string, string>();
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
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w * px}
      height={h * px}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
      shapeRendering="crispEdges"
      className={className}
      style={{ maxWidth: "100%", height: "auto" }}
    >
      {[...paths].map(([ch, d]) => (
        <path key={ch} d={d} style={{ fill: colors[ch] }} />
      ))}
    </svg>
  );
}
