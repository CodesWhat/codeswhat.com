import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = fileURLToPath(new URL("..", import.meta.url));
const nextBin = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js";
// Cloudflare's published test credentials. CI builds with the test site key.
const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
const TURNSTILE_TEST_SECRET = "1x0000000000000000000000000000000AA";
const TURNSTILE_DUMMY_RESPONSE = "XXXX.DUMMY.TOKEN.XXXX";
let server;
let browser;
let baseUrl;

before(async () => {
  // The server may only reach two externals, and both are local stand-ins. The
  // siteverify stub follows Cloudflare's documented test-secret behaviour: the
  // always-pass secret accepts only the dummy response value and rejects the rest.
  const stubExternalFetch = `globalThis.fetch = async (input, init) => {
    const url = String(input?.url ?? input);
    if (url === ${JSON.stringify(SITEVERIFY_URL)}) {
      const form = new URLSearchParams(String(init?.body));
      const ok =
        form.get("secret") === ${JSON.stringify(TURNSTILE_TEST_SECRET)} &&
        form.get("response") === ${JSON.stringify(TURNSTILE_DUMMY_RESPONSE)};
      return Response.json(
        ok ? { success: true, "error-codes": [] } : { success: false, "error-codes": ["invalid-input-response"] },
      );
    }
    if (url.startsWith("https://api.emailoctopus.com/")) return Response.json({ id: "stub" }, { status: 201 });
    throw new Error("External fetch is disabled in site tests: " + url);
  };`;
  server = spawn(
    process.execPath,
    [
      "--import",
      `data:text/javascript,${encodeURIComponent(stubExternalFetch)}`,
      nextBin,
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "0",
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        NODE_ENV: "production",
        NEXT_TELEMETRY_DISABLED: "1",
        EMAILOCTOPUS_API_KEY: "",
        EMAILOCTOPUS_LIST_ID: "",
        TURNSTILE_SECRET_KEY: TURNSTILE_TEST_SECRET,
        VERCEL_ENV: "",
        CODESWHAT_SUPPORT_LINKS: JSON.stringify({
          "monthly-5": "https://buy.stripe.com/test_monthly5",
          "once-50": "https://buy.stripe.com/test_once50",
          "monthly-10": "http://insecure.example/not-allowed",
        }),
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  await new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(
      () => reject(new Error(`Production server did not start:\n${output}`)),
      30_000,
    );
    const read = (data) => {
      output = `${output}${data}`.slice(-8_000);
      const address = output.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
      if (address && output.includes("Ready in")) {
        baseUrl = address;
        clearTimeout(timer);
        resolve();
      }
    };
    server.stdout.on("data", read);
    server.stderr.on("data", read);
    server.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    server.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Production server exited (${code}):\n${output}`));
    });
  });

  const systemChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const executablePath =
    process.env.BROWSER_EXECUTABLE_PATH ||
    (existsSync(chromium.executablePath())
      ? chromium.executablePath()
      : existsSync(systemChrome)
        ? systemChrome
        : undefined);
  browser = await chromium.launch({ headless: true, executablePath });
});

after(async () => {
  try {
    await browser?.close();
  } finally {
    if (server && server.exitCode === null && server.signalCode === null) {
      await new Promise((resolve) => {
        const force = setTimeout(() => server.kill("SIGKILL"), 5_000);
        server.once("exit", () => {
          clearTimeout(force);
          resolve();
        });
        server.kill("SIGTERM");
      });
    }
  }
});

async function localPage(t) {
  const context = await browser.newContext();
  t.after(() => context.close());
  await context.route("**/*", (route) => {
    if (new URL(route.request().url()).origin === baseUrl) return route.continue();
    return route.abort();
  });
  return context.newPage();
}

// Stands in for Cloudflare's api.js, served through the page's real CSP. Modes
// mirror the widget: "pass" hands back the dummy response the always-pass keys
// issue, "reject" hands back a value siteverify refuses, "error" fires the
// error callback. Each render and reset is recorded for the assertions.
async function turnstilePage(t, mode) {
  const page = await localPage(t);
  const requests = [];
  await page.context().route(`${TURNSTILE_SCRIPT_URL}**`, (route) => {
    requests.push(route.request().url());
    if (mode === "blocked") return route.abort();
    if (mode === "empty-then-pass" && requests.length === 1) {
      return route.fulfill({
        contentType: "text/javascript",
        body: "/* loads, defines nothing */",
      });
    }
    if (mode === "stall") return new Promise(() => {});
    return route.fulfill({
      contentType: "text/javascript",
      headers: { "cache-control": "no-store" },
      body: `(() => {
        const mode = ${JSON.stringify(mode === "empty-then-pass" ? "pass" : mode)};
        const options = [];
        let resets = 0;
        const answer = (o) => {
          if (mode === "error") return o["error-callback"]();
          const value = mode === "reject" ? "BAD.RESPONSE" : ${JSON.stringify(TURNSTILE_DUMMY_RESPONSE)};
          setTimeout(() => o.callback(value), 0);
        };
        window.__turnstile = { options, resets: () => resets };
        window.turnstile = {
          render(el, o) { options.push(o); answer(o); return "widget-" + options.length; },
          reset() { resets += 1; answer(options[options.length - 1]); },
          remove() {},
        };
      })();`,
    });
  });
  return { page, requests };
}

async function signup(page, email = "reader@example.com") {
  await page.getByLabel(/A note when something new ships/).fill(email);
  await page.getByRole("button", { name: "Notify me" }).click();
}

test("homepage renders the specimen plates and the theme toggle flips and persists", {
  timeout: 20_000,
}, async (t) => {
  const page = await localPage(t);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(baseUrl, { waitUntil: "networkidle" });

  assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1);
  assert.equal(await page.locator("article[aria-labelledby^='plate-']").count(), 8);
  assert.ok(
    await page
      .getByRole("img", { name: /Pixel art of a glossy blue toy whale/ })
      .first()
      .isVisible(),
  );
  assert.equal(await page.locator("canvas").count(), 0, "the 3D scene is gone");
  assert.equal(await page.getByRole("link", { name: "Support", exact: true }).count(), 1);
  assert.equal(
    await page
      .locator("main")
      .getByRole("heading", { name: /CodesWhat\? Anything for you/ })
      .count(),
    1,
  );

  const theme = () => page.locator("html").getAttribute("data-theme");
  const initial = await theme();
  assert.ok(initial === "light" || initial === "dark");
  const toggle = page.getByRole("button", { name: /toggle light and dark theme/i });
  await toggle.click();
  const flipped = initial === "dark" ? "light" : "dark";
  await page.waitForFunction((want) => document.documentElement.dataset.theme === want, flipped, {
    timeout: 5_000,
  });
  assert.equal(await page.evaluate(() => localStorage.getItem("theme")), flipped);
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await theme(), flipped, "the saved theme survives a reload");
  assert.deepEqual(errors, []);
});

test("the primary navigation marks Support only while its page is current", {
  timeout: 20_000,
}, async (t) => {
  const page = await localPage(t);
  await page.goto(`${baseUrl}/support`, { waitUntil: "networkidle" });
  const nav = page.getByRole("navigation", { name: "Primary" });
  const support = nav.getByRole("link", { name: "Support", exact: true });
  assert.equal(await support.getAttribute("aria-current"), "page");
  assert.equal(
    await support.evaluate((link) => getComputedStyle(link).textDecorationLine),
    "underline",
  );
  assert.equal(
    await support.evaluate((link) => getComputedStyle(link).color),
    await nav
      .getByRole("link", { name: "Specimens" })
      .evaluate((link) => getComputedStyle(link).color),
  );

  await nav.getByRole("link", { name: "Specimens" }).click();
  await page.waitForURL(`${baseUrl}/#specimens`);
  assert.equal(await nav.locator('[aria-current="page"]').count(), 0);
  await support.click();
  await page.waitForURL(`${baseUrl}/support`);
  await page.waitForFunction(
    () => document.querySelector('nav a[href="/support"]')?.getAttribute("aria-current") === "page",
  );
  await page.goBack();
  await page.waitForURL(`${baseUrl}/#specimens`);
  await page.waitForFunction(() => !document.querySelector('nav [aria-current="page"]'));
});

test("catalogue link targets and mono labels remain readable on desktop and mobile", {
  timeout: 20_000,
}, async (t) => {
  const page = await localPage(t);
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    for (const path of ["/", "/support", "/projects/sockguard"]) {
      await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
      const x = page
        .locator("footer")
        .getByRole("link", { name: "X (opens in a new tab)", exact: true });
      const targets = [x];
      if (path === "/support") targets.push(page.getByRole("link", { name: "tier", exact: true }));
      for (const target of targets) {
        const box = await target.boundingBox();
        assert.ok(
          box && box.width >= 24 && box.height >= 24,
          `${path}: link target must be at least 24px in both dimensions`,
        );
      }
      const smallLabels = await page.locator("header, main, footer").evaluateAll((regions) =>
        regions.flatMap((region) =>
          [...region.querySelectorAll("*")]
            .filter((element) => {
              const style = getComputedStyle(element);
              const box = element.getBoundingClientRect();
              return (
                box.width > 1 &&
                box.height > 1 &&
                element.textContent?.trim() &&
                style.fontFamily.includes("mono") &&
                Number.parseFloat(style.fontSize) < 12
              );
            })
            .map((element) => element.textContent.trim().slice(0, 60)),
        ),
      );
      assert.deepEqual(smallLabels, [], `${path}: mono labels must be at least 12px`);
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${path}: no horizontal overflow`,
      );
    }
  }
});

test("field notes show attributed README excerpts and leave unsourced examples absent", {
  timeout: 30_000,
}, async (t) => {
  const page = await localPage(t);
  await page.setViewportSize({ width: 390, height: 844 });
  const examples = [
    ["sockguard", "rules:"],
    ["drydock", "    environment:"],
    ["portwing", "services:"],
    ["portkey-admin-mcp", "PORTKEY_API_KEY=your_key \\"],
    ["mouthtype", "2. Open the DMG, drag Mouthtype to Applications and open it."],
    ["idlescreen", "Open idlescreen once, then select it in System Settings under Wallpaper and"],
    ["careerrat", "careerrat next          # show the next useful agent-led workflow"],
  ];
  for (const [slug, firstLine] of examples) {
    await page.goto(`${baseUrl}/projects/${slug}`, { waitUntil: "networkidle" });
    const row = page.locator("dl > div").filter({ hasText: "Specimen in use" });
    assert.equal(await row.count(), 1, `${slug}: an example belongs in the field notes`);
    const excerpt = await row.locator("pre code").textContent();
    const lines = excerpt.split("\n");
    assert.equal(lines[0], firstLine, slug);
    assert.ok(lines.length >= 3 && lines.length <= 6, `${slug}: a short excerpt`);
    const source = row.getByRole("link", { name: "Read the full README" });
    assert.match(
      await source.getAttribute("href"),
      new RegExp(
        `^https://github\\.com/CodesWhat/${slug}/blob/[a-f0-9]{40}/README\\.md#L\\d+-L\\d+$`,
      ),
    );
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `${slug}: excerpt wraps on mobile`,
    );
  }
  await page.goto(`${baseUrl}/projects/systema-machinae`, { waitUntil: "networkidle" });
  assert.equal(
    await page.getByText("Specimen in use", { exact: true }).count(),
    0,
    "Systema has no verified public README excerpt",
  );
});

