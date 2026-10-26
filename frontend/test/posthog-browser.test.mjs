import assert from "node:assert/strict";
import { test } from "node:test";

const baseUrl = process.env.POSTHOG_BROWSER_BASE_URL;

test("production browser response keeps PostHog on the exact proxy", {
  skip: !baseUrl,
}, async () => {
  const response = await fetch(`${baseUrl}/?query-secret=should-not-leave`);
  const body = await response.text();
  const csp = response.headers.get("content-security-policy") ?? "";

  assert.equal(response.status, 200);
  assert.match(csp, /script-src[^;]*https:\/\/e\.codeswhat\.com/);
  assert.match(csp, /connect-src[^;]*https:\/\/e\.codeswhat\.com/);
  assert.doesNotMatch(csp, /\*\.posthog\.com|https:\/\/(app|us)\.posthog\.com/);
  assert.match(
    response.headers.get("cache-control") ?? "",
    /\b(private|no-store)\b/,
    "HTML reflects request data (Next.js flight payload), which is only safe if the page isn't shared-cached",
  );
  // Next.js inlines router state, including the request's own query, in
  // self.__next_f scripts. Everything else must not reflect the query.
  const withoutFlightData = body.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/g, (block, inner) =>
    inner.includes("self.__next_f") ? "" : block,
  );
  assert.doesNotMatch(withoutFlightData, /query-secret/);
  assert.match(body, /<script\b[^>]*\bid="theme-init"/);
});
