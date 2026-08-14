"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

/**
 * Shared plumbing for the dev-only capture studios (/studio/coin, /studio/balloon).
 * scripts/capture-assets.mjs drives these window hooks to spin a subject through
 * exact angles and read the transparent WebGL buffer per frame.
 *
 * `captureControl.angle` is the single source of truth for the current yaw; each
 * studio applies it its own way (the coin via a wrapper group, the balloon via
 * MylarBalloon's captureAngle getter), reading it live inside the R3F frame loop.
 */
export const captureControl = { angle: 0 };

type CaptureWindow = Window & {
  __captureRenderAt?: (angle: number) => Promise<void>;
  __captureReady?: boolean;
};

/** Installs the render hook + a ready flag, and warms up the on-demand renderer
 *  so the Environment map is baked before the capture script grabs frame 0. */
export function CaptureBridge() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    // resolve once the browser has actually painted the requested render
    const afterPaint = () =>
      new Promise<void>((res) => {
        requestAnimationFrame(() => requestAnimationFrame(() => res()));
      });
    const w = window as CaptureWindow;
    w.__captureRenderAt = async (angle: number) => {
      captureControl.angle = angle;
      invalidate();
      await afterPaint();
    };
    // bake the env cube map + first paint, then signal ready
    (async () => {
      for (let i = 0; i < 8; i++) {
        invalidate();
        await afterPaint();
      }
      w.__captureReady = true;
    })();
    return () => {
      w.__captureReady = false;
      w.__captureRenderAt = undefined;
    };
  }, [invalidate]);
  return null;
}