test("light is the default paper when the system has no dark preference", {
  timeout: 15_000,
}, async (t) => {
  const context = await browser.newContext({ colorScheme: "light" });
  t.after(() => context.close());
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
  const dark = await browser.newContext({ colorScheme: "dark" });
  t.after(() => dark.close());
  const darkPage = await dark.newPage();
  await darkPage.goto(baseUrl, { waitUntil: "domcontentloaded" });
  assert.equal(await darkPage.locator("html").getAttribute("data-theme"), "dark");
});

test("a dark system preference still wins when storage is blocked", {
  timeout: 15_000,
}, async (t) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  t.after(() => context.close());
  await context.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    });
  });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
});

test("a project page renders its specimen and unknown slugs 404", {
  timeout: 20_000,
}, async (t) => {
  const page = await localPage(t);
  const response = await page.goto(`${baseUrl}/projects/drydock`, { waitUntil: "networkidle" });
  assert.equal(response.status(), 200);
  assert.equal(await page.getByRole("heading", { level: 1 }).innerText(), "Drydock");
  assert.ok(await page.getByText("Balaena siccata").first().isVisible());
  const missing = await fetch(`${baseUrl}/projects/not-a-project`, {
    signal: AbortSignal.timeout(5_000),
  });
  assert.equal(missing.status, 404);
});

