import { buildSecurityTxt } from "@/lib/security-txt";

export const dynamic = "force-static";

// Static, so Expires is build date + 180 days. Every deploy refreshes it.
export function GET() {
  return new Response(buildSecurityTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
