# CodesWhat website

Public source for [codeswhat.com](https://codeswhat.com), the CodesWhat project
and consulting site. The deployed Next.js application lives in `frontend/`.

## Development

Use Node.js 24. From `frontend/`, install the locked dependencies with `npm ci`
and start the development server with `npm run dev`.

Existing checks are `npm run lint`, `npm run type-check`, `npm run test:scene`
and `npm run test:posthog`. Run `npm run build`, then `npm run test:browser`
to check the production page and invalid newsletter input. The browser check
uses the existing Playwright dependency with installed Chromium or Chrome;
CI installs its matching Chromium build. It uses a temporary local server
and blocks external requests.
The root Lefthook configuration runs staged Biome checks and typechecking at
commit time. Keep those checks enabled.

Changes go through a feature PR into `dev`, followed by a reviewed promotion
from `dev` to `main`. Preserve the same tested content through promotion.
The `Website contracts` workflow checks pull requests and the integration and
production branches.

## Deployment and verification

Vercel's Git integration deploys `main` to production with `frontend/` as the
project root. Verify the deployment's source commit and the actual page after
promotion. A successful build or pageview event does not prove that the page's
client components initialized.

The Content Security Policy uses a fresh request nonce for Next's generated
scripts and the initial theme script. HTML renders per request; immutable
JavaScript and static assets keep their existing caching. Keep the request and
response policies consistent, and verify a real theme toggle and mounted scene
when changing scripts, headers or rendering.

Analytics uses the shared CodesWhat Public Websites PostHog project through
`e.codeswhat.com`, with the existing cookieless sanitizer. Preview and local
development should leave its production-only environment values unset.
Newsletter delivery uses server-side EmailOctopus credentials. See the
[deployment guide](frontend/README-VERCEL.md) for configuration.

## Repository boundaries

Internal plans and operational scratch belong in ignored `.planning/`, and
`.claude/` stays ignored to protect nested agent worktrees. Neither is a build input.
Don't commit credentials or local environment files. Existing public source
does not imply that private planning is safe to publish here.