test("support renders GitHub Sponsors first and the six tiers with validated links", {
  timeout: 20_000,
}, async (t) => {
  const page = await localPage(t);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${baseUrl}/support`, { waitUntil: "networkidle" });
  const sponsors = page.getByRole("link", { name: /Sponsor CodesWhat on GitHub/ });
  assert.equal(await sponsors.getAttribute("href"), "https://github.com/sponsors/CodesWhat");
  assert.equal(await page.locator("#tiers ul > li").count(), 6);
  const hrefs = await page
    .locator("#tiers ul a[href^='https://buy.stripe.com/']")
    .evaluateAll((links) => links.map((link) => link.href));
  assert.deepEqual(hrefs.sort(), [
    "https://buy.stripe.com/test_monthly5",
    "https://buy.stripe.com/test_once50",
  ]);
  // the insecure link is dropped and unset tiers say so
  assert.equal(await page.getByText("Opening soon", { exact: true }).count(), 4);
  assert.equal(await page.locator("a[href^='http://']").count(), 0);
  assert.deepEqual(errors, []);
});

test("support page publishes no costs and links Systema's own page", {
  timeout: 20_000,
}, async (t) => {
  const page = await localPage(t);
  await page.goto(`${baseUrl}/support`, { waitUntil: "networkidle" });
  assert.equal(await page.locator("#where-the-money-goes").count(), 0);
  assert.equal(await page.locator("#tiers").count(), 1);
  const body = await page.locator("body").innerText();
  for (const text of [
    "PLACEHOLDER",
    "Running cost",
    "$99/year",
    "$30/month",
    "costs to run",
    "What it costs",
  ]) {
    assert.equal(body.includes(text), false, text);
  }
  const systema = page.getByRole("link", { name: /its own page/ });
  assert.equal(await systema.count(), 1);
  assert.equal(await systema.getAttribute("href"), "https://systemamachinae.com/support");
  assert.equal(
    await page
      .locator('section[aria-labelledby="sup-title"]')
      .getByRole("link", { name: /its own page/ })
      .count(),
    1,
  );
});

test("the footer signup rejects an invalid address without calling the API", {
  timeout: 15_000,
}, async (t) => {
  const page = await localPage(t);
  const calls = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/subscribe")) calls.push(request.url());
  });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByLabel(/A note when something new ships/).fill("a@b");
  await page.getByRole("button", { name: "Notify me" }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "valid email address" })
    .waitFor({ timeout: 5_000 });
  assert.deepEqual(calls, []);
});

test("the signup loads Turnstile only once the form is touched, then submits its response", {
  timeout: 20_000,
}, async (t) => {
  const { page, requests } = await turnstilePage(t, "pass");
  const bodies = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/subscribe")) bodies.push(request.postDataJSON());
  });
  const violations = [];
  page.on("console", (message) => {
    if (/content security policy/i.test(message.text())) violations.push(message.text());
  });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  assert.deepEqual(requests, [], "no Cloudflare request before the form is used");

  await signup(page);
  await page.getByText("Check your inbox to find out what's next").waitFor({ timeout: 5_000 });
  assert.equal(requests.length, 1);
  assert.match(requests[0], /render=explicit/);
  assert.deepEqual(bodies, [
    { email: "reader@example.com", turnstileResponse: TURNSTILE_DUMMY_RESPONSE },
  ]);
  const options = await page.evaluate(() => window.__turnstile.options[0]);
  assert.equal(options.sitekey, TURNSTILE_TEST_SITE_KEY);
  assert.equal(options.appearance, "interaction-only");
  assert.equal(
    await page.evaluate(() => window.__turnstile.resets()),
    1,
    "a spent response is reset after the submit",
  );
  assert.deepEqual(violations, []);
});

test("a rejected verification shows an error and resets the widget for another try", {
  timeout: 20_000,
}, async (t) => {
  const { page } = await turnstilePage(t, "reject");
  const statuses = [];
  page.on("response", (response) => {
    if (response.url().includes("/api/subscribe")) statuses.push(response.status());
  });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await signup(page);
  await page.getByRole("alert").filter({ hasText: "Verification failed" }).waitFor({
    timeout: 5_000,
  });
  assert.deepEqual(statuses, [403]);
  assert.equal(await page.evaluate(() => window.__turnstile.resets()), 1);
  await page.getByRole("button", { name: "Notify me" }).click();
  await page.waitForFunction(() => window.__turnstile.resets() === 2, undefined, {
    timeout: 5_000,
  });
  assert.deepEqual(statuses, [403, 403], "the form stays usable after a failure");
});

test("a blocked or failing widget explains itself and never calls the API", {
  timeout: 20_000,
}, async (t) => {
  for (const mode of ["blocked", "error"]) {
    const { page } = await turnstilePage(t, mode);
    const calls = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/subscribe")) calls.push(request.url());
    });
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await signup(page);
    await page
      .getByRole("alert")
      .filter({ hasText: "Couldn't finish the human check" })
      .waitFor({ timeout: 5_000 });
    assert.deepEqual(calls, [], mode);
    assert.equal(await page.getByRole("button", { name: "Notify me" }).isEnabled(), true, mode);
  }
});

test("a script that loads without Turnstile does not poison the next attempt", {
  timeout: 20_000,
}, async (t) => {
  const { page, requests } = await turnstilePage(t, "empty-then-pass");
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  // Touching the form starts the first (empty) load, which fails quietly; the
  // submit must fetch the script again instead of reusing the failed load.
  await signup(page);
  await page.getByText("Check your inbox to find out what's next").waitFor({ timeout: 5_000 });
  assert.equal(requests.length, 2, "the failed load was not cached");
});

test("a stalled Turnstile script times out instead of leaving the form disabled", {
  timeout: 20_000,
}, async (t) => {
  const { page, requests } = await turnstilePage(t, "stall");
  await page.clock.install();
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await signup(page);
  await page.waitForFunction(() =>
    document.querySelector("script[src*='challenges.cloudflare.com']"),
  );
  await page.clock.fastForward(16_000);
  await page
    .getByRole("alert")
    .filter({ hasText: "Couldn't finish the human check" })
    .waitFor({ timeout: 5_000 });
  assert.equal(await page.getByRole("button", { name: "Notify me" }).isEnabled(), true);
  assert.equal(await page.locator("script[src*='challenges.cloudflare.com']").count(), 0);
  assert.equal(requests.length, 1);
});

test("a missing verification response tells the visitor to refresh", {
  timeout: 20_000,
}, async (t) => {
  const { page } = await turnstilePage(t, "pass");
  await page.route("**/api/subscribe", (route) =>
    route.fulfill({
      status: 422,
      contentType: "application/json",
      body: JSON.stringify({
        error: "Verification did not load. Refresh the page, then try again.",
      }),
    }),
  );
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await signup(page);
  await page.getByRole("alert").filter({ hasText: "Refresh the page" }).waitFor({ timeout: 5_000 });
});

test("each HTML request gets a fresh nonce that cannot be supplied by the caller", {
  timeout: 15_000,
}, async () => {
  const first = await fetch(baseUrl, {
    signal: AbortSignal.timeout(5_000),
    headers: {
      "x-nonce": "caller-supplied",
      "content-security-policy": "script-src 'nonce-caller-supplied'",
    },
  });
  const second = await fetch(baseUrl, { signal: AbortSignal.timeout(5_000) });
  const firstPolicy = first.headers.get("content-security-policy") ?? "";
  const secondPolicy = second.headers.get("content-security-policy") ?? "";
  const firstNonce = firstPolicy.match(/'nonce-([A-Za-z0-9+/_=-]+)'/)?.[1];
  const secondNonce = secondPolicy.match(/'nonce-([A-Za-z0-9+/_=-]+)'/)?.[1];
  assert.ok(firstNonce, "the response must authorize its generated inline scripts");
  assert.ok(secondNonce);
  assert.notEqual(firstNonce, secondNonce);
  assert.notEqual(firstNonce, "caller-supplied");
  const scriptPolicy = firstPolicy
    .split(";")
    .map((directive) => directive.trim())
    .find((directive) => directive.startsWith("script-src "));
  assert.equal(
    scriptPolicy,
    `script-src 'self' 'nonce-${firstNonce}' https://e.codeswhat.com https://challenges.cloudflare.com`,
  );
  assert.match(firstPolicy, /connect-src 'self' https:\/\/e\.codeswhat\.com;/);
  assert.match(firstPolicy, /frame-src https:\/\/challenges\.cloudflare\.com;/);
  for (const kept of ["object-src 'none'", "form-action 'self'", "frame-ancestors 'none'"]) {
    assert.ok(firstPolicy.includes(kept), kept);
  }
  assert.doesNotMatch(firstPolicy, /\*/);
  const html = await first.text();
  assert.ok((await second.text()).includes(`nonce="${secondNonce}"`));
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(
    ([, attributes, body]) => body && !attributes.includes('type="application/ld+json"'),
  );
  assert.ok(
    scripts.some(([, , body]) => body.includes("self.__next_f")),
    "the response must include actual Flight data",
  );
  assert.ok(scripts.some(([, attributes]) => attributes.includes('id="theme-init"')));
  for (const [, attributes] of scripts) {
    assert.ok(
      attributes.includes(`nonce="${firstNonce}"`),
      "every executable inline script must match the response nonce",
    );
  }
});

