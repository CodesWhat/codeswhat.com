"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type SceneVariant = "atlas" | "archive";

type WebglShowcaseSceneProps = {
  variant: SceneVariant;
  className?: string;
};

type CardSpec = {
  eyebrow: string;
  title: string;
  body: string;
  stat: string;
  accent: string;
  position: [number, number, number];
  rotation: [number, number, number];
};

const variantCopy: Record<
  SceneVariant,
  {
    aria: string;
    bg: number;
    fog: number;
    cards: CardSpec[];
    rings: boolean;
  }
> = {
  atlas: {
    aria: "Animated WebGL atlas with floating CodesWhat project objects for Drydock and Rolester",
    bg: 0x050706,
    fog: 0x07110d,
    rings: true,
    cards: [
      {
        eyebrow: "OPEN SOURCE / OPS",
        title: "Drydock",
        body: "Container update monitoring, release evidence, registry checks, and operator-grade docs.",
        stat: "23 registries",
        accent: "#c8ff00",
        position: [-2.45, 0.35, 0.25],
        rotation: [-0.18, 0.38, -0.08],
      },
      {
        eyebrow: "LOCAL-FIRST / AGENT",
        title: "Rolester",
        body: "Job-search workspace with evidence, honest tailoring, tracking, and interview prep loops.",
        stat: "agent loop",
        accent: "#00f5d4",
        position: [2.32, -0.18, -0.15],
        rotation: [0.16, -0.36, 0.09],
      },
      {
        eyebrow: "STUDIO CORE",
        title: "CodesWhat",
        body: "A navigable software constellation instead of another flat agency homepage.",
        stat: "showcase",
        accent: "#ff5c3a",
        position: [0, 1.18, -0.9],
        rotation: [-0.34, 0, 0],
      },
    ],
  },
  archive: {
    aria: "Animated WebGL archive table with stacked artifact cards for CodesWhat projects",
    bg: 0x070606,
    fog: 0x100d0a,
    rings: false,
    cards: [
      {
        eyebrow: "FIELD NOTE",
        title: "Drydock Audit Trail",
        body: "Release proof, rollback notes, and registry signals arranged as physical evidence.",
        stat: "v1.4",
        accent: "#fbbf24",
        position: [-2.1, 0.82, -0.1],
        rotation: [-0.64, 0.12, -0.18],
      },
      {
        eyebrow: "UI FRAGMENT",
        title: "Rolester Gate",
        body: "Fit, comp, action, and evidence cards laid out like a tabletop strategy board.",
        stat: "gate pass",
        accent: "#fb7185",
        position: [1.82, 0.48, 0.18],
        rotation: [-0.72, -0.18, 0.21],
      },
      {
        eyebrow: "CASE STUDY",
        title: "CodesWhat Archive",
        body: "Projects become inspectable artifacts: screens, notes, deltas, and source-linked receipts.",
        stat: "artifact wall",
        accent: "#67e8f9",
        position: [-0.08, -0.55, 0.55],
        rotation: [-0.86, 0.02, 0.02],
      },
    ],
  },
};

export function WebglShowcaseScene({ variant, className }: WebglShowcaseSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const host = mount;

    const config = variantCopy[variant];
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(config.fog, 7, 18);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, variant === "atlas" ? 1.35 : 2.1, variant === "atlas" ? 6.6 : 7.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setClearColor(config.bg, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Fill the host box. setSize(..., false) keeps the drawing buffer crisp
    // (client size * dpr) but leaves the canvas CSS size unset, which would
    // otherwise lay the canvas out at its buffer size and overflow the host.
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    host.appendChild(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);

    const ambient = new THREE.AmbientLight(0xffffff, 1.35);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xdffff3, 2.2);
    key.position.set(4, 6, 5);
    scene.add(key);

    const rim = new THREE.PointLight(variant === "atlas" ? 0xc8ff00 : 0xffb86b, 22, 12);
    rim.position.set(-3.2, 1.8, 3.2);
    scene.add(rim);

    const cards = config.cards.map((card, index) => {
      const group = makeProjectCard(card);
      group.position.set(...card.position);
      group.rotation.set(...card.rotation);
      group.userData.floatOffset = index * 1.7;
      root.add(group);
      return group;
    });

    if (config.rings) {
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xc8ff00,
        emissive: 0x567000,
        emissiveIntensity: 0.55,
        metalness: 0.4,
        roughness: 0.35,
      });
      for (const radius of [1.25, 2.2, 3.1]) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.012, 8, 160), ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.rotation.z = radius * 0.45;
        root.add(ring);
      }
    } else {
      const table = new THREE.Mesh(
        new THREE.BoxGeometry(7.2, 0.12, 4.2),
        new THREE.MeshStandardMaterial({
          color: 0x14110e,
          roughness: 0.82,
          metalness: 0.08,
        }),
      );
      table.position.set(0, -1.24, 0.25);
      table.rotation.x = -0.08;
      root.add(table);

      const wire = new THREE.GridHelper(8, 16, 0x5b3e1f, 0x2a2118);
      wire.position.set(0, -1.14, 0.25);
      wire.rotation.x = 0.02;
      root.add(wire);
    }

    const smallObjects = makeSmallObjects(variant);
    root.add(...smallObjects);

    const particles = makeParticles(variant);
    scene.add(particles);

    const pointer = { x: 0, y: 0 };
    function handlePointerMove(event: PointerEvent) {
      const rect = host.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    }
    host.addEventListener("pointermove", handlePointerMove);

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(host);

    let frame = 0;
    const startedAt = performance.now();
    const animate = () => {
      const elapsed = (performance.now() - startedAt) / 1000;
      root.rotation.y = THREE.MathUtils.lerp(root.rotation.y, pointer.x * 0.18, 0.045);
      root.rotation.x = THREE.MathUtils.lerp(root.rotation.x, -pointer.y * 0.08, 0.04);
      particles.rotation.y = elapsed * 0.025;

      for (const [index, card] of cards.entries()) {
        const offset = card.userData.floatOffset as number;
        card.position.y = config.cards[index].position[1] + Math.sin(elapsed * 0.8 + offset) * 0.08;
      }

      for (const [index, object] of smallObjects.entries()) {
        object.rotation.x += 0.006 + index * 0.001;
        object.rotation.y += 0.009 + index * 0.001;
      }

      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      host.removeEventListener("pointermove", handlePointerMove);
      renderer.dispose();
      renderer.domElement.remove();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) {
            for (const item of material) disposeMaterial(item);
          } else {
            disposeMaterial(material);
          }
        }
      });
    };
  }, [variant]);

  return (
    <div
      ref={mountRef}
      role="img"
      aria-label={variantCopy[variant].aria}
      className={`relative overflow-hidden rounded-lg border border-white/10 bg-black/25 shadow-2xl shadow-black/40 ${className ?? ""}`}
    />
  );
}

