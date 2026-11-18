#!/usr/bin/env node
/**
 * Repeatable link audit against a running server.
 *   node scripts/audit-links.mjs [baseUrl]    (default http://localhost:3000)
 *
 * Checks every sitemap URL, robots.txt, llms.txt and security.txt, then crawls
 * each sitemap page and verifies every anchor. Internal links must be 200,
 * external links 2xx/3xx. Hosts that block bots (401/403/429/999) are reported
 * separately and don't fail the run.
 */
const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const PROD_ORIGIN = "https://codeswhat.com";
const TIMEOUT_MS = 15_000;
const UA = "Mozilla/5.0 (compatible; codeswhat-link-audit)";
const BLOCKED = new Set([401, 403, 429, 999]);

const toLocal = (url) => (url.startsWith(PROD_ORIGIN) ? base + url.slice(PROD_ORIGIN.length) : url);

function request(url, method) {
  return fetch(url, {
    method,
    redirect: "follow",
    headers: { "user-agent": UA },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

async function status(url) {
  try {
    const head = await request(url, "HEAD");
    if (head.status < 400) return head.status;
  } catch {}
  try {
    return (await request(url, "GET")).status;
  } catch (error) {
    return `error: ${error.cause?.code ?? error.message}`;
  }
}

const failures = [];
const blocked = [];

function record(source, url, result, internal) {
  const ok =
    typeof result === "number" && (internal ? result === 200 : result >= 200 && result < 400);
  if (ok) return;
  if (!internal && BLOCKED.has(result)) blocked.push({ source, url, result });
  else failures.push({ source, url, result });
}

const text = async (path) => (await fetch(base + path)).text();
const sitemap = await text("/sitemap.xml");
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

for (const page of pages) {
  record("sitemap.xml", page, await status(toLocal(page)), true);
}

const textUrls = new Map();
for (const path of ["/robots.txt", "/llms.txt", "/.well-known/security.txt"]) {
  const body = await text(path);
  for (const url of body.match(/https?:\/\/[^\s)>\]"']+/g) ?? []) {
    textUrls.set(url, path);
  }
}
for (const [url, source] of textUrls) {
  const internal = url.startsWith(PROD_ORIGIN);
  record(source, url, await status(toLocal(url)), internal);
}

const checked = new Map();
async function checkLink(source, href) {
  let url;
  try {
    url = new URL(href, `${base}/`);
  } catch {
    return;
  }
  if (!/^https?:$/.test(url.protocol)) return;
  url.hash = "";
  const internal = url.origin === base || url.origin === PROD_ORIGIN;
  const target = url.href;
  if (!checked.has(target)) checked.set(target, await status(target));
  record(source, url.href, checked.get(target), internal);
}

for (const page of pages) {
  const html = await (await fetch(toLocal(page))).text();
  const hrefs = new Set(
    [...html.matchAll(/<a\s[^>]*?href="([^"]+)"/g)].map((m) => m[1].replaceAll("&amp;", "&")),
  );
  for (const href of hrefs) await checkLink(page, href);
}

console.log(`pages: ${pages.length}, unique links checked: ${checked.size}`);
if (blocked.length) {
  console.log("\nBlocked to bots (not failures):");
  for (const b of blocked) console.log(`  ${b.result} ${b.url} (on ${b.source})`);
}
if (failures.length) {
  console.log("\nFAILURES:");
  for (const f of failures) console.log(`  ${f.result} ${f.url} (on ${f.source})`);
  process.exit(1);
}
console.log("\nAll links OK.");
