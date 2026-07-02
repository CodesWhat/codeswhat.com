"use client";

import dynamic from "next/dynamic";

// WebGL is client-only — load the transparent floating layer without SSR. This
// lives in a client component because next/dynamic({ ssr: false }) can't be used
// from a server component.
const Canvas = dynamic(() => import("./FloatingSceneCanvas"), { ssr: false });

/**
 * Decorative fixed 3D layer that sits behind the page content (pointer-events
 * off, aria-hidden). The coin + mascot balloons drift as you scroll. Purely a
 * flourish — every bit of real content is server-rendered HTML above this.
 */
export function FloatingScene() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <Canvas />
    </div>
  );
}
