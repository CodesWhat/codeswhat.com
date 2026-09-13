# Vercel Deployment Guide

## Production deployment

The existing Vercel project deploys `CodesWhat/codeswhat.com` from `main`, with
`frontend/` as its root directory and Node.js 24. Feature changes merge into
`dev`, then a reviewed promotion advances `main`. Git integration is working;
a local CLI deployment is not the routine production path.

After promotion, confirm the production deployment references the intended
commit. Open the canonical domain and verify the theme toggle changes theme
and the client scene mounts. Build success and analytics events alone do not
establish that client initialization worked.

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

### Optional Variables

PostHog is configured with three Production-only variables. Leave all three
unset in Preview and Development so those deployments emit no analytics:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | The public token for `CodesWhat Public Websites` |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://e.codeswhat.com` |
| `NEXT_PUBLIC_POSTHOG_UI_HOST` | `https://us.posthog.com` |

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

- Verify EmailOctopus credentials
- Check function logs in Vercel dashboard
- Ensure API routes are correctly configured
