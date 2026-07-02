"use client";

import { ContactShadows, Environment, Grid, Lightformer, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { CuboidCollider, Physics, RigidBody } from "@react-three/rapier";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { CodesWhatCoin } from "./BoardObjects";
import { FoilOrbBalloon } from "./balloons/FoilOrbBalloon";
import { InflatedBalloon } from "./balloons/InflatedBalloon";
import { MarbleBalloon } from "./balloons/MarbleBalloon";
import { MylarBalloon } from "./balloons/MylarBalloon";
import type { BalloonProps, BalloonVariant } from "./balloons/types";
import { ContactMarble } from "./ContactMarble";
import { OrbColliderContext } from "./collisionContext";
import { Keychain, MarbleCharm } from "./Keychain";

/**
 * BoardScene — the unified WebGL board for CodesWhat, ported from the
 * scottbensondev `?r3f` prototype.
 *
 * Centerpiece is the CodesWhat coin (the brand logo minted onto a real, slowly
 * turning 3D coin), ringed by the project crew — sockguard, drydock, portwing,
 * plus scott and the portkey MCP — as Mylar logo balloons. A clear "@" marble
 * orbits the centerpiece and opens the contact modal on click.
 *
 * The `variant` prop still selects the balloon treatment (mylar is the shipped
 * default; clear/foil/inflated/keychain remain wired for reuse):
 *   - clear / frosted: physics MARBLES with the logo inside, dropped into a
 *     bowl so they roll around;
 *   - foil: a printed foil orb (logo on both faces) floating on a string;
 *   - inflated: the mascot's own silhouette puffed into a thin pillow;
 *   - mylar: the mascot logo itself as a heat-sealed foil balloon.
 */

const MASCOTS: (BalloonProps & { key: string })[] = [
  {
    key: "sockguard",
    url: "/logos/sockguard-balloon.png",
    href: "https://github.com/CodesWhat/sockguard",
    anchor: [-3.5, 0, 0.6],
    baseY: 2.5,
    size: 2.7,
    tint: "#f3ede4",
    phase: 0,
  },
  {
    key: "drydock",
    url: "/logos/drydock-balloon.png",
    href: "https://github.com/CodesWhat/drydock",
    anchor: [3.4, 0, -0.3],
    baseY: 2.9,
    size: 3.1,
    tint: "#e6eef7",
    phase: 1.7,
  },
  {
    key: "portwing",
    url: "/logos/portwing-balloon.png",
    href: "https://github.com/CodesWhat/portwing",
    anchor: [0.3, 0, -2.7],
    baseY: 3.9,
    size: 2.5,
    tint: "#eef0f4",
    phase: 3.2,
  },
  {
    key: "scott",
    url: "/logos/scott-balloon.png",
    href: "https://scottbenson.dev",
    anchor: [0.4, 0, 2.5],
    baseY: 2.7,
    size: 2.8,
    tint: "#eef1f7",
    phase: 4.6,
    glanceFrames: [
      "/logos/scott-look-left.png",
      "/logos/scott-look-right.png",
      "/logos/scott-look-up.png",
      "/logos/scott-look-down.png",
    ],
    blinkFrame: "/logos/scott-blink.png",
  },
  {
    key: "portkey",
    url: "/logos/portkey-balloon.png",
    href: "https://github.com/CodesWhat/portkey-admin-mcp",
    anchor: [-2.9, 0, -2.3],
    baseY: 3.4,
    size: 2.5,
    tint: "#e9edf6",
    phase: 5.5,
  },
];

/** Keychain layout — each mascot marble hangs from a keyring on a chain. The
 *  keyring sits up high (`anchor`), the charm rests `drop` units below it. */
const KEYCHAINS: {
  key: string;
  url: string;
  tint: string;
  href: string;
  size: number;
  anchor: [number, number, number];
  drop: number;
  phase: number;
}[] = [
  {
    key: "sockguard",
    url: "/logos/sockguard-balloon.png",
    tint: "#f3ede4",
    href: "https://github.com/CodesWhat/sockguard",
    size: 2.7,
    anchor: [-3.4, 4.7, 0.6],
    drop: 2.5,
    phase: 0,
  },
  {
    key: "drydock",
    url: "/logos/drydock-balloon.png",
    tint: "#e6eef7",
    href: "https://github.com/CodesWhat/drydock",
    size: 3.0,
    anchor: [3.4, 5.1, -0.3],
    drop: 2.7,
    phase: 1.7,
  },
  {
    key: "portwing",
    url: "/logos/portwing-balloon.png",
    tint: "#eef0f4",
    href: "https://github.com/CodesWhat/portwing",
    size: 2.5,
    anchor: [0.4, 5.5, -2.6],
    drop: 2.9,
    phase: 3.2,
  },
];

/** A shallow bowl the marbles roll around in (clear variant only) — rendered
 *  translucent, with a trimesh collider matching its inner surface. */
function Bowl() {
  const geometry = useMemo(() => {
    const R = 4.3;
    const H = 0.75;
    const steps = 28;
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      pts.push(new THREE.Vector2(R * t, H * t * t));
    }
    const g = new THREE.LatheGeometry(pts, 64);
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <mesh geometry={geometry} receiveShadow>
        <meshPhysicalMaterial
          color="#10141d"
          metalness={0.25}
          roughness={0.35}
          clearcoat={0.6}
          clearcoatRoughness={0.25}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>
    </RigidBody>
  );
}

export default function BoardScene({
  variant = "mylar",
  onContact,
}: {
  variant?: BalloonVariant;
  onContact?: () => void;
}) {
  const isMarble = variant === "clear";
  const isKeychain = variant === "keychain";
  const isFloat = variant === "foil" || variant === "inflated" || variant === "mylar";
  const FloatBalloon =
    variant === "mylar" ? MylarBalloon : variant === "inflated" ? InflatedBalloon : FoilOrbBalloon;

  // shared, mutated-in-place so the contact marble can shove balloons it hits
  const orbCollider = useMemo(
    () => ({ position: new THREE.Vector3(), radius: 0.68, active: false }),
    [],
  );

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [7, 7, 9.5], fov: 34 }}
      style={{ position: "absolute", inset: 0, background: "#0b0e14" }}
    >
      <hemisphereLight args={["#cdddff", "#10141d", 0.7]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[6, 12, 5]} intensity={2.1} />
      <directionalLight position={[-8, 5, -6]} intensity={0.5} color="#5b8cff" />

      <OrbColliderContext.Provider value={orbCollider}>
        <Suspense fallback={null}>
          {/* procedural studio env → real reflections on the metal coin + glossy balloons. */}
          <Environment resolution={256} frames={1}>
            <Lightformer
              intensity={0.85}
              position={[0, 3, 13]}
              scale={[34, 34, 1]}
              color="#e8eefc"
            />
            <Lightformer
              intensity={0.55}
              position={[0, 12, 0]}
              scale={[34, 34, 1]}
              color="#dfe6f5"
            />
            <Lightformer
              intensity={2.2}
              position={[0, 5, -6]}
              scale={[14, 10, 1]}
              color="#b7c8ff"
            />
            <Lightformer intensity={1.4} position={[-7, 2, 4]} scale={[9, 10, 1]} color="#ffffff" />
            <Lightformer intensity={1.8} position={[7, 3, 2]} scale={[8, 8, 1]} color="#c8ff00" />
            <Lightformer intensity={1.0} position={[0, -3, 4]} scale={[12, 6, 1]} color="#3a4458" />
          </Environment>

          <Physics>
            <RigidBody type="fixed">
              <CuboidCollider args={[40, 0.1, 40]} position={[0, -0.1, 0]} />
            </RigidBody>

            {isMarble && <Bowl />}

            {isMarble && MASCOTS.map(({ key, ...m }) => <MarbleBalloon key={key} {...m} />)}
          </Physics>

          {/* centerpiece coin — free-floating, except in keychain mode where it
            hangs from its own keyring like everything else */}
          {!isKeychain && <CodesWhatCoin position={[0, 1.75, 0]} radius={1.5} thickness={0.34} />}

          {/* clear "@" marble — orbits through the balloon ring, bumping balloons
            aside as it passes; opens the contact modal on click */}
          {onContact && (
            <ContactMarble
              center={[0, 2.5, 0]}
              orbitRadius={3.5}
              radius={0.68}
              onContact={onContact}
            />
          )}

          {isFloat && MASCOTS.map(({ key, ...m }) => <FloatBalloon key={key} {...m} />)}

          {isKeychain && (
            <>
              <Keychain anchor={[0, 5.0, 0]} drop={2.7} charmRadius={1.15} phase={0.8} speed={0.8}>
                <CodesWhatCoin position={[0, 0, 0]} radius={1.15} thickness={0.26} tilt={0} />
              </Keychain>
              {KEYCHAINS.map((k) => (
                <Keychain
                  key={k.key}
                  anchor={k.anchor}
                  drop={k.drop}
                  charmRadius={k.size * 0.4}
                  phase={k.phase}
                >
                  <MarbleCharm url={k.url} size={k.size} tint={k.tint} href={k.href} />
                </Keychain>
              ))}
            </>
          )}
        </Suspense>
      </OrbColliderContext.Provider>

      <Grid
        position={[0, 0, 0]}
        args={[40, 40]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#2b3344"
        sectionSize={5}
        sectionThickness={1.1}
        sectionColor="#3a4458"
        fadeDistance={45}
        fadeStrength={1}
        infiniteGrid
      />
      <ContactShadows position={[0, 0.02, 0]} opacity={0.55} scale={50} blur={2.2} far={12} />

      <OrbitControls
        makeDefault
        target={[0, 1.9, 0]}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2.15}
        enablePan={false}
      />
    </Canvas>
  );
}
