import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import {
  ALLOWED_CTA_IDS,
  ALLOWED_ROUTES,
  getPostHogConfig,
  sanitizeEvent,
  sanitizeRoute,
} from "../lib/posthog-privacy.ts";

const require = createRequire(import.meta.url);
const { PostHog } = require("../node_modules/posthog-js/lib/src/posthog-core.js") as {
  PostHog: new () => {
    config: { before_send?: (input: unknown) => unknown };
    _runBeforeSend: (input: unknown) => unknown;
  };
};

// posthog-js attaches these to every envelope by default (PostHog/posthog-js
// packages/browser-common/src/utils/event-utils.ts, getEventProperties()).
// sanitizeEvent must forward them: PostHog's cookieless server-hash
// ingestion step reads them straight off event.properties and drops the
// event with a cookieless_missing_user_agent / cookieless_missing_host
// ingestion warning if either is absent (PostHog/posthog
// nodejs/src/ingestion/common/cookieless/cookieless-manager.ts,
// getProperties() + doBatchInner()).
const COOKIELESS_HASH_PROPERTIES = {
  $raw_user_agent: "Mozilla/5.0 (Test Runner)",
  $host: "codeswhat.com",
};

test("route sanitization only returns the finite public route manifest", () => {
  assert.deepEqual(ALLOWED_ROUTES, ["/"]);
  assert.equal(sanitizeRoute("/?utm_source=secret#private"), "/");
  assert.equal(sanitizeRoute("/"), "/");
  assert.equal(sanitizeRoute("/not-a-route?token=secret"), "/_other");
  assert.equal(sanitizeRoute("https://codeswhat.com/?secret=1"), "/_other");
  assert.equal(
    getPostHogConfig({
      NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: "phc_public-token_123",
      NEXT_PUBLIC_POSTHOG_HOST: "https://e.codeswhat.com",
      NEXT_PUBLIC_POSTHOG_UI_HOST: "https://us.posthog.com",
    })?.apiHost,
    "https://e.codeswhat.com",
  );
  assert.equal(getPostHogConfig({ NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: "phc_partial" }), null);
});

test("pageview events keep only the sanitized pathname", () => {
  assert.deepEqual(
    sanitizeEvent({
      event: "$pageview",
      properties: {
        path: "/?secret=1#fragment",
        $current_url: "https://codeswhat.com/?secret=1#fragment",
        token: "phc_public-token_123",
        distinct_id: "$posthog_cookieless",
        $cookieless_mode: true,
        $process_person_profile: false,
        ...COOKIELESS_HASH_PROPERTIES,
      },
    }),
    {
      event: "$pageview",
      properties: {
        token: "phc_public-token_123",
        distinct_id: "$posthog_cookieless",
        $cookieless_mode: true,
        $process_person_profile: false,
        schema_version: 1,
        site: "codeswhat",
        surface: "marketing",
        path: "/",
        $current_url: "https://codeswhat.com/",
        $pathname: "/",
        ...COOKIELESS_HASH_PROPERTIES,
      },
    },
  );
});

test("pageleave events mirror the pageview contract", () => {
  // posthog-js emits $pageleave itself once capture_pageleave is true, so it
  // reaches sanitizeEvent carrying PostHog's own automatic properties
  // ($pathname among them) rather than the hand-built "path" property that
  // capturePageview() passes for $pageview. sanitizeEvent has to rebuild it
  // from the same allowlist; before that branch existed it fell through to
  // the closing `return null` and every $pageleave was dropped silently,
  // which is why flipping capture_pageleave on its own fixes nothing.
  assert.deepEqual(
    sanitizeEvent({
      event: "$pageleave",
      properties: {
        $pathname: "/?secret=1#fragment",
        $current_url: "https://codeswhat.com/?secret=1#fragment",
        token: "phc_public-token_123",
        distinct_id: "$posthog_cookieless",
        $cookieless_mode: true,
        $process_person_profile: false,
        ...COOKIELESS_HASH_PROPERTIES,
      },
    }),
    {
      event: "$pageleave",
      properties: {
        token: "phc_public-token_123",
        distinct_id: "$posthog_cookieless",
        $cookieless_mode: true,
        $process_person_profile: false,
        schema_version: 1,
        site: "codeswhat",
        surface: "marketing",
        path: "/",
        $current_url: "https://codeswhat.com/",
        $pathname: "/",
        ...COOKIELESS_HASH_PROPERTIES,
      },
    },
  );
});

