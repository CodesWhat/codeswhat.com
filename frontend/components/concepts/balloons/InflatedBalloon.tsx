"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { BalloonProps } from "./types";

const DEFAULT_COLS = 110;

type PuffGeometryOptions = {
  cols?: number;
  depthRatio?: number;
  outlineBlurRatio?: number;
  heightBlurRatio?: number;
};

/** Two-pass separable box blur (horizontal then vertical) over a WxH field. */
function boxBlur(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;
      for (let k = -r; k <= r; k++) {
        const xx = x + k;
        if (xx >= 0 && xx < w) {
          sum += src[y * w + xx];
          count++;
        }
      }
      tmp[y * w + x] = sum / count;
    }
  }
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let sum = 0;
      let count = 0;
      for (let k = -r; k <= r; k++) {
        const yy = y + k;
        if (yy >= 0 && yy < h) {
          sum += tmp[yy * w + x];
          count++;
        }
      }
      out[y * w + x] = sum / count;
    }
  }
  return out;
}

/**
 * Rasterizes the mascot's alpha channel to a cols x rows grid and returns
 * which cells are "solid" — i.e. inside the silhouette. Any transparent cell
 * that is NOT reachable from the grid border via a flood-fill is an interior
 * hole (e.g. drydock's inner gaps) and gets sealed solid so the puffed body
 * never has a see-through punch in the middle.
 */
function rasterizeSolidMask(image: HTMLImageElement, cols: number, rows: number): Uint8Array {
  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new Uint8Array(cols * rows).fill(1);

  ctx.clearRect(0, 0, cols, rows);
  ctx.drawImage(image, 0, 0, cols, rows);
  const { data } = ctx.getImageData(0, 0, cols, rows);

  const cellCount = cols * rows;
  const alpha = new Float32Array(cellCount);
  for (let i = 0; i < cellCount; i++) {
    alpha[i] = data[i * 4 + 3] / 255;
  }

  // Border flood-fill: every transparent cell reachable from the border is
  // genuine exterior. Anything transparent but unreachable is an interior
  // hole and must be sealed.
  const exterior = new Uint8Array(cellCount);
  const stack: number[] = [];
  const visit = (x: number, y: number) => {
    if (x < 0 || x >= cols || y < 0 || y >= rows) return;
    const i = y * cols + x;
    if (exterior[i] || alpha[i] >= 0.5) return;
    exterior[i] = 1;
    stack.push(i);
  };
  for (let x = 0; x < cols; x++) {
    visit(x, 0);
    visit(x, rows - 1);
  }
  for (let y = 0; y < rows; y++) {
    visit(0, y);
    visit(cols - 1, y);
  }
  while (stack.length) {
    const i = stack.pop() as number;
    const x = i % cols;
    const y = (i - x) / cols;
    visit(x + 1, y);
    visit(x - 1, y);
    visit(x, y + 1);
    visit(x, y - 1);
  }

  const solid = new Uint8Array(cellCount);
  for (let i = 0; i < cellCount; i++) {
    solid[i] = alpha[i] >= 0.5 || !exterior[i] ? 1 : 0;
  }
  return solid;
}

/**
 * Builds a closed, watertight "puffed silhouette" mesh: a front shell and a
 * back shell over only the solid cells, stitched together along the full
 * outline with rim quads. Because the mesh only exists where the silhouette
 * is solid — and is a real closed manifold rather than a single alpha-tested
 * plane — there are no holes to alpha-test away and no flat-plane medial
 * seam to shade badly.
 */
