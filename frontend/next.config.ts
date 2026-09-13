import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