test("the rendered policy still blocks unapproved inline JavaScript", {
  timeout: 15_000,
}, async (t) => {
  const page = await localPage(t);
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  const result = await page.evaluate(async () => {
    const violation = new Promise((resolve) => {
      document.addEventListener(
        "securitypolicyviolation",
        (event) => resolve(event.effectiveDirective),
        { once: true },
      );
      setTimeout(() => resolve(null), 2_000);
    });
    const script = document.createElement("script");
    script.textContent = "window.unapprovedInlineRan = true";
    document.body.append(script);
    return { directive: await violation, ran: window.unapprovedInlineRan === true };
  });
  assert.equal(result.ran, false);
  assert.equal(result.directive, "script-src-elem");
});

test("subscription rejects nonobject and malformed bodies without calling a provider", {
  timeout: 15_000,
}, async () => {
  const bodies = ["null", "[]", '"hello"', "42", "false", "{bad json", "{}"];
  for (const [index, body] of bodies.entries()) {
    const response = await fetch(`${baseUrl}/api/subscribe`, {
      signal: AbortSignal.timeout(5_000),
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `192.0.2.${index + 1}` },
      body,
    });
    assert.equal(response.status, 400, `${body} is invalid input, not a server error`);
    assert.equal(typeof (await response.json()).error, "string");
  }
});

