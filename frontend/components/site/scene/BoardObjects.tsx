"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Board objects for the CodesWhat 3D board.
 *
 * - CodesWhatCoin: the brand logo minted onto a real 3D coin (cylinder rim +
 *   logo discs front/back), a slowly turning medallion — the centerpiece.
 *
 * The project-mascot balloons now live in ./balloons/* — one file per style
 * (clear, frosted, foil, inflated silhouette), all sharing the BalloonProps
 * contract in ./balloons/types so BoardScene can swap between them.
 */

/* ── reeded coin body ────────────────────────────────────────────────────── */

function buildCoinGeometry(
  radius: number,
  thickness: number,
  reeds: number,
  amp: number,
): THREE.BufferGeometry {
  // A round face with a fine reeded (milled) edge, like a quarter: many shallow
  // vertical flutes around the rim. High frequency + low amplitude keeps the
  // silhouette reading round instead of toothed like a cog.
  const shape = new THREE.Shape();
  const steps = Math.max(256, reeds * 8);
  for (let i = 0; i <= steps; i++) {
    const th = (i / steps) * Math.PI * 2;
    const rr = radius + amp * Math.cos(reeds * th);
    const x = Math.cos(th) * rr;
    const y = Math.sin(th) * rr;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    steps: 1,
  });
  geometry.translate(0, 0, -thickness / 2);
  geometry.computeVertexNormals();
  return geometry;
}

/* ── components ──────────────────────────────────────────────────────────── */

type CodesWhatCoinProps = {
  position?: [number, number, number];
  radius?: number;
  thickness?: number;
  tilt?: number;
  speed?: number;
  reeds?: number;
  reedDepth?: number;
  /** dark mode: invert the coin (lime → indigo) to match the inverted mascots */
  dark?: boolean;
};

export function CodesWhatCoin({
  position = [0, 1.7, 0],
  radius = 1.5,
  thickness = 0.34,
  tilt = -0.2,
  speed = 0.4,
  reeds = 90,
  reedDepth = 0.018,
  dark = false,
}: CodesWhatCoinProps) {
  const rawTexture = useTexture("/logos/codeswhat-coin.png");
  const texture = useMemo(() => {
    rawTexture.colorSpace = THREE.SRGBColorSpace;
    rawTexture.anisotropy = 16;
    const img = rawTexture.image as HTMLImageElement | undefined;
    if (!dark || !img || !(img.naturalWidth || img.width)) return rawTexture;
    // dark mode: mint an RGB-inverted coin face (lime logo → indigo)
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return rawTexture;
    ctx.drawImage(img, 0, 0);
    // RGB-invert every pixel (alpha untouched) so the lime face → indigo, the
    // same way the balloons invert. Done explicitly rather than via
    // ctx.filter="invert(1)", which is a silent no-op in some browsers (Safari)
    // and left the coin face green on the live site.
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = pixels.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = 255 - d[i];
      d[i + 1] = 255 - d[i + 1];
      d[i + 2] = 255 - d[i + 2];
    }
    ctx.putImageData(pixels, 0, 0);
    const inverted = new THREE.CanvasTexture(canvas);
    inverted.colorSpace = THREE.SRGBColorSpace;
    inverted.anisotropy = 16;
    return inverted;
  }, [rawTexture, dark]);

  // free the inverted canvas texture when it changes / unmounts
  useEffect(() => {
    return () => {
      if (texture !== rawTexture) texture.dispose();
    };
  }, [texture, rawTexture]);

  const coinGeometry = useMemo(
    () => buildCoinGeometry(radius, thickness, reeds, radius * reedDepth),
    [radius, thickness, reeds, reedDepth],
  );

  const spinner = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (spinner.current) spinner.current.rotation.y = state.clock.elapsedTime * speed;
  });

  const faceZ = thickness / 2 + 0.004;
  const faceR = radius * (1 - reedDepth); // logo fills nearly to the reeded rim

  return (
    <group position={position} rotation={[tilt, 0, 0]}>
      <group ref={spinner}>
        {/* scalloped metallic body — ExtrudeGeometry faces already point along ±Z */}
        <mesh geometry={coinGeometry}>
          <meshStandardMaterial
            color={dark ? "#4937ff" : "#b6c800"}
            metalness={0.92}
            roughness={0.28}
            envMapIntensity={1.1}
          />
        </mesh>
        {/* front + back faces carry the coin art, upright, framed by the scallops */}
        <mesh position={[0, 0, faceZ]}>
          <circleGeometry args={[faceR, 72]} />
          <meshStandardMaterial
            map={texture}
            transparent
            alphaTest={0.4}
            roughness={0.5}
            metalness={0.12}
            envMapIntensity={0.5}
          />
        </mesh>
        <mesh position={[0, 0, -faceZ]} rotation={[0, Math.PI, 0]}>
          <circleGeometry args={[faceR, 72]} />
          <meshStandardMaterial
            map={texture}
            transparent
            alphaTest={0.4}
            roughness={0.5}
            metalness={0.12}
            envMapIntensity={0.5}
          />
        </mesh>
      </group>
    </group>
  );
}
