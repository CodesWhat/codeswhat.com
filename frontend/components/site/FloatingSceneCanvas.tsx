"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { type ReactNode, type RefObject, Suspense, useEffect, useRef } from "react";
import type * as THREE from "three";
import { CodesWhatCoin } from "@/components/concepts/BoardObjects";
import { MylarBalloon } from "@/components/concepts/balloons/MylarBalloon";
import { ContactMarble } from "@/components/concepts/ContactMarble";

type Floater = {
  key: string;
  url: string;
  /** scroll fraction (0=top, 1=bottom) where this balloon sits centered on
   *  screen — tuned so each one rises into view alongside its own card. */
  focus: number;
  /** horizontal slot: negative = left column, positive = right column */
  x: number;
  z: number;
  size: number;
  tint: string;
  phase: number;
  behavior?: "swim" | "walk" | "flap";
  spin?: number;
  glanceFrames?: string[];
  blinkFrame?: string;
};

/**
 * Mascot balloons parked next to their cards. The four project balloons cluster
 * around the Projects section (top row higher, bottom row lower, left/right by
 * column) so the hero stays clear for the spinning coin; the headshot lives down
 * by the About section.
 */
const FLOATERS: Floater[] = [
  // top-left card — the guard dog: bouncy steps, keeps turning to look around
  // (dropped below the section heading so it sits beside its card)
  {
    key: "sockguard",
    url: "/logos/sockguard-balloon.png",
    focus: 0.38,
    x: -3.3,
    z: -0.8,
    size: 2.2,
    tint: "#f3ede4",
    phase: 0,
    behavior: "walk",
  },
  // top-right card — the whale: glides side to side, turns around at each end
  {
    key: "drydock",
    url: "/logos/drydock-balloon.png",
    focus: 0.34,
    x: 3.3,
    z: -1.2,
    size: 2.4,
    tint: "#e6eef7",
    phase: 1.7,
    behavior: "swim",
  },
  // bottom-left card — the bird: waves back and forth in place, like flapping
  {
    key: "portwing",
    url: "/logos/portwing-balloon.png",
    focus: 0.48,
    x: -2.4,
    z: -1.0,
    size: 2.0,
    tint: "#eef0f4",
    phase: 3.2,
    behavior: "flap",
  },
  // bottom-right card — the key: spins in place like the coin
  {
    key: "portkey",
    url: "/logos/portkey-balloon.png",
    focus: 0.52,
    x: 2.4,
    z: -1.2,
    size: 2.0,
    tint: "#e9edf6",
    phase: 5.5,
    spin: 0.4,
  },
  // the headshot — sits with the "Who's behind it" section, facing forward
  {
    key: "scott",
    url: "/logos/scott-balloon.png",
    focus: 0.72,
    x: 3.8,
    z: -0.4,
    size: 2.6,
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
];

// how far (world units) a floater travels per full page scroll — big enough
// that each one drops out of frame once you scroll past its section.
const SPAN = 20;

/**
 * Parks its children at a scroll-driven height: centered on screen when the
 * page scroll reaches `focus`, sliding up and out as you scroll past. Each
 * floater owns one of these so it tracks its own section independently.
 */
function ScrollFloat({
  scroll,
  focus,
  x,
  z,
  restY = 0,
  span = SPAN,
  children,
}: {
  scroll: RefObject<number>;
  focus: number;
  x: number;
  z: number;
  restY?: number;
  span?: number;
  children: ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const started = useRef(false);

  useFrame(() => {
    if (!group.current) return;
    const targetY = restY + (scroll.current - focus) * span;
    if (!started.current) {
      // snap on the first frame so nothing animates in from center on load
      group.current.position.y = targetY;
      started.current = true;
    } else {
      group.current.position.y += (targetY - group.current.position.y) * 0.08;
    }
  });

  return (
    <group ref={group} position={[x, restY, z]}>
      {children}
    </group>
  );
}

function Scene() {
  const scroll = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scroll.current = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <>
      {/* the spinning coin owns the hero — sits up high, drifts out as you scroll */}
      <ScrollFloat scroll={scroll} focus={0} x={2.5} z={-1} restY={1.4}>
        <CodesWhatCoin position={[0, 0, 0]} radius={1.5} thickness={0.32} />
      </ScrollFloat>

      {FLOATERS.map(({ key, focus, x, z, ...m }) => (
        <ScrollFloat key={key} scroll={scroll} focus={focus} x={x} z={z}>
          <MylarBalloon anchor={[0, 0, 0]} baseY={0} showString={false} {...m} />
        </ScrollFloat>
      ))}

      {/* the clear glass "@" marble — hangs low and orbits behind the "Get
          notified" card; a short span keeps it lingering down there */}
      <ScrollFloat scroll={scroll} focus={0.92} x={0} z={-0.5} restY={-1} span={6}>
        <ContactMarble center={[0, 0, 0]} orbitRadius={2.2} orbitSpeed={0.22} radius={0.6} />
      </ScrollFloat>
    </>
  );
}

/** Transparent, fixed WebGL layer that composites over the aurora background. */
export default function FloatingSceneCanvas() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 12], fov: 40 }}
      gl={{ alpha: true, antialias: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <hemisphereLight args={["#ffffff", "#c9d2e0", 0.9]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[6, 10, 6]} intensity={1.6} />
      <Suspense fallback={null}>
        <Environment resolution={256} frames={1}>
          <Lightformer intensity={1.0} position={[0, 4, 8]} scale={[20, 20, 1]} color="#ffffff" />
          <Lightformer intensity={1.4} position={[-6, 2, 4]} scale={[8, 10, 1]} color="#e8f5c8" />
          <Lightformer intensity={1.2} position={[6, 3, 2]} scale={[8, 8, 1]} color="#c8ff00" />
        </Environment>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
