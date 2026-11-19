import { NextResponse } from "next/server";

// Best-effort, per-instance in-memory limit; not effective across serverless instances, a real limit needs an edge rule.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000;
// Keys are per client, so the map is bounded: expired entries are swept at most
// once per window, and the oldest entries are dropped past the cap.
const RATE_LIMIT_MAX_ENTRIES = 10000;
let lastSweep = 0;

function getRateLimitKey(request: Request): string {
  return `rate-limit:${getClientIp(request) ?? "unknown"}`;
}

function checkRateLimit(key: string, limit = 5, windowMs = RATE_LIMIT_WINDOW_MS): boolean {
  const now = Date.now();

  if (now - lastSweep >= windowMs) {
    lastSweep = now;
    for (const [entryKey, entry] of rateLimitMap) {
      if (now > entry.resetTime) rateLimitMap.delete(entryKey);
    }
  }

  const record = rateLimitMap.get(key);
  if (!record || now > record.resetTime) {
    // Re-insert so Map order stays oldest-first for the cap below.
    rateLimitMap.delete(key);
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    while (rateLimitMap.size > RATE_LIMIT_MAX_ENTRIES) {
      const oldest = rateLimitMap.keys().next().value;
      if (oldest === undefined) break;
      rateLimitMap.delete(oldest);
    }
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
// The route runs with maxDuration 10 (vercel.json). These two deadlines add up to 8s,
// which leaves room to respond instead of being killed by the platform.
const SITEVERIFY_TIMEOUT_MS = 3000;
const EMAILOCTOPUS_TIMEOUT_MS = 5000;
// Cloudflare documents 2048 characters as the longest response value.
const MAX_CHALLENGE_RESPONSE_LENGTH = 2048;

// Block disposable email domains (Set for O(1) lookup).
const disposableDomains = new Set([
  // Common disposable email services
  "tempmail.com",
  "temp-mail.org",
  "temp-mail.io",
  "tempmail.net",
  "throwaway.email",
  "throwawaymail.com",
  "10minutemail.com",
  "10minutemail.net",
  "10minute-mail.com",
  "10minemail.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamail.de",
  "mailinator.com",
  "mailinator.net",
  "mailinator2.com",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "trashmail.com",
  "trashmails.com",
  "trashmail.net",
  "trashmail.ws",
  "maildrop.cc",
  "maildrop.cf",
  "maildrop.ga",
  "maildrop.gq",
  "maildrop.ml",
  "dispostable.com",
  "disposemail.com",
  "disposableemailaddresses.com",
  "sharklasers.com",
  "spam4.me",
  "spambox.us",
  "spamgourmet.com",
  "fakeinbox.com",
  "fakemailgenerator.com",
  "emailondeck.com",
  "getnada.com",
  "inboxkitten.com",
  "mailcatch.com",
  "mailnesia.com",
  "mytemp.email",
  "nwldx.com",
  "thisisnotmyrealemail.com",
  // Additional common ones
  "anonbox.net",
  "binkmail.com",
  "bobmail.info",
  "bugmenot.com",
  "bumpymail.com",
  "burnermail.io",
  "chogmail.com",
  "dingbone.com",
  "emaildienst.de",
  "emailsensei.com",
  "emailtemporario.com.br",
  "fakemail.fr",
  "fornow.id",
  "getairmail.com",
  "gmailnator.com",
  "jetable.org",
  "jourrapide.com",
  "kasmail.com",
  "keemail.me",
  "mailforspam.com",
  "mailfree.ga",
  "mailmetrash.com",
  "mailmoat.com",
  "mailnull.com",
  "mailslapping.com",
  "mailzilla.com",
  "mjukglass.nu",
  "moakt.com",
  "mohmal.com",
  "noclickemail.com",
  "nomail.xl.cx",
  "nospam4.us",
  "poofy.org",
  "pookmail.com",
  "privacy.net",
  "quickinbox.com",
  "receiveee.com",
  "rtrtr.com",
  "sbmail.top",
  "slipry.net",
  "spam.la",
  "spamavert.com",
  "spambob.net",
  "spambob.org",
  "spambog.com",
  "supergreatmail.com",
  "teleworm.us",
  "tmailinator.com",
  "tmail.com",
  "uggsrock.com",
  "upliftnow.com",
  "viditag.com",
  "viewcastmedia.com",
  "wegwerfmail.de",
]);

type Verification = "passed" | "rejected" | "unavailable";

function allowedChallengeHosts(): Set<string> {
  const hosts = new Set(["codeswhat.com", "www.codeswhat.com"]);
  try {
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      hosts.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname.toLowerCase());
    }
  } catch {
    // An unparsable override leaves only the fixed production hosts.
  }
  return hosts;
}

function getClientIp(request: Request): string | null {
  const direct = request.headers.get("cf-connecting-ip")?.trim();
  if (direct) return direct;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0].trim();
  return forwarded || null;
}

// Fails closed: anything other than a clean "success" from Cloudflare is not a pass.
async function verifyChallenge(
  secret: string,
  response: string,
  ip: string | null,
): Promise<Verification> {
  const form = new URLSearchParams({ secret, response });
  if (ip) form.set("remoteip", ip);
  try {
    const result = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      signal: AbortSignal.timeout(SITEVERIFY_TIMEOUT_MS),
    });
    if (!result.ok) return "unavailable";
    const data: unknown = await result.json();
    if (data === null || typeof data !== "object") return "unavailable";
    const outcome = data as { success?: unknown; hostname?: unknown };
    if (outcome.success !== true) return "rejected";
    // Preview deployments sit on their own hostnames, so only production pins it.
    if (process.env.VERCEL_ENV === "production") {
      const hostname = typeof outcome.hostname === "string" ? outcome.hostname.toLowerCase() : "";
      if (!allowedChallengeHosts().has(hostname)) return "rejected";
    }
    return "passed";
  } catch {
    return "unavailable";
  }
}

