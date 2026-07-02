"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbColliderContext } from "../collisionContext";
import type { BalloonProps } from "./types";

const MYLAR_COLORS: { match: string; color: string; edge: string }[] = [
  { match: "sockguard", color: "#f0a721", edge: "#fff0b5" },
  { match: "drydock", color: "#22a9de", edge: "#a9ecff" },
  { match: "portwing", color: "#a968e6", edge: "#efd7ff" },
  { match: "scott", color: "#cfd4dc", edge: "#ffffff" },
  { match: "portkey", color: "#20263a", edge: "#8fa2c8" },
];

const IRIDESCENCE_THICKNESS: [number, number] = [120, 540];
const MYLAR_GEOMETRY = {
  cols: 360,
  depthRatio: 0.07,
  maskResolution: 720,
};
const MYLAR_FILM = {
  macroScale: 0.56,
  highlightStrength: 40,
  softBandStrength: 26,
  shadowStrength: 0.1,
};
const STRING_SEGMENTS = 18;
const STRING_SWAY = {
  side: 0.052,
  depth: 0.026,
};

type MylarSilhouette = {
  geometry: THREE.BufferGeometry;
  alphaMap: THREE.Texture;
  stringAnchorY: number;
  textureCols: number;
  textureRows: number;
  maskData: ImageData;
  maskAlpha: Float32Array;
};

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

function parseHexColor(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean.length === 3 ? clean.replace(/(.)/g, "$1$1") : clean, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rasterizeSealedMask(image: HTMLImageElement, cols: number, rows: number): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new ImageData(cols, rows);

  ctx.clearRect(0, 0, cols, rows);
  ctx.drawImage(image, 0, 0, cols, rows);
  const imageData = ctx.getImageData(0, 0, cols, rows);
  const { data } = imageData;
  const cellCount = cols * rows;
  const alpha = new Float32Array(cellCount);
  for (let i = 0; i < cellCount; i++) alpha[i] = data[i * 4 + 3] / 255;

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

  for (let i = 0; i < cellCount; i++) {
    const sealedAlpha = alpha[i] >= 0.5 || !exterior[i] ? 255 : 0;
    data[i * 4 + 3] = sealedAlpha;
  }
  return imageData;
}

function paintAlphaMapChannels(imageData: ImageData): ImageData {
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const mask = data[i + 3];
    data[i] = mask;
    // Three's alphaMap reads the green channel, so logo-black pixels must not become holes.
    data[i + 1] = mask;
    data[i + 2] = mask;
  }
  return imageData;
}

function paintFoilFilmOverlay(
  imageData: ImageData,
  maskAlpha: Float32Array,
  w: number,
  h: number,
): ImageData {
  const { data } = imageData;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pixel = y * w + x;
      const alpha = maskAlpha[pixel] ?? 0;
      if (alpha <= 0) continue;

      const i = pixel * 4;
      const u = x / Math.max(1, w - 1);
      const v = y / Math.max(1, h - 1);
      const filmU = u * MYLAR_FILM.macroScale;
      const filmV = v * MYLAR_FILM.macroScale;
      const luma = data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
      const inkGuard = luma < 54 ? 0.18 : 1;
      const broadSheen =
        Math.max(0, Math.sin((filmU * 1.6 + filmV * 2.25 + 0.12) * Math.PI * 2)) ** 2;
      const softBand =
        Math.max(0, Math.sin((filmU * -3.2 + filmV * 2.1 + 0.34) * Math.PI * 2)) ** 6;
      const shadowBand =
        Math.max(0, Math.sin((filmU * 2.4 - filmV * 2.8 + 0.62) * Math.PI * 2)) ** 2;
      const highlight =
        (broadSheen * MYLAR_FILM.highlightStrength + softBand * MYLAR_FILM.softBandStrength) *
        alpha *
        inkGuard;
      const shade = 1 - shadowBand * MYLAR_FILM.shadowStrength * alpha * inkGuard;

      data[i] = Math.min(255, data[i] * shade + highlight * 1.06);
      data[i + 1] = Math.min(255, data[i + 1] * shade + highlight);
      data[i + 2] = Math.min(255, data[i + 2] * shade + highlight * 0.9);
    }
  }
  return imageData;
}

