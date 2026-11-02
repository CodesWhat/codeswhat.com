# Vercel Deployment Guide

## Production deployment

The existing Vercel project deploys `CodesWhat/codeswhat.com` from `main`, with
`frontend/` as its root directory and Node.js 24. Feature changes merge into
`dev`, then a reviewed promotion advances `main`. Git integration is working;
a local CLI deployment is not the routine production path.

`vercel.json` turns off Git deployments for `dev` (`git.deploymentEnabled`). The
team's Hobby plan allows 100 deployments a day across every CodesWhat site, and
dev previews were about a third of this project's builds with nobody using them:
a promotion's tree matches a PR head whose preview already built. Feature and fix
PR branches still get previews. The `dev` to `main` promotion PR no longer gets a
Vercel preview check, because `dev` doesn't deploy; `main` still deploys production. Don't swap
this for an Ignored Build Step, because Vercel counts canceled builds against the
same daily limit.

After promotion, confirm the production deployment references the intended
commit. Open the canonical domain and verify the theme toggle changes theme
and persists after reload, the specimen plates render, and `/support` shows its
buy links. Build success and analytics events alone do not establish that client
initialization worked.

Then run the PostHog response contract against the canonical domain:

```sh
POSTHOG_BROWSER_BASE_URL=https://codeswhat.com npm run test:posthog:browser
```

`npm run og` regenerates the share cards in `public/og*` with playwright-core
and the locally installed Google Chrome; it isn't part of the build.

## Rendering and security headers

The Next proxy sets a fresh script nonce on both the forwarded request policy
and the response policy. Next uses that nonce for generated inline scripts;
the root layout applies it to the theme-init script. HTML renders per request
so nonce values are not reused through static prerendering. Static JS/assets
retain the caching rules in `vercel.json`.

Keep the CSP's allowed third-party origins narrow. A fixed hash for only the
theme script does not permit Next's inline Flight scripts and breaks hydration.
The production browser regression verifies actual interaction and blocked
unapproved scripts. The remaining response headers and API cache rules live
in `vercel.json`.

## Environment Variables

Add these in your Vercel dashboard under Settings → Environment Variables:

### Site and newsletter configuration

The site metadata variables are optional overrides for the defaults in
`lib/site-config.ts`. EmailOctopus credentials are required for newsletter
delivery and stay server-side.

| Variable                       | Description              | Example                          |
| ------------------------------ | ------------------------ | -------------------------------- |
| `NEXT_PUBLIC_SITE_NAME`        | Your site name           | `CodesWhat?`                     |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | Site description for SEO | `Modern software consultancy...` |
| `NEXT_PUBLIC_SITE_URL`         | Your production URL      | `https://codeswhat.com`          |
| `EMAILOCTOPUS_API_KEY`         | EmailOctopus API key     | `abc123...`                      |
| `EMAILOCTOPUS_LIST_ID`         | EmailOctopus list ID     | `123e4567-e89b...`               |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Turnstile widget site key (public, read at build time) | `0x4AAAA...` |
| `TURNSTILE_SECRET_KEY`         | Turnstile widget secret key (server-side only) | `0x4AAAA...` |

### Turnstile

`/api/subscribe` requires a Cloudflare Turnstile response and verifies it with
Cloudflare before anything reaches EmailOctopus. Without `TURNSTILE_SECRET_KEY`
the route returns 503 and no signup goes through, so the secret must be set in
every environment that should accept signups. `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
is inlined at build time: set it first, then redeploy so the build picks it up.

The widget's hostname list must include `codeswhat.com` and `www.codeswhat.com`.
Production also checks the hostname Cloudflare reports against those two (plus
the host of `NEXT_PUBLIC_SITE_URL`); other environments skip that check. For
Preview, either add the preview hostnames to the widget or use Cloudflare's
test pair (site key `1x00000000000000000000AA`, secret
`1x0000000000000000000000000000000AA`) in the Preview environment, which passes
only the dummy response the test site key issues. The script loads when a
visitor first touches the signup form, not on page load.

### Optional Variables

PostHog is configured with three Production-only variables. Leave all three
unset in Preview and Development so those deployments emit no analytics:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | The public token for `CodesWhat Public Websites` |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://e.codeswhat.com` |
| `NEXT_PUBLIC_POSTHOG_UI_HOST` | `https://us.posthog.com` |

### Support page

`/support` reads `CODESWHAT_SUPPORT_LINKS`, a server-side JSON object mapping tier
id to a Stripe Payment Link. The six ids are `monthly-5`, `monthly-10`,
`monthly-25`, `monthly-100`, `once-10` and `once-50`:

```
CODESWHAT_SUPPORT_LINKS={"monthly-5":"https://buy.stripe.com/...","monthly-10":"https://buy.stripe.com/...","monthly-25":"https://buy.stripe.com/...","monthly-100":"https://buy.stripe.com/...","once-10":"https://buy.stripe.com/...","once-50":"https://buy.stripe.com/..."}
```

Only `https://buy.stripe.com/...` and `https://donate.stripe.com/...` links with a
path and no credentials are accepted. Unknown ids and invalid links are dropped
with a server warning, and any tier without a link renders as "Opening soon".
The page is rendered per request, so changing the variable needs a redeploy but
no rebuild of page code. Costs marked PLACEHOLDER in `lib/support.ts` are for the
maintainer to fill in.

## Domain Configuration

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your domain: `codeswhat.com`
4. Follow the DNS configuration instructions

## Build Settings

The `vercel.json` file includes:

- Additional security headers
- API route configuration
- Function timeouts
- Static-asset caching rules

## Features Configured

- **Security Headers**: XSS protection, frame options, content type sniffing prevention
- **API Caching**: Disabled for `/api/*` routes
- **Function Duration**: 10 seconds max for email signup
- **Sitemap**: Next's sitemap route supplies the public page list

## Monitoring

1. Review the shared PostHog project for pageviews, approved GitHub CTA events, and web vitals.
2. Set up alerts for function errors.

## Troubleshooting

### Environment Variables Not Working

- Ensure variables are added to the correct environment (Production/Preview/Development)
- Redeploy after adding variables
- Check for typos in variable names

### Build Failures

- Check build logs in Vercel dashboard
- Ensure Node.js version matches locally (24.x)
- Verify all dependencies are in package.json

### Email Signup Not Working

- New contacts are created as `pending` (double opt-in). Double opt-in must be
  enabled on the EmailOctopus list so the confirmation email goes out;
  otherwise signups sit in Pending.
- `/api/subscribe` rejects requests marked `Sec-Fetch-Site: cross-site` or
  carrying a foreign `Origin` (403), and anything that isn't
  `application/json` (415). Requests with neither header, such as curl, are
  still accepted. The in-memory rate limit is per instance only.
- Verify EmailOctopus credentials
- A 503 from `/api/subscribe` means `TURNSTILE_SECRET_KEY` is missing or Cloudflare
  siteverify couldn't be reached; a 403 means the verification was rejected
- Check function logs in Vercel dashboard
- Ensure API routes are correctly configured
