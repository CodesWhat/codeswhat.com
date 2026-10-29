import { buildSecurityTxt } from "@/lib/security-txt";

export const revalidate = 86400;

// ISR: regenerated at most daily, so Expires stays ~180 days ahead without
// per-request rendering and never goes stale between deploys.
export function GET() {
  return new Response(buildSecurityTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
