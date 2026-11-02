import { NextResponse } from "next/server";

// Best-effort, per-instance in-memory limit; not effective across serverless instances, a real limit needs an edge rule.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(request: Request): string {
  // Get IP from headers (works with Vercel)
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `rate-limit:${ip}`;
}

function checkRateLimit(key: string, limit = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  // Clean up old entries
  if (record && now > record.resetTime) {
    rateLimitMap.delete(key);
  }

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const SITEVERIFY_TIMEOUT_MS = 5000;
// Cloudflare documents 2048 characters as the longest response value.
const MAX_CHALLENGE_RESPONSE_LENGTH = 2048;

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

    // Block disposable email domains (using Set for O(1) lookup performance)
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
    const challengeResponse = "turnstileResponse" in body ? body.turnstileResponse : undefined;
    if (
      typeof challengeResponse !== "string" ||
      challengeResponse.length === 0 ||
      challengeResponse.length > MAX_CHALLENGE_RESPONSE_LENGTH
    ) {
      return NextResponse.json(
        { error: "Please complete the verification and try again." },
        { status: 400 },
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
    const response = await fetch(
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
      },
    );

    const data = await response.json();

    // Handle EmailOctopus API responses
    if (!response.ok) {
      // Check for duplicate subscriber error
      if (response.status === 409 || data.title?.includes("already exists")) {
        return NextResponse.json(
          { message: "Hey, you're already on the list! 🎉 No FOMO here." },
          { status: 200 },
        );
      }

      // Handle other errors. Log the upstream detail server-side only; never
      // pass a third-party response field through to the client.
      console.error("EmailOctopus error:", data);
      return NextResponse.json(
        { error: "Failed to subscribe. Please try again." },
        { status: response.status },
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
