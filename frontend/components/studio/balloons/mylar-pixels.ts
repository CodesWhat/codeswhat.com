// Pixel passes for the Mylar balloon textures, kept free of three so they can be tested directly.
type PixelBuffer = { data: Uint8ClampedArray };

const MYLAR_FILM = {
  macroScale: 0.56,
  highlightStrength: 40,
  softBandStrength: 26,
  shadowStrength: 0.1,
};

export function paintAlphaMapChannels<T extends PixelBuffer>(imageData: T): T {
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

export function paintFoilFilmOverlay<T extends PixelBuffer>(
  imageData: T,
  maskAlpha: Float32Array,
  w: number,
  h: number,
): T {
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
