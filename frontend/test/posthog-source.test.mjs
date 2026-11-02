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
  assert.equal(packageJson.dependencies["posthog-js"], "1.438.15");
  assert.equal(packageJson.dependencies["@vercel/analytics"], undefined);
  assert.equal(packageJson.dependencies["@vercel/speed-insights"], undefined);
});

test("privacy posture disables persistence, recording, autocapture, and automatic pageviews", async () => {
  const instrumentation = await read("instrumentation-client.ts");
  for (const option of [
    "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN",
    "NEXT_PUBLIC_POSTHOG_HOST",
    "NEXT_PUBLIC_POSTHOG_UI_HOST",
    "capture_pageview: false",
    "capture_pageleave: true",
    "autocapture: false",
    "disable_session_recording: true",
    'persistence: "memory"',
    'cookieless_mode: "always"',
    "advanced_disable_flags: true",
    "disable_persistence: true",
    "save_referrer: true",
    "save_campaign_params: true",
    "mask_personal_data_properties: true",
    "capture_exceptions: false",
    "capture_performance:",
  ]) {
    assert.match(instrumentation, new RegExp(option.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")));
  }
  assert.match(instrumentation, /before_send:/);
});

test("CSP allows only the exact PostHog proxy", async () => {
  const proxy = await read("proxy.ts");
  assert.ok(proxy.includes('"https://e.codeswhat.com"'));
  assert.doesNotMatch(proxy, /https:\/\/(app|us)\.posthog\.com/);
});

test("CSP admits only Turnstile's origin for its script and challenge frame", async () => {
  const proxy = await read("proxy.ts");
  assert.ok(proxy.includes('"https://challenges.cloudflare.com"'));
  assert.match(proxy, /frame-src \$\{turnstileOrigin\}/);
  assert.doesNotMatch(proxy, /\*\.cloudflare\.com/);
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

test("the cookieless envelope keeps the fields PostHog's server hash requires", async () => {
  const privacy = await read("lib/posthog-privacy.ts");

  // PostHog's cookieless server-hash ingestion step reads $raw_user_agent and
  // $host straight off event.properties and drops the event — with a
  // cookieless_missing_user_agent / cookieless_missing_host ingestion warning
  // and zero rows ingested — if either is absent (PostHog/posthog
  // nodejs/src/ingestion/common/cookieless/cookieless-manager.ts,
  // getProperties()/doBatchInner()). posthog-js attaches both by default;
  // createCommonProperties must allowlist them through, not silently strip
  // them. Regression guard: if these keys ever disappear from the allowlist
  // (or the comment explaining why they're there), every cookieless event on
  // codeswhat.com drops with no PostHog-side error beyond the ingestion
  // warning.
  assert.match(privacy, /\$raw_user_agent/u);
  assert.match(privacy, /\$host/u);
  assert.match(privacy, /cookieless_missing_user_agent|cookieless server-hash/u);
});

test("every project has an allowlisted project_<slug> CTA id and a tracked link", async () => {
  const { PROJECT_SLUGS } = await import("../lib/project-slugs.ts");
  const { PROJECTS } = await import("../lib/site-config.ts");
  const { SPECIMENS } = await import("../lib/specimens.ts");
  const { ALLOWED_CTA_IDS, ALLOWED_ROUTES } = await import("../lib/posthog-privacy.ts");
  assert.deepEqual(
    SPECIMENS.map((specimen) => specimen.slug),
    [...PROJECT_SLUGS],
    "specimens and the analytics slug list must stay in step",
  );
  for (const project of PROJECTS) {
    assert.ok(PROJECT_SLUGS.includes(project.slug), `${project.slug} is not in PROJECT_SLUGS`);
  }
  for (const slug of PROJECT_SLUGS) {
    assert.ok(ALLOWED_CTA_IDS.includes(`project_${slug}`), `project_${slug} is not allowlisted`);
    assert.ok(ALLOWED_ROUTES.includes(`/projects/${slug}`), `/projects/${slug} is not a route`);
  }
  for (const file of ["app/(site)/page.tsx", "app/(site)/projects/[slug]/page.tsx"]) {
    const source = await read(file);
    assert.match(source, /<TrackedCtaLink[^>]*ctaId=\{`project_\$\{[\w.]+\}`\}/u, file);
    assert.match(source, /placement="projects"/u, file);
  }
});

test("client error reporting sends no message, stack, filename or URL", async () => {
  const instrumentation = await read("instrumentation-client.ts");
  assert.match(instrumentation, /addEventListener\("error"/u);
  assert.match(instrumentation, /addEventListener\("unhandledrejection"/u);
  const call = instrumentation.match(/posthog\.capture\("client error", \{[^}]*\}\)/u)?.[0] ?? "";
  assert.match(call, /error_kind/u);
  assert.match(call, /error_name/u);
  assert.doesNotMatch(call, /message|stack|filename|href|url/iu);
});

test("newsletter submissions report a fixed result and error class only", async () => {
  const form = await read("components/catalogue/EmailSignupForm.tsx");
  const calls = [...form.matchAll(/posthog\.capture\("newsletter submitted", \{[^}]*\}\)/gu)];
  assert.equal(calls.length, 3);
  for (const [call] of calls) assert.doesNotMatch(call, /email|message|data\./iu);
});
