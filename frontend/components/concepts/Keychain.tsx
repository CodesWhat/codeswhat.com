"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { type ReactNode, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Keychain — hangs a charm (a glass marble or the coin) from a keyring on a
 * short chain, like a real bag/keys charm. Top to bottom: a split-ring keyring,
 * a run of interlocking chain links, an eye-screw threaded into the charm, then
 * the charm itself. The whole thing swings from the ring (top pivot) with a
 * gentle pendulum sway. Pure visual — no physics — so it lives outside <Physics>.
 *
 * Children are the charm, centered on their own origin; pass `charmRadius` so
 * the screw seats on top of it.
 */

const METAL = { color: "#c9cdd6", metalness: 1, roughness: 0.22, envMapIntensity: 1.4 } as const;

type KeychainProps = {
  anchor: [number, number, number]; // world position of the keyring (top pivot)
  drop: number; // distance from the ring down to the charm center
  charmRadius: number; // half-height of the charm, so the screw sits on its top
  phase?: number;
  sway?: number;
  speed?: number;
  children: ReactNode;
};

export function Keychain({
  anchor,
  drop,
  charmRadius,
  phase = 0,
  sway = 0.12,
  speed = 0.9,
  children,
}: KeychainProps) {
  const group = useRef<THREE.Group>(null);

  const ringR = 0.42;
  const ringTube = 0.06;

  const charmCenterY = -drop;
  const charmTopY = charmCenterY + charmRadius;
  const shaftLen = 0.16; // visible screw shaft above the charm
  const eyeY = charmTopY + shaftLen; // eye-loop / bottom of the chain
  const chainTopY = -(ringR + ringTube); // just under the keyring

  // Lay interlocking links between the ring and the screw eye, alternating 90°.
  const links = useMemo(() => {
    const linkR = 0.1;
    const spacing = linkR * 1.15;
    const span = chainTopY - eyeY;
    const count = Math.max(2, Math.round(span / spacing));
    const step = span / count;
    return Array.from({ length: count }, (_, i) => ({
      id: `link-${i}`,
      y: chainTopY - step * (i + 0.5),
      rot: i % 2 === 0 ? 0 : Math.PI / 2,
      linkR,
    }));
  }, [chainTopY, eyeY]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.z = sway * Math.sin(t * speed + phase);
      group.current.rotation.x = sway * 0.5 * Math.sin(t * speed * 0.85 + phase * 1.3);
    }
  });

  return (
    <group ref={group} position={anchor}>
      {/* split-ring keyring — read as a circle at the very top */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[ringR, ringTube, 16, 48]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[ringTube * 0.9, 0, 0.02]}>
        <torusGeometry args={[ringR, ringTube * 0.72, 16, 48]} />
        <meshStandardMaterial {...METAL} />
      </mesh>

      {/* interlocking chain links */}
      {links.map((l) => (
        <mesh key={l.id} position={[0, l.y, 0]} rotation={[0, l.rot, 0]}>
          <torusGeometry args={[l.linkR, l.linkR * 0.34, 12, 24]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
      ))}

      {/* eye-screw: loop above the charm + a threaded shaft into it */}
      <mesh position={[0, eyeY, 0]}>
        <torusGeometry args={[0.09, 0.03, 12, 24]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[0, charmTopY + shaftLen / 2 - 0.03, 0]}>
        <cylinderGeometry args={[0.05, 0.045, shaftLen + 0.08, 12]} />
        <meshStandardMaterial {...METAL} roughness={0.34} />
      </mesh>

      {/* the charm, centered at its own origin */}
      <group position={[0, charmCenterY, 0]}>{children}</group>
    </group>
  );
}

/**
 * MarbleCharm — the approved clear-glass marble (real transmission glass with a
 * single opaque logo suspended inside so it reads through the refraction), as a
 * static keychain charm. Click opens the repo.
 */
export function MarbleCharm({
  url,
  size,
  tint = "#eef1f7",
  href,
}: {
  url: string;
  size: number;
  tint?: string;
  href?: string;
}) {
  const texture = useTexture(url);

  const aspect = useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    const img = texture.image as HTMLImageElement | undefined;
    return img?.width ? img.height / img.width : 1;
  }, [texture]);

  const radius = size * 0.4;
  const planeW = radius * 0.95;
  const planeH = Math.min(planeW * aspect, radius * 1.3);

  const openRepo = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (href) window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <group>
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
    </group>
  );
}
