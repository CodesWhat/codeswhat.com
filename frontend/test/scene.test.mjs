import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();

const SCENE_FILES = [
  "components/studio/BalloonStudio.tsx",
  "components/studio/BoardObjects.tsx",
  "components/studio/CoinStudio.tsx",
  "components/studio/captureRig.tsx",
  "components/studio/collisionContext.ts",
  "components/studio/balloons/MylarBalloon.tsx",
  "components/studio/balloons/types.ts",
];

const importsThree = (source) => /from "(three|@react-three\/[^"]+)"/.test(source);

function sourceFiles(dir) {
  const found = [];
  for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...sourceFiles(path));
    else if (/\.(ts|tsx)$/.test(entry.name)) found.push(path);
  }
  return found;
}

test("the 3D asset-capture components live under components/studio", () => {
  for (const file of SCENE_FILES) {
    assert.equal(existsSync(join(root, file)), true, `${file} should exist`);
  }
  assert.equal(existsSync(join(root, "components/site")), false, "the old site tree is gone");
});

test("the shipped site never imports three or react-three", () => {
  const shipped = [
    ...sourceFiles("app").filter((file) => !file.startsWith(join("app", "studio"))),
    ...sourceFiles("components/catalogue"),
    ...sourceFiles("lib"),
    "instrumentation-client.ts",
  ];
  assert.ok(shipped.length > 10);
  for (const file of shipped) {
    assert.equal(
      importsThree(readFileSync(join(root, file), "utf8")),
      false,
      `${file} imports three`,
    );
  }
});

test("the root layout renders no floating scene", () => {
  const layout = readFileSync(join(root, "app/layout.tsx"), "utf8");
  const siteLayout = readFileSync(join(root, "app/(site)/layout.tsx"), "utf8");
  for (const source of [layout, siteLayout]) {
    assert.doesNotMatch(source, /FloatingScene|SiteBackground|<canvas/i);
  }
  assert.match(siteLayout, /<Shell>/);
});

test("three stays installed only for the dev-only studio capture tools", () => {
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.equal(typeof packageJson.dependencies.three, "string");
  for (const file of sourceFiles("app/studio")) {
    assert.ok(readFileSync(join(root, file), "utf8").includes("components/studio/"), file);
  }
});
