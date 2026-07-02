/**
 * Shared contract for the board's balloon variants.
 *
 * Every balloon style (clear-orb, foil-orb, inflated-silhouette, mylar-logo)
 * implements this same prop signature so they are drop-in swappable behind the
 * style switcher in BoardScene. Keep this interface stable — the switcher and
 * every variant depend on it.
 */
export type BalloonProps = {
  /** mascot PNG (transparent) used as the logo texture */
  url: string;
  /** world-space [x, y, z] the balloon hovers over (its tether point) */
  anchor: [number, number, number];
  /** center height the balloon bobs around */
  baseY: number;
  /** overall diameter of the balloon body */
  size: number;
  /** body tint (foil sheen / glass color) */
  tint?: string;
  /** vertical bob amplitude */
  float?: number;
  /** phase offset so multiple balloons don't bob in sync */
  phase?: number;
  /** bob speed */
  speed?: number;
  /** repo opened on click */
  href?: string;
  /** extra logo frames the face glances toward (Mylar headshot only) */
  glanceFrames?: string[];
  /** a short blink frame shown occasionally (Mylar headshot only) */
  blinkFrame?: string;
  /** idle personality motion layered on top of the bob: "swim" sways side to
   *  side and banks into the turn (whale/fish), "walk" bounces and turns like
   *  it's padding around (dog). Omit for a plain float. */
  behavior?: "swim" | "walk";
};

/** The balloon styles the switcher can render. */
export type BalloonVariant = "mylar" | "clear" | "foil" | "inflated" | "keychain";
