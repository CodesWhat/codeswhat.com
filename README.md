# CodesWhat website

Private source for the public CodesWhat org site at codeswhat.com. The
Next.js app lives in `frontend/`; everything deployable is under that
directory.

## What this repo is (and isn't)

This is permanently private infrastructure, not a community project. That's
why there's no LICENSE, CONTRIBUTING, SECURITY policy, or CODEOWNERS here:
the site's source isn't published, only the rendered site is. The tier
decision and rationale live in the private ops repo
(`decisions/repository-tiers.md`).

## Working here

- Flow: feature branches PR into `dev`, then `dev` promotes to `main`.
- CI: `website.yml` runs the website contract checks.
- Deploys: Vercel, but git-integration deploys are broken for this repo (a
  private repo in a GitHub org can't deploy on the Hobby plan). Production
  deploys happen from a local checkout with
  `npx vercel deploy --prod --scope codeswhat`.
- Analytics: PostHog via the shared "CodesWhat Public Websites" project,
  proxied through `e.codeswhat.com`, cookieless.

## More docs

- `docs/README.md` - development guide
- `frontend/README-VERCEL.md` - deploy specifics
- `ROADMAP.md` - planned sections and site direction
