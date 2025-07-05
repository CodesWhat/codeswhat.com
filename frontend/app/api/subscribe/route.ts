import { NextResponse } from "next/server";

// Simple in-memory rate limiting (consider Redis for production)
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

export async function POST(request: Request) {
  try {
    // Rate limiting check
    const rateLimitKey = getRateLimitKey(request);
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
    }

    const { email } = body;

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
      /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
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
          status: "subscribed",
        }),
      }
    );

    const data = await response.json();

    // Handle EmailOctopus API responses
    if (!response.ok) {
      // Check for duplicate subscriber error
      if (response.status === 409 || data.title?.includes("already exists")) {
        return NextResponse.json(
          { message: "You're already subscribed! Check your inbox for updates." },
          { status: 200 }
        );
      }

      // Handle other errors
      console.error("EmailOctopus error:", data);
      return NextResponse.json(
        { error: data.detail || "Failed to subscribe. Please try again." },
        { status: response.status }
      );
    }

    // Success!
    return NextResponse.json(
      { message: "Welcome aboard! Check your inbox for updates." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
