import assert from "node:assert/strict";
import { test } from "node:test";
import fc from "fast-check";
import { ALLOWED_ROUTES, sanitizeEvent, sanitizeRoute } from "../lib/posthog-privacy.ts";

// Property tests for the analytics privacy envelope. sanitizeEvent receives
// whatever the browser SDK (or a tampered client) hands it, so these generate
// hostile input and check the invariants that must hold for every event.

const EVENTS = [
  "$pageview",
  "$pageleave",
  "cta activated",
  "$web_vitals",
  "newsletter submitted",
  "client error",
];
const OUTPUT_KEYS = new Set([
  "token",
  "$cookieless_mode",
  "$process_person_profile",
  "schema_version",
  "site",
  "surface",
  "path",
  "$raw_user_agent",
  "$host",
  "distinct_id",
  "$referring_domain",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "$current_url",
  "$pathname",
  "cta_id",
  "placement",
  "result",
  "error_class",
  "error_kind",
  "error_name",
  "$web_vitals_CLS_value",
  "$web_vitals_FCP_value",
  "$web_vitals_INP_value",
  "$web_vitals_LCP_value",
]);
const SECRET = "leak-canary@example.com";
const ROUTES = new Set<string>([...ALLOWED_ROUTES, "/_other"]);

const anything = fc.anything({ withNullPrototype: true, withBigInt: true });
const looseValue = fc.oneof(anything, fc.string(), fc.constant(SECRET), fc.double());
const base = {
  token: "phc_property_fixture",
  $cookieless_mode: true,
  $process_person_profile: false,
  $raw_user_agent: "Mozilla/5.0 (Property Fixture)",
  $host: "codeswhat.com",
};
// Extra properties are arbitrary, but never override the envelope fields that
// make an event valid, so most generated events reach the branch under test.
const properties = fc
  .dictionary(fc.oneof(fc.string(), fc.constantFrom(...OUTPUT_KEYS)), looseValue)
  .map((extra) => ({ ...extra, ...base }));
const event = fc.record({
  event: fc.oneof(fc.constantFrom(...EVENTS), fc.string(), anything),
  properties: fc.oneof(properties, anything),
  timestamp: fc.oneof(fc.date({ noInvalidDate: false }), anything),
  uuid: anything,
});

test("sanitizeEvent never throws and only emits allowlisted keys with primitive values", () => {
  fc.assert(
    fc.property(fc.oneof(event, anything), (input) => {
      const result = sanitizeEvent(input);
      if (result === null) return;
      assert.ok(EVENTS.includes(result.event));
      for (const [key, value] of Object.entries(result.properties)) {
        assert.ok(OUTPUT_KEYS.has(key), `unexpected key ${key}`);
        assert.ok(
          ["boolean", "number", "string"].includes(typeof value),
          `${key} is not primitive`,
        );
      }
      assert.ok(ROUTES.has(String(result.properties.path)));
    }),
    { numRuns: 500 },
  );
});

test("sanitizeEvent never forwards attacker-controlled free text", () => {
  fc.assert(
    fc.property(event, (input) => {
      const result = sanitizeEvent(input);
      if (result === null) return;
      assert.ok(!JSON.stringify(result.properties).includes(SECRET));
    }),
    { numRuns: 500 },
  );
});

test("sanitizeRoute only ever returns an allowed route or /_other", () => {
  fc.assert(
    fc.property(fc.oneof(fc.string(), fc.webUrl(), anything), (input) => {
      assert.ok(ROUTES.has(sanitizeRoute(input)));
    }),
    { numRuns: 1000 },
  );
});