test("subscription requires a Turnstile response that Cloudflare accepts", {
  timeout: 15_000,
}, async () => {
  const email = "reader@example.com";
  const cases = [
    { name: "missing", body: { email }, status: 422 },
    { name: "empty", body: { email, turnstileResponse: "" }, status: 422 },
    { name: "not a string", body: { email, turnstileResponse: 7 }, status: 422 },
    { name: "refused", body: { email, turnstileResponse: "forged" }, status: 403 },
    {
      name: "accepted",
      body: { email, turnstileResponse: TURNSTILE_DUMMY_RESPONSE },
      status: 200,
    },
    {
      name: "invalid address wins over the check",
      body: { email: "not-an-email", turnstileResponse: TURNSTILE_DUMMY_RESPONSE },
      status: 400,
    },
  ];
  for (const [index, { name, body, status }] of cases.entries()) {
    const response = await fetch(`${baseUrl}/api/subscribe`, {
      signal: AbortSignal.timeout(5_000),
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `203.0.113.${index + 1}` },
      body: JSON.stringify(body),
    });
    assert.equal(response.status, status, name);
    const payload = await response.json();
    assert.equal(typeof (payload.message ?? payload.error), "string", name);
  }
});

test("subscription rejects cross-site and non-JSON requests without calling a provider", {
  timeout: 15_000,
}, async () => {
  const validBody = '{"email":"someone@example.com"}';
  const invalidBody = '{"email":"not-an-email"}';
  const sameOrigin = new URL(baseUrl).origin;
  const cases = [
    { name: "text/plain", headers: { "content-type": "text/plain" }, body: validBody, status: 415 },
    // A Uint8Array body keeps fetch from adding its default text/plain header.
    {
      name: "no content-type",
      headers: {},
      body: new TextEncoder().encode(validBody),
      status: 415,
    },
    {
      name: "json with charset",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: invalidBody,
      status: 400,
    },
    {
      name: "foreign origin",
      headers: { "content-type": "application/json", origin: "https://evil.example" },
      body: validBody,
      status: 403,
    },
    {
      name: "sec-fetch-site cross-site",
      headers: { "content-type": "application/json", "sec-fetch-site": "cross-site" },
      body: validBody,
      status: 403,
    },
    {
      name: "same-origin browser",
      headers: {
        "content-type": "application/json",
        origin: sameOrigin,
        "sec-fetch-site": "same-origin",
      },
      body: invalidBody,
      status: 400,
    },
  ];
  for (const [index, { name, headers, body, status }] of cases.entries()) {
    const response = await fetch(`${baseUrl}/api/subscribe`, {
      signal: AbortSignal.timeout(5_000),
      method: "POST",
      headers: { ...headers, "x-forwarded-for": `198.51.100.${index + 1}` },
      body,
    });
    assert.equal(response.status, status, name);
    assert.equal(typeof (await response.json()).error, "string", name);
  }
});
