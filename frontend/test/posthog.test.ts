import assert from "node:assert/strict";

test("referring hostnames survive the envelope without URLs or campaign data", () => {
  const accepted = ["github.com", "news.ycombinator.com", "$direct", "SEARCH.Example"];
  const rejected = [
    undefined,
    null,
    42,
    "",
    "https://search.example/private?email=me@example.com",
    "//search.example",
    "search.example/path",
    "search.example?x=1",
    "me@example.com",
    "search.example:443",
    "search.example\n",
    "-bad.example",
    "bad-.example",
    `${"a".repeat(64)}.example`,
  ];
  for (const event of ["$pageview", "$pageleave", "$web_vitals"]) {
    for (const value of [...accepted, ...rejected]) {
      const result = sanitizeEvent({
        event,
        properties: {
          token: "phc_referrer_fixture",
          $cookieless_mode: true,
          $process_person_profile: false,
          $raw_user_agent: "Mozilla/5.0 (Referrer Fixture)",
          $host: "codeswhat.com",
          path: "/",
          $web_vitals_LCP_value: 100,
          $referring_domain: value,
          $referrer: "https://search.example/private?email=me@example.com",
          utm_source: "me@example.com",
        },
      });
      assert.ok(result);
      assert.equal(
        result.properties.$referring_domain,
        accepted.includes(value as string) ? (value as string).toLowerCase() : undefined,
        `${event}: ${JSON.stringify(value)}`,
      );
      assert.equal("$referrer" in result.properties, false);
      assert.equal("utm_source" in result.properties, false);
    }
  }
});

import { createRequire } from "node:module";
import { test } from "node:test";
import {
  ALLOWED_CTA_IDS,
  ALLOWED_ROUTES,
  classifyClientErrorName,
  getPostHogConfig,
  sanitizeEvent,
  sanitizeRoute,
} from "../lib/posthog-privacy.ts";

const require = createRequire(import.meta.url);
// Deep import on purpose: the published main bundle minifies `_runBeforeSend`
// away, while lib/* is a published file in posthog-js's package.json `files`
// with no exports map.
const { PostHog } = require("posthog-js/lib/src/posthog-core.js") as {
  PostHog: new () => {
    config: { before_send?: (input: unknown) => unknown };
    _runBeforeSend: (input: unknown) => unknown;
  };
};
assert.equal(
  typeof new PostHog()._runBeforeSend,
  "function",
  "posthog-js/lib/src/posthog-core.js no longer exposes PostHog#_runBeforeSend; the before_send pipeline contracts below need updating for this posthog-js version",
);

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
  assert.deepEqual(ALLOWED_ROUTES, [
    "/",
    "/support",
    "/projects/sockguard",
    "/projects/drydock",
    "/projects/portwing",
    "/projects/portkey-admin-mcp",
    "/projects/mouthtype",
    "/projects/idlescreen",
    "/projects/careerrat",
    "/projects/systema-machinae",
  ]);
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

test("project detail routes are bounded to known slugs", () => {
  assert.equal(sanitizeRoute("/projects/drydock"), "/projects/drydock");
  assert.equal(sanitizeRoute("/projects/drydock?utm_source=x#top"), "/projects/drydock");
  assert.equal(sanitizeRoute("/projects/systema-machinae"), "/projects/systema-machinae");
  for (const rawPath of [
    "/projects",
    "/projects/",
    "/projects/unknown",
    "/projects/drydock/",
    "/projects/drydock/extra",
    "/projects/DRYDOCK",
    "/projects/drydock%2Fx",
    "/projects/../support-secret",
    "https://codeswhat.com/projects/drydock",
    "//evil.example/projects/drydock",
  ]) {
    assert.equal(sanitizeRoute(rawPath), "/_other", rawPath);
  }
  const pageview = sanitizeEvent({
    event: "$pageview",
    properties: { ...ENVELOPE, path: "/projects/careerrat?secret=1" },
  });
  assert.ok(pageview);
  assert.equal(pageview.properties.path, "/projects/careerrat");
  assert.equal(pageview.properties.$pathname, "/projects/careerrat");
  assert.equal(pageview.properties.$current_url, "https://codeswhat.com/projects/careerrat");
  const unknown = sanitizeEvent({
    event: "$pageview",
    properties: { ...ENVELOPE, path: "/projects/not-a-project" },
  });
  assert.ok(unknown);
  assert.equal(unknown.properties.path, "/_other");
});

