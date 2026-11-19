// Production build with the fixtures the browser tests read at build time. CI calls this
// too, so a local `npm run build:test && npm run test:browser` matches CI.
import { spawnSync } from "node:child_process";

const result = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  env: {
    ...process.env,
    // Cloudflare's published always-pass test site key; the browser checks need the widget
    // compiled in. Real keys live only in Vercel.
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
    // /support is prerendered, so its links are baked in at build time. monthly-10 is an
    // insecure link the page must drop.
    CODESWHAT_SUPPORT_LINKS: JSON.stringify({
      "monthly-5": "https://buy.stripe.com/test_monthly5",
      "once-50": "https://buy.stripe.com/test_once50",
      "monthly-10": "http://insecure.example/not-allowed",
    }),
  },
});
process.exit(result.status ?? 1);
