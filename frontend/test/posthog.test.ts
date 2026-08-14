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
      },
    },
  );
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
    },
  });
});
