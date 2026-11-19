import assert from "node:assert/strict";
import test from "node:test";
import {
  paintAlphaMapChannels,
  paintFoilFilmOverlay,
} from "../components/studio/balloons/mylar-pixels.ts";

const buffer = (pixels: number[][]) => ({ data: new Uint8ClampedArray(pixels.flat()) });

test("alpha map: RGB receives the original alpha", () => {
  const { data } = paintAlphaMapChannels(buffer([[10, 20, 30, 200]]));
  assert.deepEqual([...data], [200, 200, 200, 200]);
});

test("alpha map: opaque black stays opaque", () => {
  const { data } = paintAlphaMapChannels(buffer([[0, 0, 0, 255]]));
  assert.deepEqual([...data], [255, 255, 255, 255]);
});

test("alpha map: alpha is preserved and a zero mask zeroes RGB", () => {
  const { data } = paintAlphaMapChannels(
    buffer([
      [90, 80, 70, 0],
      [1, 2, 3, 128],
    ]),
  );
  assert.deepEqual([...data], [0, 0, 0, 0, 128, 128, 128, 128]);
});

test("foil film: zero-mask pixels are unchanged", () => {
  const pixels = [
    [90, 80, 70, 0],
    [12, 34, 56, 255],
  ];
  const image = buffer(pixels);
  paintFoilFilmOverlay(image, new Float32Array([0, 0]), 2, 1);
  assert.deepEqual([...image.data], pixels.flat());
});

test("foil film: output stays in channel bounds, keeps alpha and changes opaque pixels", () => {
  const w = 16;
  const h = 16;
  const count = w * h;
  const pixels = Array.from({ length: count }, (_, i) => [
    i % 2 ? 250 : 128,
    i % 3 ? 255 : 100,
    i % 5 ? 240 : 128,
    255,
  ]);
  const before = buffer(pixels);
  const after = buffer(pixels);
  paintFoilFilmOverlay(after, new Float32Array(count).fill(1), w, h);
  let changed = 0;
  for (let i = 0; i < after.data.length; i++) {
    assert.ok(after.data[i] >= 0 && after.data[i] <= 255);
    if (i % 4 === 3) assert.equal(after.data[i], 255, "alpha is preserved");
    else if (after.data[i] !== before.data[i]) changed += 1;
  }
  assert.ok(changed > 0, "the film alters opaque pixels");
});