function makeCanvasTexture(
  canvas: HTMLCanvasElement,
  colorSpace: THREE.ColorSpace,
): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = colorSpace;
  texture.anisotropy = 8;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function makeStringGeometry(length: number): THREE.BufferGeometry {
  const positions = new Float32Array((STRING_SEGMENTS + 1) * 3);
  for (let i = 0; i <= STRING_SEGMENTS; i++) {
    const along = i / STRING_SEGMENTS;
    positions[i * 3] = 0;
    positions[i * 3 + 1] = -length * along;
    positions[i * 3 + 2] = 0;
  }

  const geometry = new THREE.BufferGeometry();
  const position = new THREE.BufferAttribute(positions, 3);
  position.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("position", position);
  geometry.computeBoundingSphere();
  return geometry;
}

/** Build the puffed foil sheet geometry + edge alpha map from the logo
 *  silhouette. This depends only on the shape, so a glancing headshot builds it
 *  once and reuses it for every look frame. */
function buildMylarSilhouette(image: HTMLImageElement, size: number): MylarSilhouette {
  const imgW = image.naturalWidth || image.width || 1;
  const imgH = image.naturalHeight || image.height || 1;
  const aspect = imgH / imgW;
  const cols = MYLAR_GEOMETRY.cols;
  const rows = Math.max(2, Math.round(cols * aspect));
  const textureCols = MYLAR_GEOMETRY.maskResolution;
  const textureRows = Math.max(2, Math.round(textureCols * aspect));

  const sheetMask = rasterizeSealedMask(image, cols, rows);
  const alpha = new Float32Array(cols * rows);
  let bottomMaskRow = rows - 1;
  let hasMask = false;
  for (let i = 0; i < alpha.length; i++) {
    const mask = sheetMask.data[i * 4 + 3] / 255;
    alpha[i] = mask;
    if (mask >= 0.5) {
      bottomMaskRow = hasMask
        ? Math.max(bottomMaskRow, Math.floor(i / cols))
        : Math.floor(i / cols);
      hasMask = true;
    }
  }
  const height = boxBlur(
    boxBlur(alpha, cols, rows, Math.max(2, Math.round(cols * 0.035))),
    cols,
    rows,
    Math.max(3, Math.round(cols * 0.08)),
  );

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const sizeX = size;
  const sizeY = size * aspect;
  const depth = size * MYLAR_GEOMETRY.depthRatio;
  const bottomV = bottomMaskRow / Math.max(1, rows - 1);
  const stringAnchorY = hasMask ? (0.5 - bottomV) * sizeY + size * 0.025 : -sizeY * 0.5;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const u = x / (cols - 1);
      const v = y / (rows - 1);
      const i = y * cols + x;
      const rawHeight = height[i] * alpha[i];
      const h = Math.min(1, Math.max(0, (rawHeight - 0.42) / 0.58));
      const inflated = h * h * (3 - 2 * h);
      positions.push(
        (u - 0.5) * sizeX,
        (0.5 - v) * sizeY,
        Math.sin(inflated * Math.PI * 0.5) * depth,
      );
      uvs.push(u, 1 - v);
    }
  }

  for (let y = 0; y < rows - 1; y++) {
    for (let x = 0; x < cols - 1; x++) {
      const a = y * cols + x;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  const alphaCanvas = document.createElement("canvas");
  alphaCanvas.width = textureCols;
  alphaCanvas.height = textureRows;
  const alphaCtx = alphaCanvas.getContext("2d");
  let maskData: ImageData;
  if (alphaCtx) {
    alphaCtx.putImageData(rasterizeSealedMask(image, textureCols, textureRows), 0, 0);
    alphaCtx.filter = "blur(0.45px)";
    alphaCtx.drawImage(alphaCanvas, 0, 0);
    maskData = paintAlphaMapChannels(alphaCtx.getImageData(0, 0, textureCols, textureRows));
    alphaCtx.putImageData(maskData, 0, 0);
  } else {
    maskData = new ImageData(textureCols, textureRows);
  }
  const maskAlpha = new Float32Array(textureCols * textureRows);
  for (let i = 0; i < maskAlpha.length; i++) maskAlpha[i] = maskData.data[i * 4 + 3] / 255;

  return {
    geometry,
    alphaMap: makeCanvasTexture(alphaCanvas, THREE.NoColorSpace),
    stringAnchorY,
    textureCols,
    textureRows,
    maskData,
    maskAlpha,
  };
}

/** Print one logo frame onto the foil: foil-fill the empty areas, bake the
 *  sealed-edge shading, and lay the subtle film highlight over it. Cheap enough
 *  to run per glance frame because it reuses the shared silhouette mask. */
function bakeMylarColorMap(
  image: HTMLImageElement,
  silhouette: MylarSilhouette,
  foilColor: string,
  edgeColor: string,
): THREE.CanvasTexture {
  const { textureCols, textureRows, maskData, maskAlpha } = silhouette;
  const [foilR, foilG, foilB] = parseHexColor(foilColor);
  const [edgeR, edgeG, edgeB] = parseHexColor(edgeColor);

  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = textureCols;
  colorCanvas.height = textureRows;
  const colorCtx = colorCanvas.getContext("2d");
  if (colorCtx) {
    colorCtx.fillStyle = foilColor;
    colorCtx.fillRect(0, 0, textureCols, textureRows);
    colorCtx.drawImage(image, 0, 0, textureCols, textureRows);
    const colorData = colorCtx.getImageData(0, 0, textureCols, textureRows);
    const narrowSeal = boxBlur(
      maskAlpha,
      textureCols,
      textureRows,
      Math.max(2, Math.round(textureCols * 0.006)),
    );
    const wideSeal = boxBlur(
      maskAlpha,
      textureCols,
      textureRows,
      Math.max(4, Math.round(textureCols * 0.018)),
    );
    for (let i = 0; i < textureCols * textureRows; i++) {
      const alphaValue = maskData.data[i * 4 + 3];
      if (colorData.data[i * 4 + 3] < 20 && alphaValue > 0) {
        colorData.data[i * 4] = foilR;
        colorData.data[i * 4 + 1] = foilG;
        colorData.data[i * 4 + 2] = foilB;
      }
      if (alphaValue > 0) {
        const seal = Math.min(1, Math.max(0, (1 - wideSeal[i]) * 1.9));
        const crease = Math.min(1, Math.max(0, (1 - narrowSeal[i]) * 1.4));
        const shade = 1 - seal * 0.22;
        colorData.data[i * 4] = Math.min(
          255,
          colorData.data[i * 4] * shade + edgeR * crease * 0.28 + 255 * crease * 0.12,
        );
        colorData.data[i * 4 + 1] = Math.min(
          255,
          colorData.data[i * 4 + 1] * shade + edgeG * crease * 0.28 + 255 * crease * 0.12,
        );
        colorData.data[i * 4 + 2] = Math.min(
          255,
          colorData.data[i * 4 + 2] * shade + edgeB * crease * 0.28 + 255 * crease * 0.12,
        );
      }
      colorData.data[i * 4 + 3] = 255;
    }
    colorCtx.putImageData(
      paintFoilFilmOverlay(colorData, maskAlpha, textureCols, textureRows),
      0,
      0,
    );
  }

  return makeCanvasTexture(colorCanvas, THREE.SRGBColorSpace);
}

function getMylarColors(url: string, tint: string) {
  return (
    MYLAR_COLORS.find((color) => url.includes(color.match)) ?? { color: tint, edge: "#f8fbff" }
  );
}

/**
 * MylarBalloon — a logo-shaped foil balloon. Two mirrored foil sheets share a
 * smooth alpha edge, meet at the sealed rim, and bulge away from each other in
 * the center like pasted Mylar filling with air.
 */
export function MylarBalloon({
  url,
  anchor,
  baseY,
  size,
  tint = "#eef1f7",
  float = 0.2,
  phase = 0,
  speed = 0.75,
  href,
  glanceFrames,
  blinkFrame,
  behavior,
  spin,
  showString = true,
}: BalloonProps) {
  // Neutral face first, then the glance frames, then an optional blink — one
  // shared foil silhouette, one printed face per frame.
  const frameUrls = useMemo(
    () => [url, ...(glanceFrames ?? []), ...(blinkFrame ? [blinkFrame] : [])],
    [url, glanceFrames, blinkFrame],
  );
  const loaded = useTexture(frameUrls);
  const textures = useMemo(() => (Array.isArray(loaded) ? loaded : [loaded]), [loaded]);

  const { color: foilColor, edge: edgeColor } = getMylarColors(url, tint);
  const stringLen = size * 2.15;
  const stringGeometry = useMemo(() => makeStringGeometry(stringLen), [stringLen]);
  const lineBasicMaterial = useMemo(
    () => new THREE.LineBasicMaterial({ color: "#d8dde7", linewidth: 1 }),
    [],
  );
  const stringObject = useMemo(
    () => new THREE.Line(stringGeometry, lineBasicMaterial),
    [stringGeometry, lineBasicMaterial],
  );
  const assets = useMemo(() => {
    const baseImage = textures[0]?.image as HTMLImageElement | undefined;
    if (!baseImage) {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      return {
        geometry: new THREE.BufferGeometry(),
        alphaMap: makeCanvasTexture(canvas, THREE.NoColorSpace),
        colorMaps: [makeCanvasTexture(canvas, THREE.SRGBColorSpace)],
        stringAnchorY: -size * 0.5,
      };
    }
    const silhouette = buildMylarSilhouette(baseImage, size);
    const colorMaps = textures.map((frame) => {
      const image = (frame.image as HTMLImageElement | undefined) ?? baseImage;
      return bakeMylarColorMap(image, silhouette, foilColor, edgeColor);
    });
    return {
      geometry: silhouette.geometry,
      alphaMap: silhouette.alphaMap,
      colorMaps,
      stringAnchorY: silhouette.stringAnchorY,
    };
  }, [textures, size, foilColor, edgeColor]);

  // free the baked canvas textures + geometry when the balloon rebuilds/unmounts
  useEffect(() => {
    return () => {
      assets.alphaMap.dispose();
      for (const map of assets.colorMaps) map.dispose();
      assets.geometry.dispose();
    };
  }, [assets]);

  const balloon = useRef<THREE.Group>(null);
  const stringLine = useRef<THREE.Line>(null);
  const frontMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const backMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const glance = useRef({ idx: 0, until: 0 });
  const deflect = useRef(new THREE.Vector3());
  const collider = useContext(OrbColliderContext);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const y = baseY + Math.sin(t * speed + phase) * float;
    const roll = Math.sin(t * 0.58 + phase) * 0.065;

    // idle personality — a slow positional drift on top of the bob. The
    // matching yaw (turning to face where it's going) is computed below.
    let motionX = 0;
    let motionY = 0;
    if (behavior === "swim") {
      motionX = Math.sin(t * 0.5 + phase) * size * 0.32;
    } else if (behavior === "walk") {
      motionX = Math.sin(t * 0.32 + phase) * size * 0.16;
      motionY = Math.abs(Math.sin(t * 1.5 + phase)) * size * 0.1;
    } else if (behavior === "flap") {
      motionY = Math.abs(Math.sin(t * 2.3 + phase)) * size * 0.05;
    }

    // contact-marble collision: when the orbiting "@" marble reaches this
    // balloon it shoves it away from the point of contact; the balloon springs
    // out fast, then eases back to its tether once the marble passes.
    let pushX = 0;
    let pushY = 0;
    let pushZ = 0;
    if (collider?.active) {
      const dx = anchor[0] - collider.position.x;
      const dy = y - collider.position.y;
      const dz = anchor[2] - collider.position.z;
      const dist = Math.hypot(dx, dy, dz);
      const minDist = size * 0.55 + collider.radius;
      if (dist > 1e-3 && dist < minDist) {
        const pen = Math.min(0.85, (minDist - dist) / minDist);
        const strength = (size * 0.6 * pen) / dist;
        pushX = dx * strength;
        pushY = dy * strength;
        pushZ = dz * strength;
      }
    }
    const d = deflect.current;
    const targetMag = pushX * pushX + pushY * pushY + pushZ * pushZ;
    const k = targetMag > d.lengthSq() ? 0.3 : 0.05;
    d.x += (pushX - d.x) * k;
    d.y += (pushY - d.y) * k;
    d.z += (pushZ - d.z) * k;

    // glance scheduler: rest on the neutral face, dart to a look frame now and
    // then, blink occasionally. Only runs when extra frames were supplied.
    const frameCount = assets.colorMaps.length;
    if (frameCount > 1 && t > glance.current.until) {
      const glanceCount = glanceFrames?.length ?? 0;
      const blinkIdx = blinkFrame ? frameCount - 1 : -1;
      const roll2 = Math.random();
      let idx = 0;
      let dwell = 1.4 + Math.random() * 1.9;
      if (blinkIdx >= 0 && roll2 < 0.14) {
        idx = blinkIdx;
        dwell = 0.13;
      } else if (glanceCount > 0 && roll2 < 0.6) {
        idx = 1 + Math.floor(Math.random() * glanceCount);
        dwell = 0.55 + Math.random() * 0.95;
      }
      glance.current.idx = idx;
      glance.current.until = t + dwell;
      const map = assets.colorMaps[idx];
      if (frontMat.current) {
        frontMat.current.map = map;
        frontMat.current.needsUpdate = true;
      }
      if (backMat.current) {
        backMat.current.map = map;
        backMat.current.needsUpdate = true;
      }
    }

    if (balloon.current) {
      balloon.current.position.set(anchor[0] + d.x + motionX, y + d.y + motionY, anchor[2] + d.z);
      const faceCamera = Math.atan2(
        state.camera.position.x - anchor[0],
        state.camera.position.z - anchor[2],
      );
      let yaw: number;
      if (behavior === "swim") {
        // holds broadside while gliding, pivots through its edge to turn around
        // at each end of the sweep (motionX and this cos share a phase) — the
        // +tanh keeps it nose-first (leading) in whichever way it's heading
        yaw = (Math.PI / 2) * (1 + Math.tanh(Math.cos(t * 0.5 + phase) * 3));
      } else if (behavior === "flap") {
        yaw = faceCamera + Math.sin(t * 1.15 + phase) * 0.85;
      } else if (spin) {
        yaw = t * spin + phase; // full continuous 360, like the coin
      } else if (behavior === "walk") {
        yaw = faceCamera + Math.sin(t * 0.4 + phase) * 0.6;
      } else {
        yaw = faceCamera + Math.sin(t * 0.42 + phase) * 0.1;
      }
      balloon.current.rotation.y = yaw;
      balloon.current.rotation.z = roll;
      const target = hovered ? 1.08 : 1;
      const s = balloon.current.scale.x + (target - balloon.current.scale.x) * 0.15;
      balloon.current.scale.setScalar(s);
    }

    if (stringLine.current) {
      const stringPosition = stringLine.current.geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      for (let i = 0; i <= STRING_SEGMENTS; i++) {
        const along = i / STRING_SEGMENTS;
        const slack = Math.sin(along * Math.PI);
        const tail = along * along;
        const side =
          (Math.sin(t * 1.15 + phase + along * 4.6) * slack +
            Math.sin(t * 0.42 + phase) * tail * 0.4) *
          size *
          STRING_SWAY.side;
        const depth =
          Math.sin(t * 0.9 + phase * 1.3 - along * 2.9) * slack * size * STRING_SWAY.depth;
        stringPosition.setXYZ(i, side, -stringLen * along, depth);
      }
      stringPosition.needsUpdate = true;
      stringLine.current.rotation.z = -roll * 0.95;
      stringLine.current.geometry.computeBoundingSphere();
    }
  });

  return (
    <group ref={balloon}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: r3f <mesh> is a WebGL object, not a DOM element */}
      <group
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
        <mesh geometry={assets.geometry}>
          <meshPhysicalMaterial
            ref={frontMat}
            map={assets.colorMaps[0]}
            alphaMap={assets.alphaMap}
            alphaTest={0.08}
            depthWrite
            color="#ffffff"
            metalness={0.82}
            roughness={0.13}
            clearcoat={1}
            clearcoatRoughness={0.04}
            envMapIntensity={2.15}
            iridescence={0.42}
            iridescenceIOR={1.5}
            iridescenceThicknessRange={IRIDESCENCE_THICKNESS}
            anisotropy={0.55}
            anisotropyRotation={Math.PI * 0.22}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh geometry={assets.geometry} scale={[1, 1, -1]}>
          <meshPhysicalMaterial
            ref={backMat}
            map={assets.colorMaps[0]}
            alphaMap={assets.alphaMap}
            alphaTest={0.08}
            depthWrite
            color="#ffffff"
            metalness={0.82}
            roughness={0.13}
            clearcoat={1}
            clearcoatRoughness={0.04}
            envMapIntensity={2.15}
            iridescence={0.42}
            iridescenceIOR={1.5}
            iridescenceThicknessRange={IRIDESCENCE_THICKNESS}
            anisotropy={0.55}
            anisotropyRotation={Math.PI * 0.22}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {showString && (
        <primitive ref={stringLine} object={stringObject} position={[0, assets.stringAnchorY, 0]} />
      )}
    </group>
  );
}
