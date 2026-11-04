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
  assert.match(
    response.headers.get("cache-control") ?? "",
    /\b(private|no-store)\b/,
    "HTML reflects request data (Next.js flight payload), which is only safe if the page isn't shared-cached",
  );
  // Next.js inlines router state, including the request's own query, in
  // self.__next_f.push(...) scripts. Only scripts whose body starts with that
  // call are excluded; everything else must not reflect the query.
  const flightCall =
    /^\(self\.__next_f\s*=\s*self\.__next_f\s*\|\|\s*\[\]\)\.push\(|^self\.__next_f\.push\(/;
  let flightScripts = 0;
  const withoutFlightData = body.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/g, (block, inner) => {
    if (!flightCall.test(inner.trim())) return block;
    flightScripts += 1;
    return "";
  });
  assert.ok(
    flightScripts > 0,
    "expected Next.js Flight scripts in the HTML; the reflection exclusion is only valid when they exist",
  );
  assert.doesNotMatch(withoutFlightData, /query-secret/);
  assert.match(body, /<script\b[^>]*\bid="theme-init"/);
});
