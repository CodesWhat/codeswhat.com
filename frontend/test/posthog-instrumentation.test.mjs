import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

// Runs the real instrumentation-client.ts and real privacy helpers. Only the
// posthog-js SDK is replaced, by a recorder on globalThis.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "posthog-js") {
      return {
        // Evaluated once and cached, so delegate to whichever recorder is current.
        url: "data:text/javascript,export default { init: (...a) => globalThis.__posthogMock.init(...a), capture: (...a) => globalThis.__posthogMock.capture(...a) };",
        shortCircuit: true,
      };
    }
    if (specifier.startsWith("./") && !/\.[a-z]+$/u.test(specifier)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});

let loads = 0;

// Each call evaluates a fresh copy of the module against a fake window.
async function load({ href, navigator = {} }) {
  const captures = [];
  globalThis.__posthogMock = {
    init() {},
    capture: (event, properties) => captures.push({ event, properties }),
  };
  globalThis.window = {
    location: new URL(href),
    navigator,
    addEventListener() {},
  };
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = "phc_testproject123";
  process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://e.codeswhat.com";
  process.env.NEXT_PUBLIC_POSTHOG_UI_HOST = "https://us.posthog.com";
  loads += 1;
  const mod = await import(`../instrumentation-client.ts?case=${loads}`);
  const initial = captures.splice(0);
  return { mod, captures, initial };
}

const pageviews = (captures) =>
  captures.filter((c) => c.event === "$pageview").map((c) => c.properties.path);

test("the initial page load is captured by its pathname", async () => {
  const { initial } = await load({ href: "https://codeswhat.com/support?x=1#y" });
  assert.deepEqual(pageviews(initial), ["/support"]);
});

test("a relative push captures its allowlisted path", async () => {
  const { mod, captures } = await load({ href: "https://codeswhat.com/" });
  mod.onRouterTransitionStart("/support?utm_source=x", "push");
  assert.deepEqual(pageviews(captures), ["/support"]);
});

test("an absolute same-origin traverse captures the right path, not /_other", async () => {
  const { mod, captures } = await load({ href: "https://codeswhat.com/support" });
  mod.onRouterTransitionStart("https://codeswhat.com/?a=1#frag", "traverse");
  assert.deepEqual(pageviews(captures), ["/"]);
});

test("a traverse is captured even when location already holds the destination", async () => {
  const { mod, captures } = await load({ href: "https://codeswhat.com/support#tiers" });
  mod.onRouterTransitionStart("https://codeswhat.com/support#tiers", "traverse");
  assert.deepEqual(pageviews(captures), ["/support"]);
});

test("a foreign origin is /_other", async () => {
  const { mod, captures } = await load({ href: "https://codeswhat.com/" });
  mod.onRouterTransitionStart("https://evil.example/support", "traverse");
  mod.onRouterTransitionStart("https://evil.example/support", "push");
  assert.deepEqual(pageviews(captures), ["/_other", "/_other"]);
});

test("a hash-only or same-page link captures nothing", async () => {
  const onSupport = await load({ href: "https://codeswhat.com/support" });
  onSupport.mod.onRouterTransitionStart("#tiers", "push");
  onSupport.mod.onRouterTransitionStart("/support#tiers", "replace");
  assert.deepEqual(onSupport.captures, []);

  const onHome = await load({ href: "https://codeswhat.com/" });
  onHome.mod.onRouterTransitionStart("/#specimens", "push");
  assert.deepEqual(onHome.captures, []);
});

test("a cross-page hash link captures the destination path", async () => {
  const { mod, captures } = await load({ href: "https://codeswhat.com/" });
  mod.onRouterTransitionStart("/support#tiers", "push");
  assert.deepEqual(pageviews(captures), ["/support"]);
});

test("a changed query on the same path still counts as a navigation", async () => {
  const { mod, captures } = await load({ href: "https://codeswhat.com/support?a=1" });
  mod.onRouterTransitionStart("/support?a=2", "push");
  assert.deepEqual(pageviews(captures), ["/support"]);
});

test("a GPC context captures nothing, including the initial view", async () => {
  const { mod, captures, initial } = await load({
    href: "https://codeswhat.com/",
    navigator: { globalPrivacyControl: true },
  });
  mod.onRouterTransitionStart("/support", "push");
  mod.onRouterTransitionStart("https://codeswhat.com/support", "traverse");
  assert.deepEqual(initial, []);
  assert.deepEqual(captures, []);
});
