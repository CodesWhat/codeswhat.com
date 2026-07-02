/**
 * Prop contract for the Mylar mascot balloon used in the homepage's floating
 * 3D scene (see components/site/FloatingSceneCanvas). Kept as its own type so
 * the scene and the balloon component share one signature.
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
  /** idle personality motion layered on top of the bob: "swim" glides side to
   *  side and turns around at each end (whale/fish), "walk" bounces and turns
   *  like it's padding around (dog), "flap" waves back and forth in place like
   *  a bird flapping. Omit for a plain float. */
  behavior?: "swim" | "walk" | "flap";
  /** radians/sec of continuous yaw. When set the balloon spins a full 360 to
   *  show off both foil faces instead of billboarding toward the camera. */
  spin?: number;
  /** whether to hang the tether string below the balloon (default true). Turn
   *  off for free-floating balloons where a dangling string reads wrong. */
  showString?: boolean;
  /** dark mode: invert the baked foil colors (the brand's dark-mode treatment —
   *  green→blue, blue→red, etc). The headshot opts out so faces don't go negative. */
  dark?: boolean;
  /** dev-only capture (scripts/capture-assets.mjs): when set, freeze all idle
   *  motion (bob, roll, behavior, collision, glance) and pin the yaw to this
   *  angle so the balloon can be rendered as a still icon or a seamless spin.
   *  A function is read live each frame so the capture rig can sweep the angle. */
  captureAngle?: number | (() => number);
};
