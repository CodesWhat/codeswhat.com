"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { MylarBalloon } from "@/components/site/scene/balloons/MylarBalloon";
import { CaptureBridge, captureControl } from "@/components/site/scene/captureRig";

/**
 * Dev-only capture stage for a mascot Mylar balloon — same lighting as the
 * homepage scene, on a transparent canvas, with the balloon's idle motion frozen
 * so scripts/capture-assets.mjs can mint it as a square icon still or a seamless
 * spin (used e.g. as the Portkey MCP official icon).
 *
 * The balloon owns its own yaw, so it reads captureControl.angle live via a
 * getter; a fixed X-tilt on the wrapper group gives it dimensionality (the foil
 * catches the light instead of reading flat).
 */
type BalloonStudioProps = {
  url: string;
  dark: boolean;
  size: number;
  /** supersample factor — capture at size*ss, then downscale for clean edges */
  ss: number;
  /** balloon body diameter in world units */
  worldSize: number;
  tilt: number;
  fov: number;
  camZ: number;
};

export function BalloonStudio({
  url,
  dark,
  size,
  ss,
  worldSize,
  tilt,
  fov,
  camZ,
}: BalloonStudioProps) {
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
        {/* identical lighting to FloatingSceneCanvas so the foil reads the same */}
        <hemisphereLight args={["#ffffff", "#c9d2e0", 0.9]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[6, 10, 6]} intensity={1.6} />
        <Suspense fallback={null}>
          <Environment resolution={256} frames={1}>
            <Lightformer intensity={1.0} position={[0, 4, 8]} scale={[20, 20, 1]} color="#ffffff" />
            <Lightformer intensity={1.4} position={[-6, 2, 4]} scale={[8, 10, 1]} color="#e8f5c8" />
            <Lightformer intensity={1.2} position={[6, 3, 2]} scale={[8, 8, 1]} color="#c8ff00" />
          </Environment>
          <group rotation={[tilt, 0, 0]}>
            <MylarBalloon
              url={url}
              anchor={[0, 0, 0]}
              baseY={0}
              size={worldSize}
              float={0}
              phase={0}
              showString={false}
              dark={dark}
              captureAngle={() => captureControl.angle}
            />
          </group>
          <CaptureBridge />
        </Suspense>
      </Canvas>
    </div>
  );
}
