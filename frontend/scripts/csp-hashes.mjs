// Runs after `next build`. Next writes inline <script> tags into every prerendered page
// (the chunk bootstrap, the Flight pushes, our theme-init) and their text changes with
// each build, so the CSP can't list them by hand. This hashes them and swaps the
// placeholder in .next/routes-manifest.json, which `next start` and Vercel's Next builder
// both read for response headers after the build.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { SPECIMENS } from "../lib/specimens.ts";

const PLACEHOLDER = "__CSP_INLINE_SCRIPT_HASHES__";
const root = fileURLToPath(new URL("..", import.meta.url));
const nextDir = join(root, ".next");
const manifestPath = join(nextDir, "routes-manifest.json");

function fail(message) {
  console.error(`csp-hashes: ${message}`);
  process.exit(1);
}

function htmlFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...htmlFiles(path));
    else if (entry.name.endsWith(".html")) found.push(path);
  }
  return found;
}

const JS_TYPES = new Set(["", "text/javascript", "application/javascript", "module"]);

// Inline classic or module scripts only. Data blocks such as ld+json never execute.
function inlineScripts(html) {
  const scripts = [];
  for (const [, attributes, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/\bsrc\s*=/.test(attributes)) continue;
    const type = attributes.match(/\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/);
    const value = (type?.[1] ?? type?.[2] ?? type?.[3] ?? "").trim().toLowerCase();
    if (!JS_TYPES.has(value)) continue;
    if (body === "") continue;
    scripts.push(body);
  }
  return scripts;
}

let files;
try {
  files = htmlFiles(join(nextDir, "server", "app"));
} catch (error) {
  fail(`cannot read .next/server/app (${error.message}); run next build first`);
}
if (files.length === 0) fail("no prerendered HTML files found under .next/server/app");

const hashes = new Set();
for (const file of files) {
  for (const body of inlineScripts(readFileSync(file, "utf8"))) {
    hashes.add(`'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`);
  }
}
const list = [...hashes].sort();
if (list.length === 0) fail("no inline scripts found; the prerendered pages look wrong");

const prerendered = new Set(
  Object.keys(JSON.parse(readFileSync(join(nextDir, "prerender-manifest.json"), "utf8")).routes),
);
const expected = ["/", "/support", ...SPECIMENS.map((s) => `/projects/${s.slug}`), "/_not-found"];
const missing = expected.filter((route) => !prerendered.has(route));
if (missing.length > 0) {
  fail(`expected routes are not prerendered: ${missing.join(", ")}`);
}

const manifest = readFileSync(manifestPath, "utf8");
const occurrences = manifest.split(PLACEHOLDER).length - 1;
if (occurrences !== 1) {
  fail(`expected the CSP placeholder exactly once in routes-manifest.json, found ${occurrences}`);
}
const rewritten = manifest.replace(PLACEHOLDER, list.join(" "));
if (rewritten.includes(PLACEHOLDER)) fail("the CSP placeholder is still present after rewriting");
writeFileSync(manifestPath, rewritten);

console.log(
  `csp-hashes: ${list.length} inline script hashes from ${files.length} prerendered pages written to routes-manifest.json`,
);
