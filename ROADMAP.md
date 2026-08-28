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

## Web-analytics table coverage (2026-08-28, ops X37)

Production events carry no `$pathname` and no `$pageleave`, so PostHog's Page /
Entry / Exit tables render empty and every session counts as a zero-duration
bounce. The wiring for both landed on dev as PR #60 (sanitizer allowlists
`$pageleave` and stamps `$pathname` from the already-sanitized `path`) and
ships with the next promotion — the items below are what's left after that.

- [ ] Verify post-deploy that `$pathname` shows on fresh pageviews and the
      Page/Entry/Exit tables populate (board: CodesWhat Sites Health,
      project 558033, dashboard 2044260)
- [ ] `$pageleave` delivery rate: drydock lands only ~17.6% of pageview volume
      (sendBeacon unload envelopes can miss `$raw_user_agent`/`$host`; relaxing
      the sanitizer guard just moves the drop to cookieless ingestion's silent
      `cookieless_missing_user_agent` discard). Their lane is measuring the
      real fix — copy their answer, don't relax the guard here.
- [ ] Acquisition data: decided org-wide in `CodesWhat/ops`
      `standards/analytics.md` ("Acquisition data and consent", as of
      `c161ebc`) — that file is the authority. Shape: `save_campaign_params:
      true` with `gclid`/`fbclid`/`msclkid` excluded; `save_referrer: true`
      with the sanitizer forwarding `$referring_domain` only (drop it unless
      it's a bare hostname, never copy `$referrer`); geo stays off (cookieless
      strips the IP upstream, PostHog #48660). No banner needed. Implement
      AFTER the `$pathname`/`$pageleave` promotion is verified in production,
      so the two changes are separately attributable.

## Telemetry and badge audit (2026-08-14)

- The main website has no visible external provider badge surface to migrate.
- The homepage project status labels are product content, not telemetry or
  provider badges.
- Stale Vercel Analytics references were documentation-only and are removed as
  part of the PostHog rollout.
- Broader badge additions or removals remain a product/content decision and are
  deferred rather than expanded into this telemetry change.
