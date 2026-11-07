# CodesWhat site roadmap

Loose, personal roadmap for the CodesWhat homepage. Not a ticket tracker. Just
the open ideas worth not forgetting; shipped work lives in the git history.

The Catalogue design is the shipped homepage: CSS and pixel-sprite specimen
plates (`frontend/components/catalogue/sprites.ts`). The old WebGL homepage and
its progressive-enhancement fallback plan are gone with it.

Already shipped, so not on the list below: double opt-in newsletter signup with
Turnstile (`/api/subscribe`), the nonce-based CSP set in the Next proxy, PostHog
through the `e.codeswhat.com` proxy, the `/support` page with Stripe Payment
Links, `llms.txt` and `.well-known/security.txt`.

## Open

- [ ] #57, the public-repo security baseline, is partly done. The remaining
      items are tracked privately.

## Parked: coherent 3D brand-asset set

- [ ] Decide whether three, react-three-fiber, drei and rapier stay. They're only
      imported under `frontend/components/studio/`, which backs the dev-only
      `/studio/*` capture routes (they 404 in production), but they're still in
      `frontend/package.json` and the lockfile, so they show up in audits.

The Catalogue uses hand-drawn pixel sprites, so a 3D-minted icon set isn't on
the critical path. `frontend/scripts/capture-assets.mjs` and the `/studio/*`
routes still work. What exists today: `exports/coin/` (light and dark spin WebP)
and `exports/portkey/` (avatar PNG and spin WebP), plus static balloon PNGs in
`frontend/public/logos/`.

- [ ] Avatar and spin for every mascot, not just Portkey
- [ ] Decide where committed assets live and how they're named (currently
      `exports/<subject>/`, WebP and still PNG tracked, GIF/APNG gitignored)
- [ ] Consider using the minted assets as project icons, OG images or repo avatars
- [ ] Light and dark variants where it makes sense
