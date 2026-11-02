import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { POST } from "../app/api/subscribe/route.ts";

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const originalFetch = globalThis.fetch;
const touched = ["TURNSTILE_SECRET_KEY", "VERCEL_ENV", "NEXT_PUBLIC_SITE_URL"] as const;
const savedEnv = new Map<string, string | undefined>();

type Call = { url: string; init?: RequestInit };
let calls: Call[];
let siteverifyReply: () => Promise<Response>;
let counter = 0;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  for (const name of touched) {
    savedEnv.set(name, process.env[name]);
    delete process.env[name];
  }
  process.env.TURNSTILE_SECRET_KEY = "test-secret-value";
  calls = [];
  siteverifyReply = async () => json({ success: true, hostname: "codeswhat.com" });
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    if (url === SITEVERIFY) return siteverifyReply();
    if (url.startsWith("https://api.emailoctopus.com/")) return json({ id: "c1" }, 201);
    throw new Error(`unexpected fetch ${url}`);
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const name of touched) {
    const value = savedEnv.get(name);
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

function subscribe(body: unknown, headers: Record<string, string> = {}) {
  counter += 1;
  return POST(
    new Request("https://codeswhat.com/api/subscribe", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": `203.0.113.${counter % 250}`,
        ...headers,
      },
      body: JSON.stringify(body),
    }),
  );
}

const good = { email: "someone@example.com", turnstileResponse: "XXXX.DUMMY.TOKEN.XXXX" };
const siteverifyCalls = () => calls.filter((c) => c.url === SITEVERIFY);
const octopusCalls = () => calls.filter((c) => c.url.startsWith("https://api.emailoctopus.com/"));

test("a verified signup is forwarded to EmailOctopus as pending", async () => {
  const response = await subscribe(good, { "cf-connecting-ip": "198.51.100.7" });
  assert.equal(response.status, 200);
  assert.equal(siteverifyCalls().length, 1);
  assert.equal(octopusCalls().length, 1);
  const sent = new URLSearchParams(String(siteverifyCalls()[0].init?.body));
  assert.equal(sent.get("secret"), "test-secret-value");
  assert.equal(sent.get("response"), good.turnstileResponse);
  assert.equal(sent.get("remoteip"), "198.51.100.7");
  assert.equal(JSON.parse(String(octopusCalls()[0].init?.body)).status, "pending");
});

test("siteverify runs after email validation and before EmailOctopus", async () => {
  const bad = await subscribe({ email: "nope", turnstileResponse: "x" });
  assert.equal(bad.status, 400);
  assert.equal(calls.length, 0, "invalid input never reaches Cloudflare or the provider");
  await subscribe(good);
  assert.deepEqual(
    calls.map((c) => (c.url === SITEVERIFY ? "siteverify" : "octopus")),
    ["siteverify", "octopus"],
  );
});

test("the rate limit applies before siteverify", async () => {
  const headers = { "x-forwarded-for": "192.0.2.250" };
  for (let i = 0; i < 5; i += 1) await subscribe(good, headers);
  const before = siteverifyCalls().length;
  const limited = await subscribe(good, headers);
  assert.equal(limited.status, 429);
  assert.equal(siteverifyCalls().length, before);
});

test("a missing or malformed response value is rejected without calling anything", async () => {
  for (const body of [
    { email: good.email },
    { email: good.email, turnstileResponse: "" },
    { email: good.email, turnstileResponse: 42 },
    { email: good.email, turnstileResponse: "x".repeat(2049) },
  ]) {
    const response = await subscribe(body);
    assert.equal(response.status, 400);
    assert.equal(typeof (await response.json()).error, "string");
  }
  assert.equal(calls.length, 0);
});

test("a failed verification returns 403 and never reaches EmailOctopus", async () => {
  siteverifyReply = async () => json({ success: false, "error-codes": ["invalid-input-response"] });
  const response = await subscribe(good);
  assert.equal(response.status, 403);
  const text = JSON.stringify(await response.json());
  assert.equal(text.includes("invalid-input-response"), false, "no upstream detail is relayed");
  assert.equal(octopusCalls().length, 0);
});

test("a missing secret fails closed with 503", async () => {
  delete process.env.TURNSTILE_SECRET_KEY;
  const response = await subscribe(good);
  assert.equal(response.status, 503);
  assert.equal(calls.length, 0);
});

test("a siteverify network error, timeout or bad status fails closed with 503", async () => {
  const replies: Array<() => Promise<Response>> = [
    async () => {
      throw new TypeError("fetch failed");
    },
    async () => {
      throw new DOMException("timed out", "TimeoutError");
    },
    async () => json({ error: "boom" }, 500),
    async () => new Response("<html>", { status: 200 }),
  ];
  for (const reply of replies) {
    siteverifyReply = reply;
    const response = await subscribe(good);
    assert.equal(response.status, 503);
  }
  assert.equal(octopusCalls().length, 0);
});

test("siteverify is bounded by an abort signal", async () => {
  await subscribe(good);
  assert.ok(siteverifyCalls()[0].init?.signal instanceof AbortSignal);
});

test("production checks the hostname Cloudflare reports", async () => {
  process.env.VERCEL_ENV = "production";
  siteverifyReply = async () => json({ success: true, hostname: "evil.example" });
  assert.equal((await subscribe(good)).status, 403);
  for (const hostname of ["codeswhat.com", "www.codeswhat.com"]) {
    siteverifyReply = async () => json({ success: true, hostname });
    assert.equal((await subscribe(good)).status, 200, hostname);
  }
  siteverifyReply = async () => json({ success: true });
  assert.equal((await subscribe(good)).status, 403, "a missing hostname is not trusted");
});

test("outside production the hostname is not enforced", async () => {
  process.env.VERCEL_ENV = "preview";
  siteverifyReply = async () => json({ success: true, hostname: "codeswhat-git-x.vercel.app" });
  assert.equal((await subscribe(good)).status, 200);
});

test("the secret and the response value never reach logs or the client", async () => {
  const logged: string[] = [];
  const originalError = console.error;
  console.error = (...args: unknown[]) => logged.push(args.map(String).join(" "));
  try {
    siteverifyReply = async () => {
      throw new TypeError("fetch failed");
    };
    const response = await subscribe(good);
    const text = await response.text();
    for (const secret of ["test-secret-value", good.turnstileResponse]) {
      assert.equal(text.includes(secret), false);
      assert.equal(logged.join("\n").includes(secret), false);
    }
  } finally {
    console.error = originalError;
  }
});
