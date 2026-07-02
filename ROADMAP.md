# CodesWhat site roadmap

Loose, personal roadmap for the CodesWhat homepage. Not a ticket tracker (that's
work). Just the ideas worth not forgetting.

## Progressive-enhancement fallback for the 3D layer

The homepage renders its coin, mascot balloons, and the `@` marble live in WebGL
(three.js + react-three-fiber). That buys real interactivity: the balloons track
scroll and dodge the cursor, the marble orbits and flees. The cost isn't mainly
bandwidth (the three/fiber/drei bundle is ~300KB gzipped, loaded once and cached,
and the texture PNGs load either way). The cost is compute: WebGL burns CPU/GPU
and battery and adds parse + hydration time, which hurts on cheap phones.

Baked assets (the WebP loops in `exports/`) are the opposite: nearly free to
render, but dumb. They can't track scroll or react to the pointer.

So the move for a lighter homepage isn't ripping WebGL out. It's a fallback:
serve flat assets by default and upgrade to WebGL when the device can handle it,
or when `prefers-reduced-motion` is off. That's more code, not less, but it gives
weak devices and reduced-motion users a cheap, static homepage while everyone
else still gets the interactive scene.

- [ ] Static fallback layer (coin WebP + balloon stills positioned to match the scene)
- [ ] Gate WebGL behind `prefers-reduced-motion` + a capability/perf check
- [ ] Lazy-load the 3D bundle only when the upgrade path is taken
- [ ] Measure: real First Load JS + TTI for both paths (build, don't guess)

## Coherent 3D brand-asset / icon set

`scripts/capture-assets.mjs` mints transparent assets straight from the live scene
(dev-only `/studio/*` routes → headless Chrome → ffmpeg/img2webp). It already does
the coin (spin) and any mascot balloon (square avatar still + spin). Make the whole
icon/image story coherent off the back of it:

- [ ] Avatar + spin for every mascot (Sockguard, Drydock, Portwing, Portkey), not just Portkey
- [ ] Decide where committed assets live and how they're named (currently `exports/<subject>/`, WebP + still PNG tracked, GIF/APNG gitignored)
- [ ] Consider using the minted assets as the real project icons / OG images / repo avatars
- [ ] Light + dark (inverted) variants where it makes sense