test("$pageleave requires and forwards the cookieless server-hash fields, same as $pageview", () => {
  const validProperties = {
    $pathname: "/",
    token: "phc_public-token_123",
    $cookieless_mode: true,
    $process_person_profile: false,
    ...COOKIELESS_HASH_PROPERTIES,
  };

  const result = sanitizeEvent({ event: "$pageleave", properties: validProperties });
  assert.ok(result);
  assert.equal(result.properties.$raw_user_agent, COOKIELESS_HASH_PROPERTIES.$raw_user_agent);
  assert.equal(result.properties.$host, COOKIELESS_HASH_PROPERTIES.$host);

  for (const missingKey of Object.keys(COOKIELESS_HASH_PROPERTIES)) {
    const withoutField = { ...validProperties };
    delete withoutField[missingKey as keyof typeof withoutField];
    assert.equal(
      sanitizeEvent({ event: "$pageleave", properties: withoutField }),
      null,
      `sanitizeEvent must drop $pageleave events missing ${missingKey}`,
    );
  }
});

test("$pathname never diverges from the allowlisted path", () => {
  // $pathname exists so PostHog's Web analytics Page / Entry page / Exit
  // page tables resolve at all; those tables read $pathname and nothing
  // else. It must stay bound to the sanitized `path`: if it ever carried the
  // raw pathname instead, every unlisted route would leak into the
  // analytics project past ALLOWED_ROUTES.
  for (const rawPath of ["/", "/about", "/pricing?secret=1#fragment", "//evil.example/"]) {
    for (const event of ["$pageview", "$pageleave"] as const) {
      const result = sanitizeEvent({
        event,
        properties: {
          path: rawPath,
          token: "phc_public-token_123",
          $cookieless_mode: true,
          $process_person_profile: false,
          ...COOKIELESS_HASH_PROPERTIES,
        },
      });
      assert.ok(result, `sanitizeEvent should accept ${event} for ${rawPath}`);
      assert.equal(result.properties.$pathname, result.properties.path);
      assert.equal(
        String(result.properties.$pathname).includes("secret"),
        false,
        `unlisted route leaked into $pathname for ${rawPath}`,
      );
    }
  }
});

test("CTA events are limited to the initial GitHub placements", () => {
  assert.deepEqual(ALLOWED_CTA_IDS, ["github_org"]);
  assert.deepEqual(
    sanitizeEvent({
      event: "cta activated",
      properties: {
        token: "phc_public-token_123",
        $cookieless_mode: true,
        $process_person_profile: false,
        path: "/",
        cta_id: "github_org",
        placement: "hero",
        ...COOKIELESS_HASH_PROPERTIES,
      },
    }),
    {
      event: "cta activated",
      properties: {
        token: "phc_public-token_123",
        $cookieless_mode: true,
        $process_person_profile: false,
        schema_version: 1,
        site: "codeswhat",
        surface: "marketing",
        path: "/",
        cta_id: "github_org",
        placement: "hero",
        ...COOKIELESS_HASH_PROPERTIES,
      },
    },
  );
  assert.equal(
    sanitizeEvent({
      event: "cta activated",
      properties: { cta_id: "email_signup", placement: "hero" },
    }),
    null,
  );
});

