import path from "node:path";
import type { NextConfig } from "next";

const posthogProxy = "https://e.codeswhat.com";
// Turnstile loads its script and renders its challenge in an iframe from here.
const turnstileOrigin = "https://challenges.cloudflare.com";

const isDevelopment = process.env.NODE_ENV === "development";

// Production hashes its inline scripts. Next writes per-build inline bootstrap and Flight
// scripts into every prerendered page, so the hashes aren't known until the build ends.
// csp-adapter.mjs swaps them in for this placeholder once the HTML exists, and fails the
// build if it can't.
const scriptSrc = isDevelopment
  ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${posthogProxy} ${turnstileOrigin}`
  : `script-src 'self' __CSP_INLINE_SCRIPT_HASHES__ ${posthogProxy} ${turnstileOrigin}`;

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
].join("; ");

const nextConfig: NextConfig = {
  // Wraps Vercel's adapter (found through NEXT_ADAPTER_PATH) so the hashes land in the
  // headers before Vercel reads them. Dev has no placeholder to fill.
  adapterPath: isDevelopment ? undefined : path.join(process.cwd(), "csp-adapter.mjs"),
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
