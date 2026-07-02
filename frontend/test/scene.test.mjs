import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();

const MYLAR = "components/site/scene/balloons/MylarBalloon.tsx";
const readMylar = () => readFileSync(join(root, MYLAR), "utf8");

test("the live 3D scene components exist", () => {
  for (const file of [
    "components/site/FloatingSceneCanvas.tsx",
    "components/site/scene/BoardObjects.tsx",
    "components/site/scene/ContactMarble.tsx",
    "components/site/scene/collisionContext.ts",
    "components/site/scene/balloons/MylarBalloon.tsx",
    "components/site/scene/balloons/types.ts",
  ]) {
    assert.equal(existsSync(join(root, file)), true, `${file} should exist`);
  }
});

test("three is installed for the WebGL scene", () => {
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.equal(typeof packageJson.dependencies.three, "string", "three should be installed");
});

test("Mylar balloons keep their foil physical material", () => {
  const mylarSource = readMylar();

  assert.match(mylarSource, /meshPhysicalMaterial/);
  assert.match(mylarSource, /iridescence/);
  assert.match(mylarSource, /cols: 360/);
  assert.doesNotMatch(mylarSource, /scale=\{\[1\.0[1-9]/);
});

test("Mylar balloons use mirrored opaque sheets pinched at the rim", () => {
  const mylarSource = readMylar();

  assert.match(mylarSource, /scale=\{\[1, 1, -1\]\}/);
  assert.match(mylarSource, /alphaTest=\{0\.08\}/);
  assert.match(mylarSource, /depthWrite/);
  assert.doesNotMatch(mylarSource, /\s+transparent\b/);
});

test("Mylar balloons keep a smooth foil surface without ribbed bump maps", () => {
  const mylarSource = readMylar();

  assert.doesNotMatch(mylarSource, /makeCrinkleBumpTexture/);
  assert.doesNotMatch(mylarSource, /roughnessMap/);
  assert.doesNotMatch(mylarSource, /bumpMap/);
  assert.doesNotMatch(mylarSource, /bumpScale/);
  assert.doesNotMatch(mylarSource, /\bcrinkle\b/);
});

test("Mylar alpha map preserves black logo details as opaque", () => {
  const mylarSource = readMylar();

  assert.match(mylarSource, /paintAlphaMapChannels/);
  assert.match(mylarSource, /alphaMap reads the green channel/);
  assert.match(mylarSource, /data\[i \+ 1\] = mask/);
});

test("Mylar balloons bake a subtle foil film into the color texture", () => {
  const mylarSource = readMylar();

  assert.match(mylarSource, /paintFoilFilmOverlay/);
  assert.match(mylarSource, /inkGuard/);
  assert.match(mylarSource, /colorCtx\.putImageData\(\s*paintFoilFilmOverlay/s);
});

test("Mylar foil film reads at the default board distance", () => {
  const mylarSource = readMylar();

  assert.match(mylarSource, /MYLAR_FILM/);
  assert.match(mylarSource, /macroScale: 0\.56/);
  assert.match(mylarSource, /highlightStrength: 40/);
  assert.match(mylarSource, /softBandStrength: 26/);
});

test("Mylar strings attach directly to the lowest silhouette point", () => {
  const mylarSource = readMylar();

  assert.match(mylarSource, /stringAnchorY/);
  assert.match(mylarSource, /position=\{\[0, assets\.stringAnchorY, 0\]\}/);
  assert.match(mylarSource, /new THREE\.Line/);
  assert.doesNotMatch(mylarSource, /neckY|neckH|knotY/);
  assert.doesNotMatch(mylarSource, /sphereGeometry/);
});

test("Mylar strings behave like flexible thread instead of rigid rods", () => {
  const mylarSource = readMylar();

  assert.match(mylarSource, /STRING_SEGMENTS/);
  assert.match(mylarSource, /makeStringGeometry/);
  assert.match(mylarSource, /stringLine/);
  assert.match(mylarSource, /setXYZ/);
  assert.match(mylarSource, /needsUpdate = true/);
  assert.match(mylarSource, /lineBasicMaterial/);
  assert.doesNotMatch(mylarSource, /cylinderGeometry args=\{\[0\.006, 0\.006, stringLen, 8\]\}/);
});
