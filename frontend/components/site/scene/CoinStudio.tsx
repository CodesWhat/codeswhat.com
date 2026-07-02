"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { type ReactNode, Suspense, useEffect, useRef } from "react";
import type * as THREE from "three";
import { CodesWhatCoin } from "@/components/site/scene/BoardObjects";

/**
 * Dev-only capture stage for the CodesWhat coin. Mounts ONLY the spinning coin
 * on a transparent canvas, lit exactly like the homepage scene, so the capture
 * script (scripts/capture-coin.mjs) can mint it as a looping transparent GIF +
 * APNG for reuse on other sites.
 *
 * Rendering is on-demand (frameloop="demand"): the script sets the coin's
 * Y-rotation to an exact angle per frame and asks for a single render, so one
 * pass of 0→2π produces a perfectly seamless loop regardless of wall-clock time.
 */

// Shared control the window hooks drive; read back inside the R3F frame loop.
const control = { angle: 0 };

/** Applies the script-controlled spin angle to the coin each on-demand frame. */
function SpinRig({ children }: { children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (group.current) group.current.rotation.y = control.angle;
  });
  return <group ref={group}>{children}</group>;
}

type CoinWindow = Window & {
  __coinRenderAt?: (angle: number) => Promise<void>;
  __coinReady?: boolean;
};

/** Installs the window hooks the capture script polls + drives, and warms up
 *  the on-demand renderer so the env map is baked before frame 0. */
function CaptureBridge() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    // resolve after the browser has actually painted the requested render
    const afterPaint = () =>
      new Promise<void>((res) => {
        requestAnimationFrame(() => requestAnimationFrame(() => res()));
      });
    const w = window as CoinWindow;
    w.__coinRenderAt = async (angle: number) => {
      control.angle = angle;
      invalidate();
      await afterPaint();
    };
    // bake the Environment cube map + first paint, then signal ready
    (async () => {
      for (let i = 0; i < 8; i++) {
        invalidate();
        await afterPaint();
      }
      w.__coinReady = true;
    })();
    return () => {
      w.__coinReady = false;
      w.__coinRenderAt = undefined;
    };
  }, [invalidate]);
  return null;
}

type CoinStudioProps = {
  dark: boolean;
  size: number;
  /** supersample factor — capture at size*ss, then downscale for clean edges */
  ss: number;
  reeds: number;
  radius: number;
  thickness: number;
  tilt: number;
  fov: number;
  camZ: number;
};

export function CoinStudio({
  dark,
  size,
  ss,
  reeds,
  radius,
  thickness,
  tilt,
  fov,
  camZ,
}: CoinStudioProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: size,
        height: size,
        background: "transparent",
      }}
    >
      <Canvas
        dpr={ss}
        frameloop="demand"
        camera={{ position: [0, 0, camZ], fov }}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
        style={{ width: "100%", height: "100%", background: "transparent" }}
      >
        {/* identical lighting to FloatingSceneCanvas so the metal reads the same */}
        <hemisphereLight args={["#ffffff", "#c9d2e0", 0.9]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[6, 10, 6]} intensity={1.6} />
        <Suspense fallback={null}>
          <Environment resolution={256} frames={1}>
            <Lightformer intensity={1.0} position={[0, 4, 8]} scale={[20, 20, 1]} color="#ffffff" />
            <Lightformer intensity={1.4} position={[-6, 2, 4]} scale={[8, 10, 1]} color="#e8f5c8" />
            <Lightformer intensity={1.2} position={[6, 3, 2]} scale={[8, 8, 1]} color="#c8ff00" />
          </Environment>
          <SpinRig>
            <CodesWhatCoin
              position={[0, 0, 0]}
              radius={radius}
              thickness={thickness}
              reeds={reeds}
              tilt={tilt}
              speed={0}
              dark={dark}
            />
          </SpinRig>
          <CaptureBridge />
        </Suspense>
      </Canvas>
    </div>
  );
}
