import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const root = new URL("..", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("PostHog is initialized only by instrumentation-client", async () => {
  const instrumentation = await read("instrumentation-client.ts");
  const layout = await read("app/layout.tsx");
  assert.match(instrumentation, /posthog\.init\(/);
  assert.doesNotMatch(layout, /@vercel\/(analytics|speed-insights)/);
  assert.doesNotMatch(layout, /posthog\.init\(/);
});

test("telemetry dependencies use the audited exact PostHog version", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  assert.equal(packageJson.dependencies["posthog-js"], "1.417.0");
  assert.equal(packageJson.dependencies["@vercel/analytics"], undefined);
  assert.equal(packageJson.dependencies["@vercel/speed-insights"], undefined);
});

test("privacy posture disables persistence, recording, autocapture, and automatic pageviews", async () => {
  const instrumentation = await read("instrumentation-client.ts");
  for (const option of [
    "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN",
    "NEXT_PUBLIC_POSTHOG_HOST",
    "NEXT_PUBLIC_POSTHOG_UI_HOST",
    'capture_pageview: false',
    'autocapture: false',
    'disable_session_recording: true',
    'persistence: "memory"',
    'cookieless_mode: "always"',
    "advanced_disable_flags: true",
    "disable_persistence: true",
    "capture_performance:",
  ]) {
    assert.match(instrumentation, new RegExp(option.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")));
  }
  assert.match(instrumentation, /before_send:/);
});

test("CSP allows only the exact PostHog proxy and hashes the theme script", async () => {
  const config = await read("next.config.ts");
  assert.ok(config.includes('"https://e.codeswhat.com"'));
  assert.doesNotMatch(config, /https:\/\/(app|us)\.posthog\.com/);
  assert.match(config, /sha256-/);
});

test("repo-owned CI runs the website contracts and production build", async () => {
  const workflow = await read("../.github/workflows/website.yml");
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm run lint/);
  assert.match(workflow, /npm run type-check/);
  assert.match(workflow, /npm run test:scene/);
  assert.match(workflow, /npm run test:posthog/);
  assert.match(workflow, /npm run build/);
});

test("public documentation does not advertise the retired provider badge", async () => {
  const roadmap = await read("../ROADMAP.md");
  const retiredBadgeText = ["Go", "Report", "Card"].join("\\s+");
  assert.doesNotMatch(roadmap, new RegExp(retiredBadgeText, "i"));
});
