# CodesWhat website

Public source for [codeswhat.com](https://codeswhat.com), the CodesWhat project
and consulting site. The deployed Next.js application lives in `frontend/`.

## Development

Use Node.js 24. From `frontend/`, install the locked dependencies with `npm ci`
and start the development server with `npm run dev`.

Existing checks are `npm run lint`, `npm run type-check`, `npm run test:scene`,
`npm run test:posthog`, `npm run test:support` and `npm run test:subscribe`.
Run `npm run build:test`, then `npm run test:browser` to check the production page
and invalid newsletter input. The browser check uses the existing Playwright
dependency with installed Chromium or Chrome. `build:test` bakes in the support and
Turnstile fixtures the page reads at build time. CI runs `npm run test:browser:all`,
which repeats it on Chromium, Firefox and WebKit. It uses a temporary local
server and blocks external requests.
The root Lefthook configuration runs staged Biome checks and typechecking at
commit time, plus gitleaks on staged changes when it's installed. Pre-push runs
`qlty check` against `origin/dev` when qlty is installed. Keep those checks enabled.

Changes go through a feature PR into `dev`, followed by a reviewed promotion
from `dev` to `main`. Preserve the same tested content through promotion.
The `Website contracts` workflow checks pull requests and pushes to `dev` and
`main`. The test work runs in a `tests` job inside the digest-pinned Playwright
container. A `reuse` job skips it when the exact tree already passed on a `dev`
push, and the always-run `verify` job is the gate (the required check). CodeQL
runs on pushes to `main`, pull requests to `main` and `dev`, and weekly. OpenSSF
Scorecard runs on pushes to `main`, weekly and on branch protection changes.

## Deployment and verification

Vercel's Git integration deploys `main` to production with `frontend/` as the
project root. Production is the only deployment target: `dev` doesn't deploy
and there are no preview deployments. Verify the deployment's source commit and the actual page after
promotion. A successful build or pageview event does not prove that the page's
client components initialized.

Marketing pages are prerendered. `next.config.ts` defines the security headers, and
the CSP is one static policy whose `script-src` hashes each inline script. Next writes
per-build inline scripts into every page, so `csp-adapter.mjs` computes the hashes in
`next build` and fills them in before delegating to Vercel's build adapter. Check the theme toggle and specimen plates when changing scripts,
headers or rendering.

Analytics uses the shared CodesWhat Public Websites PostHog project through
`e.codeswhat.com`, with the existing cookieless sanitizer. Local
development and CI leave its production-only environment values unset.
Newsletter delivery uses server-side EmailOctopus credentials. See the
[deployment guide](frontend/README-VERCEL.md) for configuration.

## Repository boundaries

Internal plans and operational scratch belong in ignored `.planning/`, and
`.claude/` stays ignored to protect nested agent worktrees. Neither is a build input.
Don't commit credentials or local environment files. Existing public source
does not imply that private planning is safe to publish here.

## License

All rights reserved. See [LICENSE](LICENSE). The projects the site describes have their own licenses.
