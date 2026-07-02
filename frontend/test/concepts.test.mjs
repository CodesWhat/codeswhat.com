import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();

const requiredFiles = [
  "app/concepts/page.tsx",
  "app/concepts/atlas/page.tsx",
  "app/concepts/console/page.tsx",
  "app/concepts/gallery/page.tsx",
  "app/concepts/board/page.tsx",
  "components/concepts/AtlasConcept.tsx",
  "components/concepts/ConsoleConcept.tsx",
  "components/concepts/GalleryConcept.tsx",
  "components/concepts/BoardConcept.tsx",
  "components/concepts/BoardScene.tsx",
  "components/concepts/balloons/MylarBalloon.tsx",
  "components/concepts/WebglShowcaseScene.tsx",
  "components/concepts/ConceptShell.tsx",
];

test("concept prototype routes and components exist", () => {
  for (const file of requiredFiles) {
    assert.equal(existsSync(join(root, file)), true, `${file} should exist`);
  }
});

test("concept index links every prototype", () => {
  const indexPath = join(root, "app/concepts/page.tsx");
  const source = readFileSync(indexPath, "utf8");

  for (const slug of ["atlas", "console", "gallery", "board"]) {
    assert.match(source, new RegExp(`/concepts/${slug}`));
  }
});

test("each prototype preserves the CodesWhat showcase identity", () => {
  for (const file of [
    "components/concepts/AtlasConcept.tsx",
    "components/concepts/ConsoleConcept.tsx",
    "components/concepts/GalleryConcept.tsx",
  ]) {
    const source = readFileSync(join(root, file), "utf8");
    assert.match(source, /CodesWhat/);
    assert.match(source, /Drydock|Rolester/);
  }
});

test("creative prototypes use the shared WebGL showcase scene", () => {
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.equal(typeof packageJson.dependencies.three, "string", "three should be installed");

  for (const file of [
    "components/concepts/AtlasConcept.tsx",
    "components/concepts/GalleryConcept.tsx",
  ]) {
    const source = readFileSync(join(root, file), "utf8");
    assert.match(source, /WebglShowcaseScene/);
  }
});

test("board exposes a dedicated Mylar balloon style", () => {
  const typeSource = readFileSync(join(root, "components/concepts/balloons/types.ts"), "utf8");
  const conceptSource = readFileSync(join(root, "components/concepts/BoardConcept.tsx"), "utf8");
  const sceneSource = readFileSync(join(root, "components/concepts/BoardScene.tsx"), "utf8");
  const mylarSource = readFileSync(
    join(root, "components/concepts/balloons/MylarBalloon.tsx"),
    "utf8",
  );

  assert.match(typeSource, /"mylar"/);
  // switcher is gone — the board mounts directly and defaults to the Mylar style
  assert.match(conceptSource, /<BoardScene/);
  assert.match(sceneSource, /variant = "mylar"/);
  assert.match(sceneSource, /MylarBalloon/);
  assert.match(mylarSource, /meshPhysicalMaterial/);
  assert.match(mylarSource, /iridescence/);
  assert.match(mylarSource, /cols: 360/);
  assert.doesNotMatch(mylarSource, /scale=\{\[1\.0[1-9]/);
});

test("Mylar balloons use mirrored opaque sheets pinched at the rim", () => {
  const mylarSource = readFileSync(
    join(root, "components/concepts/balloons/MylarBalloon.tsx"),
    "utf8",
  );

  assert.match(mylarSource, /scale=\{\[1, 1, -1\]\}/);
  assert.match(mylarSource, /alphaTest=\{0\.08\}/);
  assert.match(mylarSource, /depthWrite/);
  assert.doesNotMatch(mylarSource, /\s+transparent\b/);
});

test("Mylar balloons keep a smooth foil surface without ribbed bump maps", () => {
  const mylarSource = readFileSync(
    join(root, "components/concepts/balloons/MylarBalloon.tsx"),
    "utf8",
  );

  assert.doesNotMatch(mylarSource, /makeCrinkleBumpTexture/);
  assert.doesNotMatch(mylarSource, /roughnessMap/);
  assert.doesNotMatch(mylarSource, /bumpMap/);
  assert.doesNotMatch(mylarSource, /bumpScale/);
  assert.doesNotMatch(mylarSource, /\bcrinkle\b/);
});

test("Mylar alpha map preserves black logo details as opaque", () => {
  const mylarSource = readFileSync(
    join(root, "components/concepts/balloons/MylarBalloon.tsx"),
    "utf8",
  );

  assert.match(mylarSource, /paintAlphaMapChannels/);
  assert.match(mylarSource, /alphaMap reads the green channel/);
  assert.match(mylarSource, /data\[i \+ 1\] = mask/);
});

test("Mylar balloons bake a subtle foil film into the color texture", () => {
  const mylarSource = readFileSync(
    join(root, "components/concepts/balloons/MylarBalloon.tsx"),
    "utf8",
  );

  assert.match(mylarSource, /paintFoilFilmOverlay/);
  assert.match(mylarSource, /inkGuard/);
  assert.match(mylarSource, /colorCtx\.putImageData\(\s*paintFoilFilmOverlay/s);
});

test("Mylar foil film reads at the default board distance", () => {
  const mylarSource = readFileSync(
    join(root, "components/concepts/balloons/MylarBalloon.tsx"),
    "utf8",
  );

  assert.match(mylarSource, /MYLAR_FILM/);
  assert.match(mylarSource, /macroScale: 0\.56/);
  assert.match(mylarSource, /highlightStrength: 40/);
  assert.match(mylarSource, /softBandStrength: 26/);
});

test("Mylar strings attach directly to the lowest silhouette point", () => {
  const mylarSource = readFileSync(
    join(root, "components/concepts/balloons/MylarBalloon.tsx"),
    "utf8",
  );

  assert.match(mylarSource, /stringAnchorY/);
  assert.match(mylarSource, /position=\{\[0, assets\.stringAnchorY, 0\]\}/);
  assert.match(mylarSource, /new THREE\.Line/);
  assert.doesNotMatch(mylarSource, /neckY|neckH|knotY/);
  assert.doesNotMatch(mylarSource, /sphereGeometry/);
});

test("Mylar strings behave like flexible thread instead of rigid rods", () => {
  const mylarSource = readFileSync(
    join(root, "components/concepts/balloons/MylarBalloon.tsx"),
    "utf8",
  );

  assert.match(mylarSource, /STRING_SEGMENTS/);
  assert.match(mylarSource, /makeStringGeometry/);
  assert.match(mylarSource, /stringLine/);
  assert.match(mylarSource, /setXYZ/);
  assert.match(mylarSource, /needsUpdate = true/);
  assert.match(mylarSource, /lineBasicMaterial/);
  assert.doesNotMatch(mylarSource, /cylinderGeometry args=\{\[0\.006, 0\.006, stringLen, 8\]\}/);
});
