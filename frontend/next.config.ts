import { createHash } from "node:crypto";
import type { NextConfig } from "next";
import { THEME_INIT_SCRIPT } from "./lib/theme-init-script";

const posthogProxy = "https://e.codeswhat.com";
const themeScriptHash = `sha256-${createHash("sha256").update(THEME_INIT_SCRIPT).digest("base64")}`;

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' '${themeScriptHash}' ${posthogProxy}`,
              "style-src 'self' 'unsafe-inline'",
              `connect-src 'self' ${posthogProxy}`,
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