test("CTA events are limited to the fixed vocabulary", () => {
  assert.deepEqual(ALLOWED_CTA_IDS, [
    "github_org",
    "sponsors_github",
    "support_systema",
    "support_monthly-5",
    "support_monthly-10",
    "support_monthly-25",
    "support_monthly-100",
    "support_once-10",
    "support_once-50",
    "project_sockguard",
    "project_drydock",
    "project_portwing",
    "project_portkey-admin-mcp",
    "project_mouthtype",
    "project_idlescreen",
    "project_careerrat",
    "project_systema-machinae",
  ]);
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
        $pathname: "/",
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

const ENVELOPE = {
  token: "phc_public-token_123",
  $cookieless_mode: true,
  $process_person_profile: false,
  path: "/",
  ...COOKIELESS_HASH_PROPERTIES,
};

test("web vitals carry a $pathname taken from the sanitized path", () => {
  const base = {
    token: "phc_public-token_123",
    $cookieless_mode: true,
    $process_person_profile: false,
    ...COOKIELESS_HASH_PROPERTIES,
  };
  const other = sanitizeEvent({
    event: "$web_vitals",
    properties: { ...base, path: "/private/page?secret=1", $web_vitals_LCP_value: 120 },
  });
  assert.ok(other);
  assert.equal(other.properties.path, "/_other");
  assert.equal(other.properties.$pathname, "/_other");

  const home = sanitizeEvent({
    event: "$web_vitals",
    properties: { ...base, path: "/", $pathname: "/ignored", $web_vitals_CLS_value: 0.1 },
  });
  assert.ok(home);
  assert.equal(home.properties.$pathname, "/");
});

test("a CTA event shaped like the browser sends it (no path property) survives the pinned pipeline", () => {
  // posthog-js never sets `path` on a cta capture; the route has to come from
  // $pathname / $current_url, which carry the real query string.
  const client = new PostHog();
  client.config.before_send = sanitizeEvent;
  for (const [ctaId, placement] of [
    ["github_org", "header"],
    ["project_drydock", "projects"],
  ]) {
    const result = client._runBeforeSend({
      event: "cta activated",
      properties: {
        token: "phc_public-token_123",
        $cookieless_mode: true,
        $process_person_profile: false,
        $current_url: "https://codeswhat.com/?utm_source=github#projects",
        $pathname: "/",
        cta_id: ctaId,
        placement,
        ...COOKIELESS_HASH_PROPERTIES,
      },
    }) as { event: string; properties: Record<string, unknown> } | null;
    assert.ok(result, `${ctaId} was dropped`);
    assert.equal(result.event, "cta activated");
    assert.equal(result.properties.cta_id, ctaId);
    assert.equal(result.properties.placement, placement);
    assert.equal(result.properties.path, "/");
  }
});

test("project CTAs need a project_ id with the projects placement", () => {
  const accepted = ALLOWED_CTA_IDS.filter((id) => id.startsWith("project_"));
  assert.equal(accepted.length, 8);
  for (const ctaId of accepted) {
    assert.ok(
      sanitizeEvent({
        event: "cta activated",
        properties: { ...ENVELOPE, cta_id: ctaId, placement: "projects" },
      }),
    );
    for (const placement of ["header", "hero", "footer", "elsewhere", ""]) {
      assert.equal(
        sanitizeEvent({
          event: "cta activated",
          properties: { ...ENVELOPE, cta_id: ctaId, placement },
        }),
        null,
      );
    }
  }
  assert.equal(
    sanitizeEvent({
      event: "cta activated",
      properties: { ...ENVELOPE, cta_id: "github_org", placement: "projects" },
    }),
    null,
  );
  for (const ctaId of ["project_unknown", "project_", "project_drydock?x=1", 7, undefined]) {
    assert.equal(
      sanitizeEvent({
        event: "cta activated",
        properties: { ...ENVELOPE, cta_id: ctaId, placement: "projects" },
      }),
      null,
    );
  }
});

test("support CTAs need the support placement and only run on /support", () => {
  const supportIds = ALLOWED_CTA_IDS.filter(
    (id) => id === "sponsors_github" || id.startsWith("support_"),
  );
  assert.equal(supportIds.length, 8);
  for (const ctaId of supportIds) {
    const result = sanitizeEvent({
      event: "cta activated",
      properties: {
        ...ENVELOPE,
        path: "/support",
        cta_id: ctaId,
        placement: "support",
      },
    });
    assert.ok(result, `${ctaId} was dropped`);
    assert.equal(result.properties.cta_id, ctaId);
    assert.equal(result.properties.placement, "support");
    assert.equal(result.properties.path, "/support");
    for (const placement of ["header", "hero", "footer", "projects", ""]) {
      assert.equal(
        sanitizeEvent({
          event: "cta activated",
          properties: { ...ENVELOPE, cta_id: ctaId, placement },
        }),
        null,
        `${ctaId} accepted with ${placement}`,
      );
    }
  }
  for (const ctaId of [
    "support_",
    "support_monthly-7",
    "support_monthly-5?x=1",
    "sponsors_other",
  ]) {
    assert.equal(
      sanitizeEvent({
        event: "cta activated",
        properties: { ...ENVELOPE, cta_id: ctaId, placement: "support" },
      }),
      null,
      ctaId,
    );
  }
  assert.equal(
    sanitizeEvent({
      event: "cta activated",
      properties: { ...ENVELOPE, cta_id: "github_org", placement: "support" },
    }),
    null,
  );
  assert.equal(sanitizeRoute("/support?utm_source=x"), "/support");
});

test("newsletter submitted keeps only a result and a fixed error class", () => {
  const success = sanitizeEvent({
    event: "newsletter submitted",
    properties: { ...ENVELOPE, result: "success", email: "me@example.com", error_class: "network" },
  });
  assert.ok(success);
  assert.equal(success.properties.result, "success");
  assert.equal("error_class" in success.properties, false);
  assert.equal("email" in success.properties, false);

  for (const errorClass of ["invalid_email", "rate_limited", "unavailable", "network"]) {
    const result = sanitizeEvent({
      event: "newsletter submitted",
      properties: {
        ...ENVELOPE,
        result: "error",
        error_class: errorClass,
        email: "me@example.com",
      },
    });
    assert.ok(result, errorClass);
    assert.equal(result.properties.error_class, errorClass);
    assert.equal("email" in result.properties, false);
  }

  for (const bad of [
    { result: "error" },
    { result: "error", error_class: "me@example.com" },
    { result: "error", error_class: "Failed to subscribe" },
    { result: "pending" },
    { result: "SUCCESS" },
    {},
  ]) {
    assert.equal(
      sanitizeEvent({ event: "newsletter submitted", properties: { ...ENVELOPE, ...bad } }),
      null,
      JSON.stringify(bad),
    );
  }
});

test("client error keeps only a bounded kind, an allowlisted name, and the route", () => {
  for (const kind of ["error", "unhandled_rejection"]) {
    const result = sanitizeEvent({
      event: "client error",
      properties: {
        ...ENVELOPE,
        error_kind: kind,
        error_name: "TypeError",
        message: "Cannot read properties of undefined",
        stack: "at https://codeswhat.com/_next/x.js:1:1",
        filename: "https://codeswhat.com/_next/x.js",
      },
    });
    assert.ok(result, kind);
    assert.equal(result.properties.error_kind, kind);
    assert.equal(result.properties.error_name, "TypeError");
    assert.equal(result.properties.path, "/");
    for (const leaked of ["message", "stack", "filename"]) {
      assert.equal(leaked in result.properties, false, leaked);
    }
  }
  for (const bad of [
    { error_kind: "exception", error_name: "TypeError" },
    { error_kind: "error", error_name: "CustomSecretError" },
    { error_kind: "error", error_name: "Cannot read properties of undefined" },
    { error_kind: "error" },
    { error_name: "Error" },
  ]) {
    assert.equal(
      sanitizeEvent({ event: "client error", properties: { ...ENVELOPE, ...bad } }),
      null,
      JSON.stringify(bad),
    );
  }
});

test("classifyClientErrorName only returns allowlisted constructor names", () => {
  class ChunkLoadError extends Error {
    name = "ChunkLoadError";
  }
  assert.equal(classifyClientErrorName(new TypeError("x")), "TypeError");
  assert.equal(classifyClientErrorName(new ReferenceError("x")), "ReferenceError");
  assert.equal(classifyClientErrorName(new SyntaxError("x")), "SyntaxError");
  assert.equal(classifyClientErrorName(new RangeError("x")), "RangeError");
  assert.equal(classifyClientErrorName(new ChunkLoadError("x")), "ChunkLoadError");
  assert.equal(classifyClientErrorName(new Error("x")), "Error");
  assert.equal(classifyClientErrorName(new URIError("x")), "other");
  const custom = new Error("x");
  custom.name = "me@example.com";
  assert.equal(classifyClientErrorName(custom), "other");
  for (const value of [null, undefined, "boom", 42, { name: "TypeError" }]) {
    assert.equal(classifyClientErrorName(value), "other");
  }
});

test("UTM labels pass only through the bounded vocabulary", () => {
  const forward = (utm: Record<string, unknown>, event = "$pageview") => {
    const result = sanitizeEvent({
      event,
      properties: { ...ENVELOPE, $web_vitals_LCP_value: 1, ...utm },
    });
    assert.ok(result);
    return result.properties;
  };

  for (const event of ["$pageview", "$pageleave", "$web_vitals"]) {
    const props = forward(
      { utm_source: "GitHub", utm_medium: "social", utm_campaign: "launch-2026" },
      event,
    );
    assert.equal(props.utm_source, "github");
    assert.equal(props.utm_medium, "social");
    assert.equal(props.utm_campaign, "launch-2026");
  }
  for (const source of [
    "github",
    "x",
    "bluesky",
    "linkedin",
    "reddit",
    "hackernews",
    "newsletter",
    "producthunt",
  ]) {
    assert.equal(forward({ utm_source: source }).utm_source, source);
  }
  for (const medium of ["social", "email", "referral", "community"]) {
    assert.equal(forward({ utm_medium: medium }).utm_medium, medium);
  }

  for (const bad of [
    "me@example.com",
    "user-12345",
    "github.com",
    "twitter",
    "",
    "<masked>",
    42,
    null,
  ]) {
    assert.equal("utm_source" in forward({ utm_source: bad }), false, String(bad));
    assert.equal("utm_medium" in forward({ utm_medium: bad }), false, String(bad));
  }
  for (const bad of [
    "me@example.com",
    "Has Space",
    "a".repeat(41),
    "under_score",
    "",
    7,
    "<masked>",
  ]) {
    assert.equal("utm_campaign" in forward({ utm_campaign: bad }), false, String(bad));
  }
  assert.equal(forward({ utm_campaign: "a".repeat(40) }).utm_campaign, "a".repeat(40));

  const props = forward({
    utm_content: "x",
    utm_term: "y",
    gclid: "abc",
    fbclid: "abc",
    msclkid: "abc",
    gad_source: "1",
    mc_cid: "abc",
  });
  for (const dropped of [
    "utm_content",
    "utm_term",
    "gclid",
    "fbclid",
    "msclkid",
    "gad_source",
    "mc_cid",
  ]) {
    assert.equal(dropped in props, false, dropped);
  }
});
