import { randomBytes } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";

const posthogProxy = "https://e.codeswhat.com";

export function proxy(request: NextRequest) {
  const nonce = randomBytes(16).toString("base64");
  const developmentScriptPolicy = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
  const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' ${posthogProxy}${developmentScriptPolicy}`,
    "style-src 'self' 'unsafe-inline'",
    `connect-src 'self' ${posthogProxy}`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  // Next reads the request policy while rendering its inline Flight scripts.
  // Replace caller headers so only this request's generated nonce is trusted.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  return response;
}

export const config = {
  matcher: [
    "/((?!api/|_next/|favicon\\.ico$|robots\\.txt$|sitemap\\.xml$|.*\\.(?:png|svg|webp|ico|woff2?)$).*)",
  ],
};
