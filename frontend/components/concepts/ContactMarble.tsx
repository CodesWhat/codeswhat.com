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
  flee = false,
}: {
  center?: [number, number, number];
  orbitRadius?: number;
  orbitSpeed?: number;
  bob?: number;
  radius?: number;
  onContact?: () => void;
  /** dart away from the cursor when it comes near (the canvas is
   *  pointer-events-none, so the cursor is tracked on window instead) */
  flee?: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const texture = useMemo(() => makeAtTexture(), []);
  const planeSize = radius * 1.05;
  const collider = useContext(OrbColliderContext);

  // normalized cursor (-1..1), and the eased "run away" offset it produces
  const pointer = useRef({ x: 0, y: 0, seen: false });
  const fleeOffset = useRef({ x: 0, y: 0 });
  const worldPos = useMemo(() => new THREE.Vector3(), []);

  // let balloons see us as a collider; stop deflecting them once we unmount
  useEffect(() => {
    if (!collider) return;
    collider.radius = radius;
    return () => {
      collider.active = false;
    };
  }, [collider, radius]);

  useEffect(() => {
    if (!flee) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
      pointer.current.seen = true;
    };
    const onLeave = () => {
      pointer.current.seen = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerout", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onLeave);
    };
  }, [flee]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const a = t * orbitSpeed;
    if (!group.current) return;

    const ox = center[0] + Math.cos(a) * orbitRadius;
    const oy = center[1] + Math.sin(t * 0.9) * bob;
    const oz = center[2] + Math.sin(a) * orbitRadius;
    group.current.position.set(ox, oy, oz);

    // repel from the cursor: map the pointer onto the marble's plane, and if
    // it gets close, shove the marble radially away (eased in and out)
    let targetX = 0;
    let targetY = 0;
    if (flee && pointer.current.seen) {
      group.current.getWorldPosition(worldPos);
      const cam = state.camera as THREE.PerspectiveCamera;
      const dist = cam.position.z - worldPos.z;
      const halfH = Math.tan((cam.fov * Math.PI) / 180 / 2) * dist;
      const halfW = halfH * cam.aspect;
      const mx = cam.position.x + pointer.current.x * halfW;
      const my = cam.position.y + pointer.current.y * halfH;
      const dx = worldPos.x - mx;
      const dy = worldPos.y - my;
      const d = Math.hypot(dx, dy);
      if (d < orbitRadius) {
        const push = (orbitRadius - d) / orbitRadius;
        const mag = orbitRadius * 0.9 * push;
        targetX = (dx / (d || 1e-3)) * mag;
        targetY = (dy / (d || 1e-3)) * mag;
      }
    }
    fleeOffset.current.x += (targetX - fleeOffset.current.x) * 0.18;
    fleeOffset.current.y += (targetY - fleeOffset.current.y) * 0.18;
    group.current.position.x = ox + fleeOffset.current.x;
    group.current.position.y = oy + fleeOffset.current.y;

    if (collider) {
      collider.position.copy(group.current.position);
      collider.radius = radius;
      collider.active = true;
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
