// Next build adapter that fills the CSP's inline-script hashes. Next writes inline <script>
// tags into every prerendered page (chunk bootstrap, Flight pushes, our theme-init) and their
// text changes with each build, so next.config.ts ships a placeholder and this swaps in the
// hashes once the HTML exists.
//
// Vercel builds through its own adapter, which it points at via NEXT_ADAPTER_PATH. Next
// loads only one adapter, so this one takes that slot and delegates every hook to Vercel's
// (or to nothing, for a plain `next build`). The hashes go into the routing headers before the
// delegate sees them, and into routes-manifest.json for `next start`.
import { createHash } from "node:crypto";
import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const PLACEHOLDER = "__CSP_INLINE_SCRIPT_HASHES__";

const JS_TYPES = new Set(["", "text/javascript", "application/javascript", "module"]);

// Inline classic or module scripts only. Data blocks such as ld+json never execute.
export function inlineScripts(html) {
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

function fail(message) {
  throw new Error(`csp-adapter: ${message}`);
}

// Next's own default for adapterPath is this variable, and Vercel's builder sets it, so it
// still holds the delegate's path when this adapter is loaded in its place.
const delegatePath = process.env.NEXT_ADAPTER_PATH;
let delegatePromise;
function loadDelegate() {
  if (!delegatePath) return Promise.resolve(undefined);
  delegatePromise ??= (async () => {
    const resolved = realpathSync(createRequire(import.meta.url).resolve(delegatePath));
    // Pointing the variable at this file would make the adapter delegate to itself forever.
    if (resolved === realpathSync(fileURLToPath(import.meta.url))) return undefined;
    const mod = await import(pathToFileURL(resolved).href);
    return mod.default ?? mod;
  })();
  return delegatePromise;
}

export function collectHashes(outputs) {
  const files = new Set();
  // Pathnames that have HTML behind them: a prerender, the route a prerender was built from
  // (dynamic segments), or a static HTML file. _not-found is served from the static 404.
  const covered = new Set();
  const htmlLess = new Set();
  for (const prerender of outputs.prerenders) {
    const file = prerender.fallback?.filePath;
    if (file?.endsWith(".html")) {
      covered.add(prerender.pathname);
      covered.add(prerender.route);
      files.add(file);
    } else if (!file && !prerender.pathname.includes("[")) {
      // A `response: 'empty'` entry has no file and renders per request. A bracketed
      // pathname is the fallback:false template of a dynamic route, which serves nothing.
      htmlLess.add(prerender.pathname);
    }
  }
  if (htmlLess.size > 0) fail(`prerenders have no HTML to hash: ${[...htmlLess].join(", ")}`);
  for (const file of outputs.staticFiles) {
    covered.add(file.pathname);
    if (file.filePath.endsWith(".html")) files.add(file.filePath);
  }
  if (covered.has("/404")) covered.add("/_not-found");
  // An app page with no HTML behind it renders per request, so its inline scripts can't be
  // hashed ahead of time and would be blocked.
  const dynamic = outputs.appPages
    .map((page) => page.pathname)
    .filter((pathname) => !pathname.endsWith(".rsc") && !covered.has(pathname));
  if (dynamic.length > 0) fail(`app pages are not prerendered: ${dynamic.join(", ")}`);
  if (files.size === 0) fail("no prerendered HTML files in the build outputs");

  const hashes = new Set();
  for (const file of files) {
    for (const body of inlineScripts(readFileSync(file, "utf8"))) {
      hashes.add(`'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`);
    }
  }
  if (hashes.size === 0) fail("no inline scripts found; the prerendered pages look wrong");
  return { list: [...hashes].sort(), pages: files.size };
}

function* routeHeaders(routing) {
  for (const routes of Object.values(routing)) {
    if (!Array.isArray(routes)) continue;
    for (const route of routes) {
      if (route.headers) yield route.headers;
    }
  }
}

const adapter = {
  name: "csp-hashes",

  async modifyConfig(config, ctx) {
    const delegate = await loadDelegate();
    return delegate?.modifyConfig ? delegate.modifyConfig(config, ctx) : config;
  },

  async onBuildComplete(ctx) {
    const { list, pages } = collectHashes(ctx.outputs);
    const replacement = list.join(" ");

    let replaced = 0;
    for (const headers of routeHeaders(ctx.routing)) {
      for (const [key, value] of Object.entries(headers)) {
        if (typeof value === "string" && value.includes(PLACEHOLDER)) {
          headers[key] = value.replaceAll(PLACEHOLDER, replacement);
          replaced += 1;
        }
      }
    }
    if (replaced !== 1) {
      fail(`expected the CSP placeholder in one routing header, found ${replaced}`);
    }

    // `next start` reads response headers from here rather than from the adapter's routing.
    const manifestPath = join(ctx.distDir, "routes-manifest.json");
    const manifest = readFileSync(manifestPath, "utf8");
    if (manifest.split(PLACEHOLDER).length !== 2) {
      fail("expected the CSP placeholder exactly once in routes-manifest.json");
    }
    writeFileSync(manifestPath, manifest.replace(PLACEHOLDER, replacement));

    console.log(`csp-adapter: ${list.length} inline script hashes from ${pages} prerendered pages`);

    const delegate = await loadDelegate();
    if (delegate?.onBuildComplete) await delegate.onBuildComplete(ctx);
  },
};

export default adapter;
