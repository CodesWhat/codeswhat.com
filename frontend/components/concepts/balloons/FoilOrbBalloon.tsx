"use client";

import { Decal, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { BalloonProps } from "./types";

/**
 * Per-mascot metallic foil color so the three orbs don't all read as the same
 * pearly white: sockguard = warm gold, drydock = ocean teal, portwing = violet.
 * Matched against the logo url; falls back to the passed tint.
 */
const FOIL_COLORS: { match: string; color: string }[] = [
  { match: "sockguard", color: "#e8a11c" },
  { match: "drydock", color: "#1f9ed6" },
  { match: "portwing", color: "#a25bd6" },
];

/**
 * FoilOrbBalloon — a metallic foil orb with the mascot printed onto BOTH faces
 * as decals, so you can walk all the way around it. It does NOT track the
 * camera (only a slow idle sway), it bobs in place, and the string hangs down
 * from the knot as part of the balloon. Click to open its repo.
 */
export function FoilOrbBalloon({
  url,
  anchor,
  baseY,
  size,
  tint = "#eef1f7",
  float = 0.18,
  phase = 0,
  speed = 0.8,
  href,
}: BalloonProps) {
  const texture = useTexture(url);

  // Keep the mascot's aspect so the printed decal isn't stretched.
  const aspect = useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    const img = texture.image as HTMLImageElement | undefined;
    return img?.width ? img.height / img.width : 1;
  }, [texture]);

  const balloon = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const foilColor = FOIL_COLORS.find((c) => url.includes(c.match))?.color ?? tint;

  const radius = size * 0.5;
  // Pinched neck overlaps up into the body so it reads as one balloon; the tied
  // knot sits just below it, and the string hangs straight down from the knot.
  const neckY = -radius * 0.9;
  const neckH = radius * 0.36;
  const knotY = neckY - neckH / 2;
  const stringLen = size * 2.1;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const y = baseY + Math.sin(t * speed + phase) * float;
    if (balloon.current) {
      balloon.current.position.set(anchor[0], y, anchor[2]);
      // Fixed facing (no camera tracking) so you can orbit around it; just a
      // gentle idle sway on both axes.
      balloon.current.rotation.y = Math.sin(t * 0.4 + phase) * 0.12;
      balloon.current.rotation.z = Math.sin(t * 0.5 + phase) * 0.05;
      const target = hovered ? 1.09 : 1;
      const s = balloon.current.scale.x + (target - balloon.current.scale.x) * 0.15;
      balloon.current.scale.setScalar(s);
    }
  });

  const decalW = radius * 1.5;
  const decalScale: [number, number, number] = [decalW, decalW * aspect, radius * 2];

  return (
    <group ref={balloon}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: r3f <mesh> is a WebGL object, not a DOM element */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          if (href) document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = "default";
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (href) window.open(href, "_blank", "noopener,noreferrer");
        }}
      >
        <sphereGeometry args={[radius, 64, 64]} />
        <meshPhysicalMaterial
          color={foilColor}
          metalness={0.92}
          roughness={0.16}
          clearcoat={1}
          clearcoatRoughness={0.12}
          envMapIntensity={1.3}
        />
        {texture.image ? (
          <>
            {/* front face */}
            <Decal position={[0, 0, radius]} rotation={[0, 0, 0]} scale={decalScale}>
              <meshStandardMaterial
                map={texture}
                transparent
                alphaTest={0.4}
                roughness={0.45}
                metalness={0.05}
                polygonOffset
                polygonOffsetFactor={-10}
              />
            </Decal>
            {/* back face — so the logo reads from behind too */}
            <Decal position={[0, 0, -radius]} rotation={[0, Math.PI, 0]} scale={decalScale}>
              <meshStandardMaterial
                map={texture}
                transparent
                alphaTest={0.4}
                roughness={0.45}
                metalness={0.05}
                polygonOffset
                polygonOffsetFactor={-10}
              />
            </Decal>
          </>
        ) : null}
      </mesh>
      {/* pinched neck — same foil, top tucked up into the body so the two read
          as one piece rather than a cone stuck on the bottom */}
      <mesh position={[0, neckY, 0]}>
        <cylinderGeometry args={[radius * 0.24, radius * 0.09, neckH, 20]} />
        <meshPhysicalMaterial
          color={foilColor}
          metalness={0.92}
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.12}
          envMapIntensity={1.3}
        />
      </mesh>
      {/* tied-off knot nub at the very bottom of the neck */}
      <mesh position={[0, knotY, 0]}>
        <sphereGeometry args={[radius * 0.1, 16, 16]} />
        <meshPhysicalMaterial
          color={foilColor}
          metalness={0.92}
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.15}
        />
      </mesh>
      {/* string hangs straight down FROM the knot (child of the group, so it
          stays attached to the nub instead of reaching for the floor) */}
      <mesh position={[0, knotY - stringLen / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, stringLen, 6]} />
        <meshStandardMaterial color="#aeb6c8" roughness={0.6} metalness={0.1} />
      </mesh>
    </group>
  );
}
