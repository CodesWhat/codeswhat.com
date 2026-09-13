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

test("production page hydrates its theme control and mounts the canvas", {
  timeout: 20_000,
}, async (t) => {
  const page = await localPage(t);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  assert.equal(await page.locator("html").getAttribute("class"), "dark");
  await page.getByRole("button", { name: "Toggle light and dark theme" }).click();
  await page.waitForFunction(
    () => !document.documentElement.classList.contains("dark"),
    undefined,
    { timeout: 5_000 },
  );
  await page.waitForFunction(
    () => {
      const canvas = document.querySelector("canvas");
      return canvas && canvas.width > 0 && canvas.height > 0;
    },
    undefined,
    { timeout: 5_000 },
  );
  assert.deepEqual(errors, []);
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