function makeProjectCard(card: CardSpec) {
  const width = 2.55;
  const height = 1.72;
  const depth = 0.085;
  const texture = makeCardTexture(card);
  const frontMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.52,
    metalness: 0.05,
  });
  const sideMaterial = new THREE.MeshStandardMaterial({
    color: 0x151515,
    roughness: 0.65,
    metalness: 0.18,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), [
    sideMaterial,
    sideMaterial,
    sideMaterial,
    sideMaterial,
    frontMaterial,
    sideMaterial,
  ]);

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 1.06, height * 1.08),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(card.accent),
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  glow.position.z = -0.07;

  const group = new THREE.Group();
  group.add(glow, body);
  return group;
}

function makeCardTexture(card: CardSpec) {
  const scale = 3;
  const width = 640;
  const height = 430;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");
  ctx.scale(scale, scale);

  ctx.fillStyle = "#0b0b0d";
  roundRect(ctx, 0, 0, width, height, 18);
  ctx.fill();

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, `${card.accent}3a`);
  gradient.addColorStop(0.45, "rgba(255,255,255,0.025)");
  gradient.addColorStop(1, "rgba(255,255,255,0.04)");
  ctx.fillStyle = gradient;
  roundRect(ctx, 0, 0, width, height, 18);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 2;
  roundRect(ctx, 1, 1, width - 2, height - 2, 18);
  ctx.stroke();

  ctx.fillStyle = card.accent;
  ctx.beginPath();
  ctx.arc(42, 42, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "700 21px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "rgba(255,255,255,0.62)";
  ctx.fillText(card.eyebrow, 62, 50);

  ctx.font = "800 58px Inter, ui-sans-serif, system-ui";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(card.title, 34, 142);

  ctx.font = "500 28px Inter, ui-sans-serif, system-ui";
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  wrapText(ctx, card.body, 36, 196, width - 72, 39);

  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.beginPath();
  ctx.moveTo(36, height - 94);
  ctx.lineTo(width - 36, height - 94);
  ctx.stroke();

  ctx.font = "700 22px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = card.accent;
  ctx.fillText(card.stat.toUpperCase(), 36, height - 42);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makeSmallObjects(variant: SceneVariant) {
  const materialA = new THREE.MeshStandardMaterial({
    color: variant === "atlas" ? 0xc8ff00 : 0xfbbf24,
    emissive: variant === "atlas" ? 0x435900 : 0x5b3100,
    emissiveIntensity: 0.45,
    roughness: 0.34,
    metalness: 0.28,
  });
  const materialB = new THREE.MeshStandardMaterial({
    color: variant === "atlas" ? 0x00f5d4 : 0xfb7185,
    emissive: variant === "atlas" ? 0x00564d : 0x4f1020,
    emissiveIntensity: 0.35,
    roughness: 0.4,
    metalness: 0.18,
  });

  const a = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 1), materialA);
  a.position.set(-3.25, -0.95, 1.18);

  const b = new THREE.Mesh(new THREE.TorusKnotGeometry(0.22, 0.055, 96, 12), materialB);
  b.position.set(3.18, 1.12, 0.86);

  const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), materialA);
  c.position.set(0.18, variant === "atlas" ? -1.22 : 1.58, 1.28);

  return [a, b, c];
}

function makeParticles(variant: SceneVariant) {
  const count = 420;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: variant === "atlas" ? 0xb7ff4a : 0xffc76b,
    size: 0.018,
    transparent: true,
    opacity: 0.72,
  });
  return new THREE.Points(geometry, material);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, y);
}

function disposeMaterial(material: THREE.Material) {
  for (const value of Object.values(material)) {
    if (value instanceof THREE.Texture) value.dispose();
  }
  material.dispose();
}
