# CodesWhat site roadmap

Loose, personal roadmap for the CodesWhat homepage. Not a ticket tracker (that's
work). Just the ideas worth not forgetting.

## Where things stand (2026-10-25, evening)

The Catalogue redesign, the `/support` page and the analytics events shipped on
2026-10-22 (#69, #70, #71). On 2026-10-25 the dependency security patch (#72:
Next 16.4.3, dompurify 3.4.17, sharp 0.35.5, which cleared every open Dependabot
alert) and the CI hardening batch (#73: support tests in `verify`, no duplicate
promotion runs, fork-safe skip, no persisted checkout credential, actions pinned
to commits, stray `visual-schedule-manager-portfolio/` and `start.sh` removed)
were promoted together in #74. Production is `main@722af11`, checked in a
browser after the deploy.

Still open:

- [ ] Clean up `test/posthog.test.ts`, which imports a posthog-js internal path,
      then bump `posthog-js` and add `test:posthog:browser` to CI.
- [ ] #57 is partly done (pins, credentials, CSP and input tests); the remaining
      items are tracked privately.

## Progressive-enhancement fallback for the 3D layer

**Superseded 2026-10-22.** The Catalogue redesign replaced the WebGL homepage
with CSS and pixel-sprite specimen plates (`components/catalogue/sprites.ts`).
three.js, react-three-fiber, drei and rapier are now only imported under
`components/studio/`, which backs the dev-only `/studio/*` capture routes. There
is no 3D layer on the shipped homepage to gate or fall back from, so the original
checklist below is moot and kept for the reasoning only.

The original idea: the homepage rendered its coin, mascot balloons and the `@`
marble live in WebGL. That bought real interactivity (balloons tracking scroll and
dodging the cursor, the marble orbiting and fleeing) at the cost of compute,
battery and hydration time on cheap phones. Baked WebP loops were nearly free to
render but couldn't react to anything. The plan was to serve flat assets by
default and upgrade to WebGL behind `prefers-reduced-motion` and a capability
check, lazy-loading the 3D bundle only on the upgrade path, and to measure First
Load JS and TTI for both paths rather than guess.

- [ ] Decide whether the three/fiber/drei/rapier dependencies stay for the
      `/studio` capture rig or go. They're dev-only but still in `package.json`
      and the lockfile, so they show up in audits (`fflate` moderate via drei).

## Coherent 3D brand-asset / icon set

**Parked 2026-10-25.** The Catalogue uses hand-drawn pixel sprites for all eight
projects plus the coin, matched to the real project logos, so the 3D-minted
icon set isn't on the critical path any more. `scripts/capture-assets.mjs` and
the `/studio/*` routes still work and still mint the coin spin and any mascot
balloon (square avatar still + spin). What exists today: `exports/coin/`
(light and dark spin WebP) and `exports/portkey/` (avatar PNG + spin WebP), plus
static balloon PNGs for drydock, portkey, portwing, sockguard and scott in
`frontend/public/logos/`.

- [ ] Avatar + spin for every mascot (Sockguard, Drydock, Portwing, Portkey), not just Portkey
- [ ] Decide where committed assets live and how they're named (currently `exports/<subject>/`, WebP + still PNG tracked, GIF/APNG gitignored)
- [ ] Consider using the minted assets as the real project icons / OG images / repo avatars
- [ ] Light + dark (inverted) variants where it makes sense

## Web-analytics table coverage (2026-08-28, ops X37)

Production events carried no `$pathname` and no `$pageleave`, so PostHog's Page /
Entry / Exit tables rendered empty and every session counted as a zero-duration
bounce. The wiring for both landed as PR #60 and has been in production since the
September promotions.

- [x] Verified 2026-10-25 against PostHog project 558033 (host `codeswhat.com`,
      last 30 days): 30 `$pageview`, all 30 carrying `$pathname`; 9 `$pageleave`;
      22 `$web_vitals`. The Page/Entry/Exit tables have data to render.
- [x] `$pageleave` volume note (resolved 2026-08-28, standard `19a0af1`): a
      pageleave-to-pageview ratio well under 100% is structural, not a bug —
      `$pageview` fires per client-side route change, `$pageleave` once per
      document lifetime. drydock measured the envelope: the sanitizer guard
      eats nothing. Don't "fix" the ratio here.
- [x] Post-deploy canary caveat: moot now that real traffic confirms the
      properties. For the record, posthog-js bot detection (`isLikelyBot` on
      `navigator.webdriver` and `userAgentData.brands`) may silently drop
      Playwright-driven visits before `before_send` runs, so a Playwright canary's
      silence proves nothing either way. Verify with a real browser or by reading
      the deployed chunk.
- [x] Acquisition data: decided org-wide in `CodesWhat/ops`
      `standards/analytics.md` ("Acquisition data and consent", as of
      `c161ebc`) — that file is the authority. Landed: `save_campaign_params:
      true` with `mask_personal_data_properties: true` (masks
      `gclid`/`fbclid`/`msclkid` and the rest of the SDK's per-click ids);
      `save_referrer: true` with the sanitizer forwarding `$referring_domain`
      only (bare hostname, never `$referrer`). The sanitizer forwards only
      `utm_source` (github, x, bluesky, linkedin, reddit, hackernews,
      newsletter, producthunt), `utm_medium` (social, email, referral,
      community) and `utm_campaign` (`/^[a-z0-9-]{1,40}$/`); everything else is
      dropped. The vocabulary is pending Scott's approval. Geo stays off
      (cookieless strips the IP upstream, PostHog #48660). No banner needed.
- [x] `$web_vitals` carries `$pathname` from the sanitized path
- [x] `cta activated` for the project cards: `project_<slug>` ids, placement
      `projects`. Shipped 2026-10-22 (#68/#70). Capture, sanitizer and send path
      were reproduced in a browser before shipping.
- [ ] Production fire check for `cta activated`, `newsletter submitted` and
      `client error`: none of the three has a row for host `codeswhat.com` in the
      30 days to 2026-10-25. With 30 pageviews in that window that's low traffic,
      not evidence of a bug, so leave this open until one lands or a real-browser
      click on production is checked in PostHog.
- [x] `newsletter submitted` (`result`, plus `error_class` from
      invalid_email / rate_limited / unavailable / network on error)
- [x] `client error` (`error_kind`, allowlisted `error_name`, sanitized path;
      max 5 per page load; `capture_exceptions` stays off)

## Telemetry and badge audit (2026-08-14)

- The main website has no visible external provider badge surface to migrate.
- The homepage project status labels are product content, not telemetry or
  provider badges.
- Stale Vercel Analytics references were documentation-only and are removed as
  part of the PostHog rollout.
- Broader badge additions or removals remain a product/content decision and are
  deferred rather than expanded into this telemetry change.
