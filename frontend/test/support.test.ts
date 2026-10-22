import assert from "node:assert/strict";
import { test } from "node:test";
import { PROJECTS } from "../lib/site-config.ts";
import {
  PROJECT_COSTS,
  type SupportProjectId,
  SYSTEMA,
  supportCtaId,
  supportLinksFrom,
  TIERS,
  tiersWith,
  validLink,
} from "../lib/support.ts";

const good = "https://buy.stripe.com/test_abc123";

test("validLink accepts https Stripe payment and donate links", () => {
  assert.equal(validLink(good), true);
  assert.equal(validLink("https://donate.stripe.com/abc"), true);
});

test("validLink rejects http, other hosts, credentials, and bare paths", () => {
  for (const value of [
    "http://buy.stripe.com/abc",
    "https://stripe.com/abc",
    "https://evil.example/buy.stripe.com/abc",
    "https://buy.stripe.com.evil.example/abc",
    "https://user:pass@buy.stripe.com/abc",
    "https://user@buy.stripe.com/abc",
    "https://buy.stripe.com",
    "https://buy.stripe.com/",
    "javascript:alert(1)",
    "not a url",
    "",
    null,
    undefined,
    42,
  ]) {
    assert.equal(validLink(value), false, String(value));
  }
});

test("supportLinksFrom handles bad JSON, non-objects, and unknown ids", () => {
  const warnings: string[] = [];
  const warn = (message: string) => warnings.push(message);
  const id = TIERS[0].id;

  assert.deepEqual(supportLinksFrom(undefined, warn), {});
  assert.deepEqual(supportLinksFrom("", warn), {});
  assert.equal(warnings.length, 0);

  assert.deepEqual(supportLinksFrom("{bad", warn), {});
  assert.deepEqual(supportLinksFrom("[]", warn), {});
  assert.deepEqual(supportLinksFrom("null", warn), {});
  assert.deepEqual(supportLinksFrom('"text"', warn), {});
  assert.equal(warnings.length, 4);

  warnings.length = 0;
  const links = supportLinksFrom(
    JSON.stringify({ [id]: good, nope: good, [TIERS[1].id]: "http://buy.stripe.com/x" }),
    warn,
  );
  assert.deepEqual(links, { [id]: good });
  assert.equal(warnings.length, 2);
});

test("tiersWith keeps valid links and nulls invalid ones", () => {
  const [first, second] = TIERS;
  const tiers = tiersWith({ [first.id]: good, [second.id]: "https://evil.example/x" });
  assert.equal(tiers.find((t) => t.id === first.id)?.link, good);
  assert.equal(tiers.find((t) => t.id === second.id)?.link, null);
  assert.equal(tiers.length, TIERS.length);
  assert.ok(tiersWith({}).every((t) => t.link === null));
});

test("every tier has a unique id and a whole-dollar price", () => {
  assert.equal(new Set(TIERS.map((t) => t.id)).size, TIERS.length);
  assert.ok(TIERS.every((t) => Number.isInteger(t.price) && t.price > 0));
});

test("the six tiers match GitHub Sponsors and Stripe", () => {
  assert.deepEqual(
    TIERS.map((t) => [t.id, t.name, t.price, t.cadence]),
    [
      ["monthly-5", "Keep the lights on", 5, "monthly"],
      ["monthly-10", "README supporter", 10, "monthly"],
      ["monthly-25", "Team sponsor", 25, "monthly"],
      ["monthly-100", "Company sponsor", 100, "monthly"],
      ["once-10", "One-off thanks", 10, "once"],
      ["once-50", "One-off supporter", 50, "once"],
    ],
  );
  assert.ok(
    TIERS.every((t) => t.link === null),
    "no URL is hardcoded in source",
  );
  assert.ok(TIERS.every((t) => t.buys.length > 0));
});

test("all six ids accept a valid link from the env value", () => {
  const raw = JSON.stringify(Object.fromEntries(TIERS.map((t) => [t.id, good])));
  const warnings: string[] = [];
  const links = supportLinksFrom(raw, (m) => warnings.push(m));
  assert.equal(Object.keys(links).length, 6);
  assert.deepEqual(warnings, []);
  assert.ok(tiersWith(links).every((t) => t.link === good));
});

test("every project has a running-cost entry and Systema stays separate", () => {
  for (const project of PROJECTS) {
    assert.ok(PROJECT_COSTS[project.slug as SupportProjectId], project.slug);
  }
  assert.equal(Object.keys(PROJECT_COSTS).length, PROJECTS.length);
  assert.equal(SYSTEMA.supportUrl, "https://systemamachinae.com/support");
  assert.equal(SYSTEMA.cost, "$30/month all-in");
});

test("supportCtaId derives from the tier id", () => {
  assert.deepEqual(TIERS.map(supportCtaId), [
    "support_monthly-5",
    "support_monthly-10",
    "support_monthly-25",
    "support_monthly-100",
    "support_once-10",
    "support_once-50",
  ]);
});
