"use client";

import { useTexture } from "@react-three/drei";
import { BallCollider, RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import * as THREE from "three";
import type { BalloonProps } from "./types";

/**
 * MarbleBalloon — the "clear" style as a physics marble instead of a floating
 * balloon. It's a rapier ball dropped from its anchor into the bowl, so it
 * rolls around and settles. A single mascot logo sits INSIDE the clear glass on
 * an opaque, alpha-cut plane — opaque so it renders into the transmission
 * buffer and reads through real refractive glass. Click to open its repo.
 */
export function MarbleBalloon({ url, anchor, baseY, size, tint = "#eef1f7", href }: BalloonProps) {
  const texture = useTexture(url);

  const aspect = useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    const img = texture.image as HTMLImageElement | undefined;
    return img?.width ? img.height / img.width : 1;
  }, [texture]);

  const radius = size * 0.4;
  // Sit the logo comfortably inside the glass, not edge to edge.
  const planeW = radius * 0.95;
  const planeH = Math.min(planeW * aspect, radius * 1.3);

  const openRepo = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (href) window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <RigidBody
      colliders={false}
      position={[anchor[0], baseY, anchor[2]]}
      restitution={0.35}
      friction={0.55}
      linearDamping={0.25}
      angularDamping={0.2}
      ccd
    >
      <BallCollider args={[radius]} />
      {/* real refractive glass shell — because the logo core is OPAQUE it gets
          rendered into the transmission buffer, so it shows through actual
          glass instead of needing a faked alpha-blend */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: r3f mesh, not DOM */}
      <mesh
        onClick={openRepo}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (href) document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "default";
        }}
      >
        <sphereGeometry args={[radius, 64, 64]} />
        <meshPhysicalMaterial
          color={tint}
          transmission={1}
          thickness={radius * 1.4}
          roughness={0.03}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.04}
          ior={1.48}
          attenuationColor={tint}
          attenuationDistance={radius * 6}
          envMapIntensity={1.2}
        />
      </mesh>
      {/* a single logo suspended inside the marble */}
      <mesh>
        <planeGeometry args={[planeW, planeH]} />
        <meshStandardMaterial
          map={texture}
          alphaTest={0.5}
          side={THREE.DoubleSide}
          roughness={0.5}
          metalness={0.05}
        />
      </mesh>
    </RigidBody>
  );
}
