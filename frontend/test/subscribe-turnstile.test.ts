import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { POST } from "../app/api/subscribe/route.ts";

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const originalFetch = globalThis.fetch;
const touched = [
  "TURNSTILE_SECRET_KEY",
  "VERCEL_ENV",
  "NEXT_PUBLIC_SITE_URL",
  "EMAILOCTOPUS_API_KEY",
  "EMAILOCTOPUS_LIST_ID",
] as const;
const savedEnv = new Map<string, string | undefined>();

type Call = { url: string; init?: RequestInit };
let calls: Call[];
let siteverifyReply: (signal?: AbortSignal) => Promise<Response>;
let octopusReply: (init?: RequestInit) => Promise<Response>;
let counter = 0;

const OCTOPUS_KEY = "test-octopus-key";
const OCTOPUS_LIST = "test-list-id";
const GENERIC_FAILURE = "Failed to subscribe. Please try again.";
const UNAVAILABLE = "Signup is unavailable right now. Please try again later.";

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
  process.env.EMAILOCTOPUS_API_KEY = OCTOPUS_KEY;
  process.env.EMAILOCTOPUS_LIST_ID = OCTOPUS_LIST;
  calls = [];
  octopusReply = async () => json({ id: "c1" }, 201);
  siteverifyReply = async () => json({ success: true, hostname: "codeswhat.com" });
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    if (url === SITEVERIFY) return siteverifyReply(init?.signal ?? undefined);
    if (url.startsWith("https://api.emailoctopus.com/")) return octopusReply(init);
    throw new Error(`unexpected fetch ${url}`);
  }) as typeof fetch;
});

