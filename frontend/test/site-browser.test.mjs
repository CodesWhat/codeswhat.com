import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = fileURLToPath(new URL("..", import.meta.url));
const nextBin = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
let server;
let browser;
let baseUrl;

before(async () => {
  const denyExternalFetch = `globalThis.fetch = async () => { throw new Error("External fetch is disabled in site tests"); };`;
  server = spawn(
    process.execPath,
    [
      "--import",
      `data:text/javascript,${encodeURIComponent(denyExternalFetch)}`,
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
  assert.equal(scriptPolicy, `script-src 'self' 'nonce-${firstNonce}' https://e.codeswhat.com`);
  assert.match(firstPolicy, /connect-src 'self' https:\/\/e\.codeswhat\.com;/);
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
