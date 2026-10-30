import assert from "node:assert/strict";
import { test } from "node:test";
import { buildLlmsTxt } from "../lib/llms.ts";
import {
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  projectDescription,
  projectTitle,
  TITLE_MAX,
} from "../lib/project-meta.ts";
import {
  homepageJsonLd,
  projectPageJsonLd,
  projectSchemaId,
  projectSoftwareNode,
  serializeJsonLd,
} from "../lib/project-schema.ts";
import { PROJECT_SLUGS } from "../lib/project-slugs.ts";
import { buildSecurityTxt } from "../lib/security-txt.ts";
import { BASE_URL, PROJECTS, SITE_CONFIG } from "../lib/site-config.ts";
import { SPECIMENS } from "../lib/specimens.ts";
import {
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

test("Systema keeps its own support page and nothing publishes costs", () => {
  assert.equal(SYSTEMA.supportUrl, "https://systemamachinae.com/support");
  assert.equal("cost" in SYSTEMA, false);
  for (const s of SPECIMENS) {
    assert.equal("monthly" in s, false, s.slug);
    assert.equal("upkeep" in s, false, s.slug);
  }
  assert.equal(buildLlmsTxt().toLowerCase().includes("cost"), false);
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

test("PROJECTS, SPECIMENS and PROJECT_SLUGS list the same slugs in the same order", () => {
  const projects = PROJECTS.map((p) => p.slug);
  assert.deepEqual(
    SPECIMENS.map((s) => s.slug),
    projects,
  );
  assert.deepEqual([...PROJECT_SLUGS], projects);
});

test("project titles and descriptions fit search snippets and stay unique", () => {
  const titles = SPECIMENS.map((s) => projectTitle(s, SITE_CONFIG.name));
  const descriptions = SPECIMENS.map((s) => projectDescription(s));

  for (const [i, s] of SPECIMENS.entries()) {
    assert.ok(titles[i].length <= TITLE_MAX, `${s.slug} title is ${titles[i].length}`);
    assert.ok(titles[i].startsWith(`${s.name}: ${s.tagline}`), s.slug);
    assert.ok(
      descriptions[i].length >= DESCRIPTION_MIN && descriptions[i].length <= DESCRIPTION_MAX,
      `${s.slug} description is ${descriptions[i].length}`,
    );
    assert.ok(descriptions[i].includes(s.license), `${s.slug} description omits its licence`);
  }
  assert.equal(new Set(titles).size, titles.length);
  assert.equal(new Set(descriptions).size, descriptions.length);
  for (const d of descriptions) {
    assert.doesNotMatch(d, /open-source (Server|Web) /, `kind is capitalised mid-sentence: ${d}`);
    assert.doesNotMatch(d, /\. [A-Za-z0-9.-]+, written in /, `licence reads as a fragment: ${d}`);
  }
});

test("homepage description fits a search snippet", () => {
  assert.ok(
    SITE_CONFIG.description.length <= DESCRIPTION_MAX,
    String(SITE_CONFIG.description.length),
  );
});

test("llms.txt lists every project once with its field-notes URL", () => {
  const body = buildLlmsTxt();
  assert.doesNotMatch(body, /undefined/);
  assert.ok(body.startsWith("# CodesWhat\n"));
  const projects = body.split("## Projects")[1].split("## Optional")[0];
  for (const p of PROJECTS) {
    assert.ok(body.includes(`${BASE_URL}/projects/${p.slug}`), `${p.slug} field notes missing`);
    const hits = projects.split(`- [${p.name}](`).length - 1;
    assert.equal(hits, 1, `${p.name} appears ${hits} times`);
    const entry = projects.split("\n- [").find((b) => b.startsWith(`${p.name}](`));
    assert.ok(entry, `${p.name} entry missing`);
    assert.ok(
      entry.includes(`  - Field notes: ${BASE_URL}/projects/${p.slug}`),
      `${p.name} entry lacks its own field-notes line`,
    );
  }
});

test("security.txt carries the RFC 9116 required fields", () => {
  const now = new Date("2026-10-28T00:00:00Z");
  const body = buildSecurityTxt(now);
  assert.match(body, /^Contact: mailto:security@codeswhat\.com$/m);
  assert.match(body, /^Canonical: .+\/\.well-known\/security\.txt$/m);
  assert.match(body, /^Policy: https:\/\//m);
  const expires = body.match(/^Expires: (.+)$/m)?.[1];
  assert.ok(expires);
  const days = (Date.parse(expires) - now.getTime()) / 86_400_000;
  assert.ok(days >= 1 && days <= 365, String(days));
  const fixed = buildSecurityTxt(new Date("2026-01-01T00:00:00Z"));
  assert.equal(fixed.match(/^Expires: (.+)$/m)?.[1], "2026-06-30T00:00:00.000Z");
});

test("each project is one schema.org entity with a stable slug-based id", () => {
  for (const s of SPECIMENS) {
    const node = projectSoftwareNode(s) as Record<string, unknown>;
    assert.equal(node["@type"], "SoftwareSourceCode");
    assert.equal(node["@id"], `${BASE_URL}/projects/${s.slug}#software`);
    assert.equal(node["@id"], projectSchemaId(s.slug));
    assert.equal(node.url, `${BASE_URL}/projects/${s.slug}`);
    assert.equal(node.name, s.name, s.slug);
    assert.equal(node.description, s.about);
    assert.equal(node.programmingLanguage, s.language);
    assert.deepEqual(node.author, { "@id": `${BASE_URL}/#org` });
    assert.deepEqual(node.publisher, { "@id": `${BASE_URL}/#org` });
  }
});

test("project nodes only point codeRepository at CodesWhat GitHub repos", () => {
  for (const s of SPECIMENS) {
    const node = projectSoftwareNode(s) as Record<string, unknown>;
    const repo = node.codeRepository as string | undefined;
    assert.ok(repo === undefined || repo.startsWith("https://github.com/CodesWhat/"), s.slug);
    assert.equal(repo, s.repo, s.slug);
    if (repo) {
      assert.equal(node.license, `${repo}/blob/main/LICENSE`);
    } else {
      assert.equal("license" in node, false, s.slug);
    }
    const same = node.sameAs as string[] | undefined;
    if (same) assert.ok(!same.includes(repo as string), s.slug);
  }
});

test("systema-machinae has no repository and no licence file link", () => {
  const s = SPECIMENS.find((x) => x.slug === "systema-machinae");
  assert.ok(s);
  const node = projectSoftwareNode(s) as Record<string, unknown>;
  assert.equal("codeRepository" in node, false);
  assert.equal("license" in node, false);
});

test("project page graph has a breadcrumb ending at the project URL", () => {
  for (const s of SPECIMENS) {
    const ld = projectPageJsonLd(s) as { "@context": string; "@graph": Record<string, unknown>[] };
    assert.equal(ld["@context"], "https://schema.org");
    const crumb = ld["@graph"].find((n) => n["@type"] === "BreadcrumbList") as {
      itemListElement: { position: number; name: string; item: string }[];
    };
    assert.equal(crumb.itemListElement.length, 2);
    assert.equal(crumb.itemListElement[0].item, BASE_URL);
    assert.equal(crumb.itemListElement[1].item, `${BASE_URL}/projects/${s.slug}`);
    assert.equal(crumb.itemListElement[1].name, s.name);
    assert.deepEqual(
      ld["@graph"].find((n) => n["@type"] === "SoftwareSourceCode"),
      projectSoftwareNode(s),
      s.slug,
    );
  }
});

test("serializeJsonLd escapes < so markup can't close the script tag", () => {
  const out = serializeJsonLd({ a: "</script><b>" });
  assert.equal(out.includes("<"), false);
  assert.deepEqual(JSON.parse(out), { a: "</script><b>" });
});

test("homepage graph lists the same project ids as the project pages", () => {
  const home = (homepageJsonLd["@graph"] as Record<string, unknown>[])
    .filter((n) => n["@type"] === "SoftwareSourceCode")
    .map((n) => n["@id"])
    .sort();
  const pages = SPECIMENS.map((s) => projectSchemaId(s.slug)).sort();
  assert.deepEqual(home, pages);
});
