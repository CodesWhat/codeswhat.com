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
  assert.doesNotMatch(body, /query-secret=should-not-leave/);
  assert.match(body, /<script id="theme-init">/);
});
