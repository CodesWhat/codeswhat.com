import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

let baseUrl = process.env.POSTHOG_BROWSER_BASE_URL;
let server;

before(async () => {
  if (baseUrl) return;
  const root = fileURLToPath(new URL("..", import.meta.url));
  const nextBin = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
  server = spawn(process.execPath, [nextBin, "start", "--hostname", "127.0.0.1", "--port", "0"], {
    cwd: root,
    env: { ...process.env, NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
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
});

after(async () => {
  if (!server || server.exitCode !== null || server.signalCode !== null) return;
  await new Promise((resolve) => {
    const force = setTimeout(() => server.kill("SIGKILL"), 5_000);
    server.once("exit", () => {
      clearTimeout(force);
      resolve();
    });
    server.kill("SIGTERM");
  });
});

test("production browser response keeps PostHog on the exact proxy", async () => {
  const response = await fetch(`${baseUrl}/?query-secret=should-not-leave`, {
    signal: AbortSignal.timeout(15_000),
  });
  const body = await response.text();
  const csp = response.headers.get("content-security-policy") ?? "";

  assert.equal(response.status, 200);
  assert.match(csp, /script-src[^;]*https:\/\/e\.codeswhat\.com/);
  assert.match(csp, /connect-src[^;]*https:\/\/e\.codeswhat\.com/);
  assert.doesNotMatch(csp, /\*\.posthog\.com|https:\/\/(app|us)\.posthog\.com/);
  // The page is prerendered at build time, so shared caching is safe only because the
  // HTML cannot reflect anything from the request, query string included.
  assert.match(response.headers.get("x-nextjs-prerender") ?? "", /^1\b/);
  assert.doesNotMatch(body, /query-secret/);
  assert.match(body, /<script\b[^>]*\bid="theme-init"/);
});
