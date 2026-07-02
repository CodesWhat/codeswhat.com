"use client";

import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useContext, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OrbColliderContext } from "./collisionContext";

/**
 * ContactMarble — a clear glass marble with an "@" suspended inside (opaque, so
 * it reads through the refractive glass just like the logo marbles). It slowly
 * orbits the centerpiece (with a gentle vertical bob) and, on click, calls
 * onContact to open the site's email/contact modal.
 */
export function ContactMarble({
  center = [0, 1.7, 0],
  orbitRadius = 4.3,
  orbitSpeed = 0.25,
  bob = 0.28,
  radius = 0.68,
  onContact,
}: {
  center?: [number, number, number];
  orbitRadius?: number;
  orbitSpeed?: number;
  bob?: number;
  radius?: number;
  onContact?: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const texture = useMemo(() => makeAtTexture(), []);
  const planeSize = radius * 1.05;
  const collider = useContext(OrbColliderContext);

  // let balloons see us as a collider; stop deflecting them once we unmount
  useEffect(() => {
    if (!collider) return;
    collider.radius = radius;
    return () => {
      collider.active = false;
    };
  }, [collider, radius]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const a = t * orbitSpeed;
    if (group.current) {
      group.current.position.set(
        center[0] + Math.cos(a) * orbitRadius,
        center[1] + Math.sin(t * 0.9) * bob,
        center[2] + Math.sin(a) * orbitRadius,
      );
      if (collider) {
        collider.position.copy(group.current.position);
        collider.radius = radius;
        collider.active = true;
      }
    }
  });

  return (
    <group ref={group} position={center}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: r3f mesh, not DOM */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onContact?.();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "default";
        }}
      >
        <sphereGeometry args={[radius, 64, 64]} />
        <meshPhysicalMaterial
          color="#eaf1ff"
          transmission={1}
          thickness={radius * 1.4}
          roughness={0.03}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.04}
          ior={1.48}
          attenuationColor="#dfe8ff"
          attenuationDistance={radius * 6}
          envMapIntensity={1.2}
        />
      </mesh>
      {/* a single "@" suspended inside, billboarded to always face the camera */}
      <Billboard>
        <mesh>
          <planeGeometry args={[planeSize, planeSize]} />
          <meshStandardMaterial
            map={texture}
            alphaTest={0.5}
            side={THREE.DoubleSide}
            roughness={0.5}
            metalness={0.05}
          />
        </mesh>
      </Billboard>
    </group>
  );
}

function makeAtTexture(): THREE.CanvasTexture {
  const s = 512;
  const canvas = document.createElement("canvas");
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, s, s);
    ctx.fillStyle = "#12151d";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "800 360px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText("@", s / 2, s / 2 + 18);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