afterEach(() => {
  mock.restoreAll();
  globalThis.fetch = originalFetch;
  for (const name of touched) {
    const value = savedEnv.get(name);
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

// No client IP header: lands in the shared "unknown" bucket.
function send(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request("https://codeswhat.com/api/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    }),
  );
}

// Every call gets its own cf-connecting-ip unless the test passes one, so tests don't share a bucket.
function subscribe(body: unknown, headers: Record<string, string> = {}) {
  counter += 1;
  return send(body, {
    "cf-connecting-ip": `198.18.${(counter >> 8) & 255}.${counter & 255}`,
    ...headers,
  });
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
  const headers = { "cf-connecting-ip": "192.0.2.250" };
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
    assert.equal(response.status, 422);
    assert.equal(
      (await response.json()).error,
      "Verification did not load. Refresh the page, then try again.",
    );
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

test("a hung siteverify is cut off at the 3s deadline and fails closed", async (t) => {
  // Keep the real signal semantics but shrink the wait, and pin the production bound.
  const requested: number[] = [];
  const realTimeout = AbortSignal.timeout.bind(AbortSignal);
  t.mock.method(AbortSignal, "timeout", (ms: number) => {
    requested.push(ms);
    return realTimeout(20);
  });
  siteverifyReply = (signal) =>
    new Promise<Response>((_resolve, reject) => {
      signal?.addEventListener("abort", () => reject(signal.reason));
    });
  const response = await subscribe(good);
  assert.deepEqual(requested, [3000]);
  assert.equal(response.status, 503);
  assert.equal(octopusCalls().length, 0);
  mock.restoreAll();
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

test("production accepts the host from NEXT_PUBLIC_SITE_URL", async () => {
  process.env.VERCEL_ENV = "production";
  process.env.NEXT_PUBLIC_SITE_URL = "https://staging.example.org";
  siteverifyReply = async () => json({ success: true, hostname: "staging.example.org" });
  assert.equal((await subscribe(good)).status, 200);
});

test("a hung EmailOctopus is cut off at the 5s deadline and returns 503", async (t) => {
  const requested: number[] = [];
  const realTimeout = AbortSignal.timeout.bind(AbortSignal);
  t.mock.method(AbortSignal, "timeout", (ms: number) => {
    requested.push(ms);
    return realTimeout(20);
  });
  const inner = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    if (String(input).startsWith("https://api.emailoctopus.com/")) {
      calls.push({ url: String(input), init });
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
      });
    }
    return inner(input, init);
  }) as typeof fetch;
  const response = await subscribe(good);
  assert.deepEqual(requested, [3000, 5000]);
  assert.equal(response.status, 503);
  assert.equal(
    (await response.json()).error,
    "Signup is unavailable right now. Please try again later.",
  );
  mock.restoreAll();
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

function muteErrors(t: { mock: typeof mock }) {
  const logged: string[] = [];
  t.mock.method(console, "error", (...args: unknown[]) => {
    logged.push(args.map(String).join(" "));
  });
  return logged;
}

test("a verified signup sends the exact request EmailOctopus expects", async () => {
  const response = await subscribe({ ...good, email: "  Mixed@Example.COM " });
  assert.equal(response.status, 200);
  const [call] = octopusCalls();
  assert.equal(call.url, `https://api.emailoctopus.com/lists/${OCTOPUS_LIST}/contacts`);
  assert.equal(call.init?.method, "POST");
  const headers = new Headers(call.init?.headers);
  assert.equal(headers.get("authorization"), `Bearer ${OCTOPUS_KEY}`);
  assert.equal(headers.get("content-type"), "application/json");
  assert.deepEqual(JSON.parse(String(call.init?.body)), {
    email_address: "mixed@example.com",
    status: "pending",
  });
});

test("a 409 and an already-exists title both read as success", async (t) => {
  muteErrors(t);
  octopusReply = async () => json({ title: "Conflict" }, 409);
  const conflict = await subscribe(good);
  assert.equal(conflict.status, 200);
  assert.equal(typeof (await conflict.json()).message, "string");

  octopusReply = async () => json({ title: "Contact already exists" }, 400);
  const titled = await subscribe(good);
  assert.equal(titled.status, 200);
  assert.equal(typeof (await titled.json()).message, "string");
});

test("provider failures map to a sanitized 503 or 502", async (t) => {
  muteErrors(t);
  const cases: Array<[number, number]> = [
    [401, 503],
    [403, 503],
    [404, 503],
    [429, 503],
    [500, 503],
    [503, 503],
    [400, 502],
    [422, 502],
  ];
  for (const [upstream, expected] of cases) {
    octopusReply = async () =>
      json({ title: "Upstream title", detail: "upstream-detail", code: "UPSTREAM_CODE" }, upstream);
    const response = await subscribe(good);
    assert.equal(response.status, expected, `upstream ${upstream}`);
    assert.deepEqual(await response.json(), { error: GENERIC_FAILURE }, `upstream ${upstream}`);
  }
});

test("a provider fetch rejection or invalid JSON returns the generic 500 without leaking", async (t) => {
  const logged = muteErrors(t);
  const replies: Array<() => Promise<Response>> = [
    async () => {
      throw new TypeError("connect ECONNREFUSED internal-host.example");
    },
    async () => new Response("<html>internal-detail</html>", { status: 200 }),
  ];
  for (const reply of replies) {
    octopusReply = reply;
    const response = await subscribe(good);
    assert.equal(response.status, 500);
    const text = await response.text();
    assert.deepEqual(JSON.parse(text), {
      error: "An unexpected error occurred. Please try again.",
    });
    for (const secret of ["internal-host", "internal-detail", OCTOPUS_KEY]) {
      assert.equal(text.includes(secret), false);
    }
  }
  assert.equal(logged.join("\n").includes(OCTOPUS_KEY), false);
});

test("a missing API key or list id returns 503 before siteverify", async (t) => {
  const logged = muteErrors(t);
  for (const missing of ["EMAILOCTOPUS_API_KEY", "EMAILOCTOPUS_LIST_ID"] as const) {
    process.env.EMAILOCTOPUS_API_KEY = OCTOPUS_KEY;
    process.env.EMAILOCTOPUS_LIST_ID = OCTOPUS_LIST;
    delete process.env[missing];
    const response = await subscribe(good);
    assert.equal(response.status, 503, missing);
    assert.equal((await response.json()).error, UNAVAILABLE);
    assert.equal(siteverifyCalls().length, 0, missing);
    assert.equal(calls.length, 0, missing);
    const log = logged.at(-1) ?? "";
    assert.ok(log.includes(missing), `the log names ${missing}`);
    assert.equal(log.includes(OCTOPUS_KEY) || log.includes(OCTOPUS_LIST), false);
  }
});

test("a 254-character address is accepted and a 255-character one is rejected", async () => {
  const tail = "@example.com";
  const ok = await subscribe({ ...good, email: `${"a".repeat(254 - tail.length)}${tail}` });
  assert.equal(ok.status, 200);
  const tooLong = await subscribe({ ...good, email: `${"a".repeat(255 - tail.length)}${tail}` });
  assert.equal(tooLong.status, 400);
});

test("an uppercase disposable domain is rejected before any external call", async () => {
  const response = await subscribe({ ...good, email: "reader@MAILINATOR.COM" });
  assert.equal(response.status, 400);
  assert.equal(calls.length, 0);
});

// Rate-limit tests run on a fake clock. Each starts ten days past the last, so
// the limiter's once-per-window sweep has always come due and buckets are fresh.
let clockBase = Date.now();
function fakeClock(t: { mock: typeof mock }) {
  clockBase += 10 * 24 * 3600 * 1000;
  let now = clockBase;
  t.mock.method(Date, "now", () => now);
  return {
    advance: (ms: number) => {
      now += ms;
    },
  };
}

function captureLimiterMap(t: { mock: typeof mock }) {
  let found: Map<string, unknown> | undefined;
  const realSet = Map.prototype.set;
  t.mock.method(
    Map.prototype,
    "set",
    function (this: Map<unknown, unknown>, k: unknown, v: unknown) {
      if (typeof k === "string" && k.startsWith("rate-limit:"))
        found = this as Map<string, unknown>;
      return realSet.call(this, k, v);
    },
  );
  return () => found;
}

test("the limiter allows 5 a minute per client and resets after the window", async (t) => {
  const clock = fakeClock(t);
  const headers = { "cf-connecting-ip": "192.0.2.10" };
  for (let i = 0; i < 5; i += 1) assert.equal((await subscribe(good, headers)).status, 200);
  assert.equal((await subscribe(good, headers)).status, 429);
  clock.advance(59_000);
  assert.equal((await subscribe(good, headers)).status, 429);
  clock.advance(2_000);
  assert.equal((await subscribe(good, headers)).status, 200);
});

test("different cf-connecting-ip values get separate buckets despite the same x-forwarded-for", async (t) => {
  fakeClock(t);
  const shared = "10.1.1.1";
  const a = { "cf-connecting-ip": "192.0.2.21", "x-forwarded-for": shared };
  const b = { "cf-connecting-ip": "192.0.2.22", "x-forwarded-for": shared };
  for (let i = 0; i < 5; i += 1) assert.equal((await subscribe(good, a)).status, 200);
  assert.equal((await subscribe(good, a)).status, 429);
  assert.equal((await subscribe(good, b)).status, 200);
});

test("without cf-connecting-ip the first x-forwarded-for hop is the key", async (t) => {
  fakeClock(t);
  const a = { "x-forwarded-for": "192.0.2.31, 10.0.0.1" };
  for (let i = 0; i < 5; i += 1) assert.equal((await send(good, a)).status, 200);
  assert.equal((await send(good, a)).status, 429);
  assert.equal((await send(good, { "x-forwarded-for": "192.0.2.32" })).status, 200);
});

test("headerless requests share the unknown bucket", async (t) => {
  fakeClock(t);
  for (let i = 0; i < 5; i += 1) assert.equal((await send(good)).status, 200);
  assert.equal((await send(good)).status, 429);
  assert.equal((await send(good, { "cf-connecting-ip": "192.0.2.41" })).status, 200);
});

test("cross-site and non-JSON rejections don't use up the allowance", async (t) => {
  fakeClock(t);
  const headers = { "cf-connecting-ip": "192.0.2.51" };
  for (let i = 0; i < 6; i += 1) {
    const crossSite = await subscribe(good, { ...headers, "sec-fetch-site": "cross-site" });
    assert.equal(crossSite.status, 403);
    const notJson = await subscribe(good, { ...headers, "content-type": "text/plain" });
    assert.equal(notJson.status, 415);
  }
  for (let i = 0; i < 5; i += 1) assert.equal((await subscribe(good, headers)).status, 200);
  assert.equal((await subscribe(good, headers)).status, 429);
});

test("expired entries are swept once the window passes", async (t) => {
  const clock = fakeClock(t);
  const limiterMap = captureLimiterMap(t);
  for (let i = 0; i < 50; i += 1) await subscribe(good);
  const map = limiterMap();
  assert.ok(map, "the limiter map was captured");
  assert.equal(map.size, 50);
  clock.advance(61_000);
  await subscribe(good);
  assert.equal(map.size, 1, "the 50 expired entries are gone");
});

test("the limiter map is capped and drops the oldest client first", async (t) => {
  fakeClock(t);
  const limiterMap = captureLimiterMap(t);
  const oldest = { "cf-connecting-ip": "192.0.2.61" };
  for (let i = 0; i < 5; i += 1) await subscribe(good, oldest);
  assert.equal((await subscribe(good, oldest)).status, 429);
  for (let i = 0; i < 10_000; i += 1) await subscribe(good);
  const map = limiterMap();
  assert.ok(map);
  assert.equal(map.size, 10_000);
  assert.equal((await subscribe(good, oldest)).status, 200, "the evicted client starts fresh");
  assert.equal(map.size, 10_000);
});
