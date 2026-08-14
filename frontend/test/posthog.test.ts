import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ALLOWED_CTA_IDS,
  ALLOWED_ROUTES,
  getPostHogConfig,
  sanitizeEvent,
  sanitizeRoute,
} from "../lib/posthog-privacy.ts";

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
        token: "secret",
      },
    }),
    {
      event: "$pageview",
      properties: {
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
      properties: { path: "/", cta_id: "github_org", placement: "hero", token: "secret" },
    }),
    {
      event: "cta activated",
      properties: {
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
        path: "/?private=1",
        metric_name: "LCP",
        value: 123.4,
        rating: "good",
        $current_url: "https://codeswhat.com/?private=1",
      },
    }),
    {
      event: "$web_vitals",
      properties: {
        schema_version: 1,
        site: "codeswhat",
        surface: "marketing",
        path: "/",
        $web_vitals_LCP_value: 123.4,
      },
    },
  );
});

test("unknown events fail closed", () => {
  assert.equal(sanitizeEvent({ event: "$identify", properties: {} }), null);
});
