import { createContext } from "react";
import type * as THREE from "three";

/**
 * Live world position of the orbiting contact marble, shared so the Mylar
 * balloons can swing aside when it sweeps through them. The object is mutated
 * in place every frame (no React re-renders) — only read it inside useFrame.
 */
export type OrbCollider = {
  position: THREE.Vector3;
  radius: number;
  active: boolean;
};

export const OrbColliderContext = createContext<OrbCollider | null>(null);
