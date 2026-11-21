import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

// The self-delegation case needs the variable set before the module is first evaluated.
const adapterFile = fileURLToPath(new URL("../csp-adapter.mjs", import.meta.url));
process.env.NEXT_ADAPTER_PATH = adapterFile;
const { default: adapter, collectHashes, PLACEHOLDER } = await import("../csp-adapter.mjs");

const dir = mkdtempSync(join(tmpdir(), "csp-adapter-"));
const htmlFile = (name, body) => {
  const file = join(dir, name);
  writeFileSync(file, `<html><script>${body}</script><script src="/x.js"></script></html>`);
  return file;
};
const prerender = (pathname, route, filePath) => ({
  pathname,
  route,
  fallback: filePath ? { filePath } : undefined,
});

test("hashes every inline script when all prerenders have HTML", () => {
  const outputs = {
    prerenders: [
      prerender("/", "/", htmlFile("a.html", "one()")),
      prerender("/p/x", "/p/[slug]", htmlFile("b.html", "two()")),
      prerender("/p/[slug]", "/p/[slug]", undefined),
    ],
    staticFiles: [],
    appPages: [{ pathname: "/" }, { pathname: "/p/[slug]" }, { pathname: "/p/[slug].rsc" }],
  };
  const { list, pages } = collectHashes(outputs);
  assert.equal(pages, 2);
  assert.equal(list.length, 2);
  assert.ok(list.every((hash) => /^'sha256-[A-Za-z0-9+/=]+'$/.test(hash)));
});

test("fails when one instance of a route has no HTML, even if a sibling does", () => {
  const outputs = {
    prerenders: [
      prerender("/p/x", "/p/[slug]", htmlFile("c.html", "three()")),
      prerender("/p/y", "/p/[slug]", undefined),
    ],
    staticFiles: [],
    appPages: [{ pathname: "/p/[slug]" }],
  };
  assert.throws(() => collectHashes(outputs), /no HTML to hash: \/p\/y/);
});

test("fails when an app page has no HTML behind it", () => {
  const outputs = {
    prerenders: [prerender("/", "/", htmlFile("d.html", "four()"))],
    staticFiles: [],
    appPages: [{ pathname: "/" }, { pathname: "/live" }],
  };
  assert.throws(() => collectHashes(outputs), /not prerendered: \/live/);
});

test("NEXT_ADAPTER_PATH pointing at the adapter itself does not recurse", async () => {
  const config = { marker: true };
  assert.equal(await adapter.modifyConfig(config, {}), config);

  const distDir = join(dir, "dist");
  const { mkdirSync } = await import("node:fs");
  mkdirSync(distDir);
  writeFileSync(join(distDir, "routes-manifest.json"), `{"csp":"${PLACEHOLDER}"}`);
  const headers = { "content-security-policy": `script-src ${PLACEHOLDER}` };
  await adapter.onBuildComplete({
    distDir,
    routing: { beforeMiddleware: [{ headers }] },
    outputs: {
      prerenders: [prerender("/", "/", htmlFile("e.html", "five()"))],
      staticFiles: [],
      appPages: [{ pathname: "/" }],
    },
  });
  assert.match(headers["content-security-policy"], /^script-src 'sha256-/);
  assert.doesNotMatch(readFileSync(join(distDir, "routes-manifest.json"), "utf8"), /__CSP/);
  rmSync(dir, { recursive: true, force: true });
});