test("web vitals events keep only metric data", () => {
  assert.deepEqual(
    sanitizeEvent({
      event: "$web_vitals",
      properties: {
        token: "phc_public-token_123",
        $cookieless_mode: true,
        $process_person_profile: false,
        path: "/?private=1",
        $web_vitals_LCP_value: 123.4,
        $web_vitals_CLS_value: -1,
        $web_vitals_LCP_event: { attribution: "private" },
        rating: "good",
        $current_url: "https://codeswhat.com/?private=1",
        ...COOKIELESS_HASH_PROPERTIES,
      },
    }),
    {
      event: "$web_vitals",
      properties: {
        token: "phc_public-token_123",
        $cookieless_mode: true,
        $process_person_profile: false,
        schema_version: 1,
        site: "codeswhat",
        surface: "marketing",
        path: "/",
        $web_vitals_LCP_value: 123.4,
        ...COOKIELESS_HASH_PROPERTIES,
      },
    },
  );
  assert.equal(
    sanitizeEvent({
      event: "$web_vitals",
      properties: {
        token: "phc_public-token_123",
        $cookieless_mode: true,
        $process_person_profile: false,
        path: "/",
        metric_name: "LCP",
        value: 123.4,
      },
    }),
    null,
  );
});

test("unknown events fail closed", () => {
  assert.equal(sanitizeEvent({ event: "$identify", properties: {} }), null);
});

test("the pinned PostHog before_send pipeline keeps the required cookieless envelope", () => {
  const timestamp = new Date("2026-08-14T12:00:00.000Z");
  const input = {
    uuid: "0189f47a-2f44-7dcb-bf7b-3bf1b8bd5d61",
    timestamp,
    event: "$pageview",
    properties: {
      token: "phc_public-token_123",
      distinct_id: "$posthog_cookieless",
      $cookieless_mode: true,
      $process_person_profile: false,
      path: "/?secret=1#fragment",
      $set: { email: "private@example.com" },
      $set_once: { referrer: "private" },
      ...COOKIELESS_HASH_PROPERTIES,
    },
    $set: { email: "private@example.com" },
    $set_once: { referrer: "private" },
  };

  const client = new PostHog();
  client.config.before_send = sanitizeEvent;

  assert.deepEqual(client._runBeforeSend(input), {
    uuid: input.uuid,
    timestamp,
    event: "$pageview",
    properties: {
      token: "phc_public-token_123",
      distinct_id: "$posthog_cookieless",
      $cookieless_mode: true,
      $process_person_profile: false,
      schema_version: 1,
      site: "codeswhat",
      surface: "marketing",
      path: "/",
      $current_url: "https://codeswhat.com/",
      $pathname: "/",
      ...COOKIELESS_HASH_PROPERTIES,
    },
  });
});

test("sanitizeEvent requires and forwards the cookieless server-hash fields", () => {
  const validProperties = {
    token: "phc_public-token_123",
    distinct_id: "$posthog_cookieless",
    $cookieless_mode: true,
    $process_person_profile: false,
    path: "/",
    ...COOKIELESS_HASH_PROPERTIES,
  };

  const result = sanitizeEvent({ event: "$pageview", properties: validProperties });
  assert.ok(result);
  assert.equal(result.properties.$raw_user_agent, COOKIELESS_HASH_PROPERTIES.$raw_user_agent);
  assert.equal(result.properties.$host, COOKIELESS_HASH_PROPERTIES.$host);
  assert.equal(result.properties.$ip, undefined);

  // Regression guard: if sanitizeEvent ever goes back to rebuilding
  // properties from an allowlist that forgets these two keys, cookieless
  // ingestion drops every event again with zero warning-free indication
  // beyond cookieless_missing_user_agent / cookieless_missing_host.
  for (const missingKey of Object.keys(COOKIELESS_HASH_PROPERTIES)) {
    const withoutField = { ...validProperties };
    delete withoutField[missingKey as keyof typeof withoutField];
    assert.equal(
      sanitizeEvent({ event: "$pageview", properties: withoutField }),
      null,
      `sanitizeEvent must drop events missing ${missingKey}`,
    );
  }
});
