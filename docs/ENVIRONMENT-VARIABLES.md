# Environment Variables

The variable reference lives in [frontend/README-VERCEL.md](../frontend/README-VERCEL.md#environment-variables).

- Newsletter signup needs `EMAILOCTOPUS_API_KEY`, `EMAILOCTOPUS_LIST_ID`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`.
- `CODESWHAT_SUPPORT_LINKS` is optional.
- The public Turnstile site key and the support links are read at build time, so changing them needs a rebuild.
- PostHog values belong in Production only.
- Local secrets go in the ignored `frontend/.env.local`.
