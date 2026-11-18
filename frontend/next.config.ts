import type { NextConfig } from "next";

const posthogProxy = "https://e.codeswhat.com";
// Turnstile loads its script and renders its challenge in an iframe from here.
const turnstileOrigin = "https://challenges.cloudflare.com";

// Replaced after `next build` by scripts/csp-hashes.mjs, which hashes the inline
// scripts Next writes into the prerendered HTML. Next has no stable hook for that.
const CSP_HASH_PLACEHOLDER = "__CSP_INLINE_SCRIPT_HASHES__";

const isDevelopment = process.env.NODE_ENV === "development";

const scriptSrc = isDevelopment
  ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${posthogProxy} ${turnstileOrigin}`
  : `script-src 'self' ${CSP_HASH_PLACEHOLDER} ${posthogProxy} ${turnstileOrigin}`;

const contentSecurityPolicy = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  `connect-src 'self' ${posthogProxy}`,
  `frame-src ${turnstileOrigin}`,
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Legacy auditor off, per current OWASP guidance; the CSP does the work.
          { key: "X-XSS-Protection", value: "0" },
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // The stable production *.vercel.app aliases serve the full site; send
      // them to the canonical domain. Hash-suffixed preview URLs don't match.
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value:
              "(codeswhat-website|codeswhat-website-codeswhat|codeswhat-website-git-main-codeswhat)\\.vercel\\.app",
          },
        ],
        destination: "https://codeswhat.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