export function buildPuffGeometry(
  image: HTMLImageElement,
  size: number,
  options: PuffGeometryOptions = {},
): THREE.BufferGeometry {
  const imgW = image.naturalWidth || image.width || 1;
  const imgH = image.naturalHeight || image.height || 1;
  const aspect = imgH / imgW;
  const cols = options.cols ?? DEFAULT_COLS;
  const rows = Math.max(2, Math.round(cols * aspect));

  const rawSolid = rasterizeSolidMask(image, cols, rows);
  const cellCount = cols * rows;

  // Smooth the outline: blur the sealed mask and re-threshold. This rounds the
  // silhouette and — crucially — closes thin sub-threshold notches that would
  // otherwise become internal rim walls, i.e. the dark crease straight across
  // the middle of the pillow.
  const rawMask = new Float32Array(cellCount);
  for (let i = 0; i < cellCount; i++) rawMask[i] = rawSolid[i] ? 1 : 0;
  const outlineR = Math.max(1, Math.round(cols * (options.outlineBlurRatio ?? 0.04)));
  const outlineBlur = boxBlur(boxBlur(rawMask, cols, rows, outlineR), cols, rows, outlineR);
  const solid = new Uint8Array(cellCount);
  for (let i = 0; i < cellCount; i++) solid[i] = outlineBlur[i] > 0.5 ? 1 : 0;

  // Height field: blur the smoothed mask so it falls to ~0 at the new outline
  // and rises inward, then dome it with a sine falloff. A shallow depth keeps
  // the two shells close — a thin, lightly-inflated pillow rather than a fat
  // lozenge — which also flattens any leftover interior ridge.
  const heightMask = new Float32Array(cellCount);
  for (let i = 0; i < cellCount; i++) heightMask[i] = solid[i] ? 1 : 0;
  const heightR = Math.max(1, Math.round(cols * (options.heightBlurRatio ?? 0.07)));
  const heightBlur = boxBlur(boxBlur(heightMask, cols, rows, heightR), cols, rows, heightR);

  const depth = size * (options.depthRatio ?? 0.06);
  const sizeX = size;
  const sizeY = size * aspect;
  const z = new Float32Array(cellCount);
  for (let i = 0; i < cellCount; i++) {
    const h = Math.min(1, Math.max(0, heightBlur[i]));
    z[i] = Math.sin(h * Math.PI * 0.5) * depth;
  }

  // A quad (x,y)..(x+1,y+1) participates in the front/back shells only when
  // all four corners are solid — this is also what defines the outline used
  // for the rim below.
  const isQuadSolid = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x > cols - 2 || y > rows - 2) return false;
    return (
      solid[y * cols + x] === 1 &&
      solid[y * cols + x + 1] === 1 &&
      solid[(y + 1) * cols + x] === 1 &&
      solid[(y + 1) * cols + x + 1] === 1
    );
  };

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const frontIdx = new Int32Array(cellCount).fill(-1);
  const backIdx = new Int32Array(cellCount).fill(-1);

  const vertexFor = (x: number, y: number, front: boolean): number => {
    const i = y * cols + x;
    const table = front ? frontIdx : backIdx;
    const cached = table[i];
    if (cached !== -1) return cached;
    const u = x / (cols - 1);
    const v = y / (rows - 1);
    const px = (u - 0.5) * sizeX;
    const py = (0.5 - v) * sizeY;
    const pz = front ? z[i] : -z[i];
    positions.push(px, py, pz);
    uvs.push(u, 1 - v);
    const idx = positions.length / 3 - 1;
    table[i] = idx;
    return idx;
  };

  // FRONT + BACK quads, one pair per solid 2x2 block.
  for (let y = 0; y <= rows - 2; y++) {
    for (let x = 0; x <= cols - 2; x++) {
      if (!isQuadSolid(x, y)) continue;
      const ftl = vertexFor(x, y, true);
      const ftr = vertexFor(x + 1, y, true);
      const fbl = vertexFor(x, y + 1, true);
      const fbr = vertexFor(x + 1, y + 1, true);
      indices.push(ftl, fbl, ftr, ftr, fbl, fbr); // CCW facing +z

      const btl = vertexFor(x, y, false);
      const btr = vertexFor(x + 1, y, false);
      const bbl = vertexFor(x, y + 1, false);
      const bbr = vertexFor(x + 1, y + 1, false);
      indices.push(btl, btr, bbl, btr, bbr, bbl); // reversed winding, facing -z
    }
  }

  // RIM: walk every adjacent pair of quad-cells (including the implicit
  // false cell just outside the grid) and stitch a wall wherever solidity
  // changes. Checking both axes this way — rather than only "right or
  // down" from solid cells — covers the top/left side of the outline too,
  // so the outline is closed on all sides and the pillow is fully watertight.
  for (let y = 0; y <= rows - 2; y++) {
    for (let x = -1; x <= cols - 2; x++) {
      const left = isQuadSolid(x, y);
      const right = isQuadSolid(x + 1, y);
      if (left === right) continue;
      const cx = x + 1;
      const ft = vertexFor(cx, y, true);
      const fb = vertexFor(cx, y + 1, true);
      const bt = vertexFor(cx, y, false);
      const bb = vertexFor(cx, y + 1, false);
      if (left) {
        indices.push(ft, fb, bt, bt, fb, bb); // solid on -x side, rim faces +x
      } else {
        indices.push(ft, bt, fb, bt, bb, fb); // solid on +x side, rim faces -x
      }
    }
  }
  for (let x = 0; x <= cols - 2; x++) {
    for (let y = -1; y <= rows - 2; y++) {
      const upper = isQuadSolid(x, y);
      const lower = isQuadSolid(x, y + 1);
      if (upper === lower) continue;
      const cy = y + 1;
      const fl = vertexFor(x, cy, true);
      const fr = vertexFor(x + 1, cy, true);
      const bl = vertexFor(x, cy, false);
      const br = vertexFor(x + 1, cy, false);
      if (upper) {
        indices.push(fl, bl, fr, bl, br, fr); // solid on +y side, rim faces -y
      } else {
        indices.push(fl, fr, bl, bl, fr, br); // solid on -y side, rim faces +y
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * InflatedBalloon — the mascot's own silhouette puffed into a foil pillow
 * (mesh-only-the-silhouette + closed rim, no alpha-tested plane) with the
 * same pinched-neck/knot/tether/bob-and-click behavior as the other variants.
 */
export function InflatedBalloon({
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

  const geometry = useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    // The old holes came from mipmap sampling across an alpha edge; since
    // the geometry itself is now the exact silhouette there is nothing left
    // to alpha-test, so mipmaps are disabled outright.
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    const image = texture.image as HTMLImageElement | undefined;
    if (!image) return new THREE.BufferGeometry();
    return buildPuffGeometry(image, size);
  }, [texture, size]);

  const balloon = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const radius = size * 0.5;
  // Pinched neck overlaps up into the body so it reads as one balloon, not a
  // detached cone; the tied knot sits just below it where the string ties on.
  const neckY = -radius * 0.9;
  const neckH = radius * 0.36;
  const knotY = neckY - neckH / 2;
  const stringLen = size * 2.1;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const y = baseY + Math.sin(t * speed + phase) * float;
    if (balloon.current) {
      balloon.current.position.set(anchor[0], y, anchor[2]);
      const yaw = Math.atan2(
        state.camera.position.x - anchor[0],
        state.camera.position.z - anchor[2],
      );
      balloon.current.rotation.y = yaw + Math.sin(t * 0.5 + phase) * 0.08;
      balloon.current.rotation.z = Math.sin(t * 0.5 + phase) * 0.05;
      const target = hovered ? 1.09 : 1;
      const s = balloon.current.scale.x + (target - balloon.current.scale.x) * 0.15;
      balloon.current.scale.setScalar(s);
    }
  });

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
        <primitive object={geometry} attach="geometry" />
        <meshPhysicalMaterial
          map={texture}
          side={THREE.DoubleSide}
          color={tint}
          metalness={0.3}
          roughness={0.22}
          clearcoat={1}
          clearcoatRoughness={0.15}
          envMapIntensity={0.9}
        />
      </mesh>
      {/* pinched neck — same foil, top tucked up into the body so the two
            read as one piece rather than a cone stuck on the bottom */}
      <mesh position={[0, neckY, 0]}>
        <cylinderGeometry args={[radius * 0.24, radius * 0.09, neckH, 20]} />
        <meshPhysicalMaterial
          color={tint}
          metalness={0.35}
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.12}
          envMapIntensity={0.9}
        />
      </mesh>
      {/* tied-off knot nub at the very bottom of the neck */}
      <mesh position={[0, knotY, 0]}>
        <sphereGeometry args={[radius * 0.1, 16, 16]} />
        <meshPhysicalMaterial
          color={tint}
          metalness={0.35}
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.15}
        />
      </mesh>
      {/* string hangs straight down from the knot as part of the balloon */}
      <mesh position={[0, knotY - stringLen / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, stringLen, 6]} />
        <meshStandardMaterial color="#aeb6c8" roughness={0.6} metalness={0.1} />
      </mesh>
    </group>
  );
}
