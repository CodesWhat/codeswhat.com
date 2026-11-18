import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { buildLlmsTxt } from "../lib/llms.ts";
import { PROJECT_SLUGS } from "../lib/project-slugs.ts";
import { PROJECTS } from "../lib/site-config.ts";
import { SPECIMENS } from "../lib/specimens.ts";

const sitemapSource = readFileSync(new URL("../app/sitemap.ts", import.meta.url), "utf8");

// app/sitemap.ts imports through the "@/" alias, which node can't resolve, so
// read its route templates from source instead of executing it.
const templates = [...sitemapSource.matchAll(/url:\s*`\$\{BASE_URL\}([^`]*)`/g)].map((m) => m[1]);
const listsHome = /url:\s*BASE_URL,/.test(sitemapSource);

function pageExists(path: string): boolean {
  return existsSync(new URL(`../app/(site)${path}/page.tsx`, import.meta.url));
}

test("sitemap lists the home page and only routes that exist", () => {
  assert.ok(listsHome, "sitemap should list the home page");
  assert.ok(pageExists(""), "home page missing");
  assert.ok(templates.length > 0);
  for (const template of templates) {
    if (template.includes("{slug}")) {
      assert.match(template, /^\/projects\/\$\{slug\}$/);
      assert.ok(pageExists("/projects/[slug]"));
      continue;
    }
    assert.ok(pageExists(template), `no page for sitemap route ${template}`);
  }
});

test("sitemap expands the project route from PROJECT_SLUGS", () => {
  assert.match(sitemapSource, /PROJECT_SLUGS\.map/);
});

test("every project slug is a rostered project", () => {
  const rostered = new Set([...PROJECTS.map((p) => p.slug), ...SPECIMENS.map((s) => s.slug)]);
  for (const slug of PROJECT_SLUGS) {
    assert.ok(rostered.has(slug), `${slug} is in the sitemap but not rostered`);
  }
});

test("llms.txt only links this site's pages that the sitemap lists", () => {
  const listed = new Set(["/support", ...PROJECT_SLUGS.map((slug) => `/projects/${slug}`)]);
  const own = buildLlmsTxt().match(/https:\/\/codeswhat\.com(\/[^\s)]*)?/g) ?? [];
  for (const url of own) {
    const path = new URL(url).pathname;
    if (path === "/") continue;
    assert.ok(listed.has(path), `llms.txt links ${path}, not in the sitemap`);
  }
});
