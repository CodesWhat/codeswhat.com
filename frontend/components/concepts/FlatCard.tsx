"use client";

import { RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import * as THREE from "three";

/**
 * FlatCard — a thin project-card slab that lies flat on the board, ported from
 * the scottbensondev `?r3f` prototype. It's a real BoxGeometry slab (so it has
 * physical thickness and dice bounce off it) laid face-up with
 * rotation={[-Math.PI/2, 0, yaw]}. The readable face is a CanvasTexture redraw
 * of the project card on the +z box-material slot (toneMapped off so the colors
 * match the CSS), the other five faces are a dark edge. Click to open the repo.
 */

export type FlatCardSpec = {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  stat: string;
  accent: string;
  href: string;
  position: [number, number, number];
  yaw: number;
};

// CSS card aspect, kept from the prototype so the texture never stretches.
const CARD_W = 280;
const CARD_H = 214;

export function FlatCard({
  eyebrow,
  title,
  body,
  stat,
  accent,
  href,
  position,
  yaw,
  width = 2.6,
}: Omit<FlatCardSpec, "key"> & { width?: number }) {
  const texture = useMemo(
    () => makeCardTexture({ eyebrow, title, body, stat, accent }),
    [eyebrow, title, body, stat, accent],
  );

  const W = width;
  const H = (CARD_H / CARD_W) * W;
  const D = 0.08;

  const openRepo = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <RigidBody type="fixed" colliders={false} position={position} rotation={[-Math.PI / 2, 0, yaw]}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: r3f mesh, not DOM */}
      <mesh
        castShadow
        receiveShadow
        onClick={openRepo}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "default";
        }}
      >
        <boxGeometry args={[W, H, D]} />
        {/* five dark edges + one textured face (+z, material index 4) */}
        <meshStandardMaterial attach="material-0" color="#0e0f14" roughness={0.9} />
        <meshStandardMaterial attach="material-1" color="#0e0f14" roughness={0.9} />
        <meshStandardMaterial attach="material-2" color="#0e0f14" roughness={0.9} />
        <meshStandardMaterial attach="material-3" color="#0e0f14" roughness={0.9} />
        <meshBasicMaterial attach="material-4" map={texture} toneMapped={false} />
        <meshStandardMaterial attach="material-5" color="#0e0f14" roughness={0.9} />
      </mesh>
    </RigidBody>
  );
}

function makeCardTexture({
  eyebrow,
  title,
  body,
  stat,
  accent,
}: Pick<FlatCardSpec, "eyebrow" | "title" | "body" | "stat" | "accent">): THREE.CanvasTexture {
  const S = 4; // supersample for crisp text at this camera distance
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W * S;
  canvas.height = CARD_H * S;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.scale(S, S);

  // panel + subtle accent-tinted gradient
  ctx.fillStyle = "#111116";
  roundRect(ctx, 0, 0, CARD_W, CARD_H, 14);
  ctx.fill();

  const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  grad.addColorStop(0, `${accent}2e`);
  grad.addColorStop(0.5, "rgba(255,255,255,0.02)");
  grad.addColorStop(1, "rgba(255,255,255,0.03)");
  ctx.fillStyle = grad;
  roundRect(ctx, 0, 0, CARD_W, CARD_H, 14);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, 1, 1, CARD_W - 2, CARD_H - 2, 14);
  ctx.stroke();

  // eyebrow: accent dot + tag
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(26, 30, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "700 12px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "rgba(255,255,255,0.62)";
  ctx.fillText(eyebrow.toUpperCase(), 40, 34);

  // title
  ctx.font = "800 34px Inter, ui-sans-serif, system-ui";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(title, 22, 84);

  // body (wrapped)
  ctx.font = "500 15px Inter, ui-sans-serif, system-ui";
  ctx.fillStyle = "rgba(255,255,255,0.76)";
  wrapText(ctx, body, 22, 116, CARD_W - 44, 21);

  // divider + stat
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.beginPath();
  ctx.moveTo(22, CARD_H - 44);
  ctx.lineTo(CARD_W - 22, CARD_H - 44);
  ctx.stroke();

  ctx.font = "700 13px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = accent;
  ctx.fillText(stat.toUpperCase(), 22, CARD_H - 22);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  return texture;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
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
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y);
}