function isCrossSite(request: Request): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return true;
  }
  const origin = request.headers.get("origin");
  if (origin === null) {
    return false;
  }
  try {
    // Host header first: request.url can carry a rewritten hostname behind the server.
    const host = request.headers.get("host") ?? new URL(request.url).host;
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

export async function POST(request: Request) {
  try {
    // Same-origin JSON only, checked before the rate limit so rejected
    // cross-site traffic doesn't use up a visitor's allowance.
    if (isCrossSite(request)) {
      return NextResponse.json({ error: "Cross-site requests are not allowed" }, { status: 403 });
    }
    const mediaType = (request.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (mediaType !== "application/json") {
      return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 415 });
    }

    // Rate limiting check
    const rateLimitKey = getRateLimitKey(request);
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
    }

    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
    }

    const email = "email" in body ? body.email : undefined;

    // Input validation
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Length check (prevent extremely long inputs)
    if (normalizedEmail.length > 254) {
      // RFC 5321 max email length
      return NextResponse.json({ error: "Email address is too long" }, { status: 400 });
    }

    // Enhanced email validation (RFC-compliant)
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    const domain = normalizedEmail.split("@")[1].toLowerCase();
    if (disposableDomains.has(domain)) {
      return NextResponse.json({ error: "Please use a permanent email address" }, { status: 400 });
    }

    // Human check, after the cheap validation and the rate limit so floods
    // and bad input never reach Cloudflare. Nothing below runs without a pass.
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      console.error("Subscription unavailable: TURNSTILE_SECRET_KEY is not set");
      return NextResponse.json(
        { error: "Signup is unavailable right now. Please try again later." },
        { status: 503 },
      );
    }
    const missingProviderConfig = ["EMAILOCTOPUS_API_KEY", "EMAILOCTOPUS_LIST_ID"].filter(
      (name) => !process.env[name],
    );
    if (missingProviderConfig.length > 0) {
      console.error(`Subscription unavailable: ${missingProviderConfig.join(", ")} is not set`);
      return NextResponse.json(
        { error: "Signup is unavailable right now. Please try again later." },
        { status: 503 },
      );
    }
    const challengeResponse = "turnstileResponse" in body ? body.turnstileResponse : undefined;
    if (
      typeof challengeResponse !== "string" ||
      challengeResponse.length === 0 ||
      challengeResponse.length > MAX_CHALLENGE_RESPONSE_LENGTH
    ) {
      // 422, not 400, so a tab left open across a deploy can tell it needs a reload.
      return NextResponse.json(
        { error: "Verification did not load. Refresh the page, then try again." },
        { status: 422 },
      );
    }
    const verification = await verifyChallenge(secret, challengeResponse, getClientIp(request));
    if (verification === "unavailable") {
      console.error("Subscription unavailable: Turnstile verification could not complete");
      return NextResponse.json(
        { error: "Signup is unavailable right now. Please try again later." },
        { status: 503 },
      );
    }
    if (verification === "rejected") {
      return NextResponse.json(
        { error: "Verification failed. Please try again." },
        { status: 403 },
      );
    }

    // EmailOctopus API v2 endpoint
    let response: Response;
    let data: { title?: string } | null;
    try {
      response = await fetch(
        `https://api.emailoctopus.com/lists/${process.env.EMAILOCTOPUS_LIST_ID}/contacts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.EMAILOCTOPUS_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email_address: normalizedEmail,
            // Double opt-in: EmailOctopus holds the contact as pending until the
            // confirmation link is clicked, so nobody can subscribe someone else.
            status: "pending",
          }),
          signal: AbortSignal.timeout(EMAILOCTOPUS_TIMEOUT_MS),
        },
      );
      // An error body is best effort: a gateway error can come back as HTML or
      // empty, and the status alone decides the mapping below. A success body
      // stays strict.
      data = response.ok ? await response.json() : await response.json().catch(() => null);
    } catch (error) {
      if (error instanceof DOMException && ["TimeoutError", "AbortError"].includes(error.name)) {
        // A retry is safe: a duplicate comes back as success.
        console.error("Subscription unavailable: EmailOctopus did not respond in time");
        return NextResponse.json(
          { error: "Signup is unavailable right now. Please try again later." },
          { status: 503 },
        );
      }
      throw error;
    }

    // Handle EmailOctopus API responses
    if (!response.ok) {
      // Check for duplicate subscriber error
      if (response.status === 409 || data?.title?.includes("already exists")) {
        return NextResponse.json(
          { message: "Hey, you're already on the list! 🎉 No FOMO here." },
          { status: 200 },
        );
      }

      // Handle other errors. Log the upstream detail server-side only; never
      // pass a third-party response field through to the client.
      console.error("EmailOctopus error:", data);
      const unavailable = response.status >= 500 || [401, 403, 404, 429].includes(response.status);
      return NextResponse.json(
        { error: "Failed to subscribe. Please try again." },
        { status: unavailable ? 503 : 502 },
      );
    }

    // Success!
    return NextResponse.json(
      { message: "What's next? Check your inbox to find out 👀" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
