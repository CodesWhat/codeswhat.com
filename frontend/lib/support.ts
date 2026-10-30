/**
 * Support tiers for the /support page. A fixed table of tiers, payment links
 * supplied at runtime through one env var, and a validator so a bad value can
 * never become a broken or hostile href. No site code talks to Stripe; the
 * visitor follows a Stripe-hosted Payment Link.
 */

export type Tier = {
  /** stable id, also the key in CODESWHAT_SUPPORT_LINKS */
  id: string;
  name: string;
  /** whole USD, no cents */
  price: number;
  cadence: "once" | "monthly";
  /** one honest sentence on what the money pays for */
  buys: string;
  /** Stripe Payment Link from CODESWHAT_SUPPORT_LINKS, or null when unset */
  link: string | null;
};

/** Mirrors the GitHub Sponsors tiers and the Stripe Payment Links. Links come only from env. */
export const TIERS: readonly Tier[] = [
  {
    id: "monthly-5",
    name: "Keep the lights on",
    price: 5,
    cadence: "monthly",
    buys: "Keeps the lights on: hosting, domains and CI across every CodesWhat project. Your name goes on the supporters list.",
    link: null,
  },
  {
    id: "monthly-10",
    name: "README supporter",
    price: 10,
    cadence: "monthly",
    buys: "Your name in the supporters section of the README for the CodesWhat project you use.",
    link: null,
  },
  {
    id: "monthly-25",
    name: "Team sponsor",
    price: 25,
    cadence: "monthly",
    buys: "For small teams. Your logo in the README of the CodesWhat project you use.",
    link: null,
  },
  {
    id: "monthly-100",
    name: "Company sponsor",
    price: 100,
    cadence: "monthly",
    buys: "For companies running CodesWhat tools in production. Your logo on codeswhat.com and in every project README.",
    link: null,
  },
  {
    id: "once-10",
    name: "One-off thanks",
    price: 10,
    cadence: "once",
    buys: "A one-time thank you, credited in the next release notes.",
    link: null,
  },
  {
    id: "once-50",
    name: "One-off supporter",
    price: 50,
    cadence: "once",
    buys: "A one-time gift, credited in the next release notes and on the supporters list.",
    link: null,
  },
];

/** Systema Machinae, shown separately; it runs its own /support page. */
export const SYSTEMA = {
  name: "Systema Machinae",
  supportUrl: "https://systemamachinae.com/support",
} as const;

export const GITHUB_SPONSORS_URL = "https://github.com/sponsors/CodesWhat";

const STRIPE_HOSTS = new Set(["buy.stripe.com", "donate.stripe.com"]);

/** True only for an https Stripe Payment Link with a real path and no credentials. */
export function validLink(value: unknown): value is string {
  if (typeof value !== "string") return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return (
    url.protocol === "https:" &&
    STRIPE_HOSTS.has(url.hostname) &&
    url.username === "" &&
    url.password === "" &&
    url.pathname.length > 1
  );
}

/**
 * Parses the CODESWHAT_SUPPORT_LINKS env value (a JSON object of tier id to
 * URL). Unknown ids and invalid links are dropped and reported through warn;
 * bad JSON or a non-object yields an empty map.
 */
export function supportLinksFrom(
  raw: string | undefined,
  warn: (message: string) => void = () => {},
): Record<string, string> {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    warn("CODESWHAT_SUPPORT_LINKS is not valid JSON; ignoring it");
    return {};
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    warn("CODESWHAT_SUPPORT_LINKS must be a JSON object of tier id to URL; ignoring it");
    return {};
  }
  const known = new Set(TIERS.map((tier) => tier.id));
  const links: Record<string, string> = {};
  for (const [id, link] of Object.entries(parsed)) {
    if (!known.has(id)) {
      warn(`CODESWHAT_SUPPORT_LINKS has unknown tier id "${id}"; dropping it`);
    } else if (!validLink(link)) {
      warn(`CODESWHAT_SUPPORT_LINKS has an invalid link for "${id}"; dropping it`);
    } else {
      links[id] = link;
    }
  }
  return links;
}

/** The tier table with links merged in; anything invalid becomes null. */
export function tiersWith(links: Record<string, unknown>): Tier[] {
  return TIERS.map((tier) => {
    const link = links[tier.id];
    return { ...tier, link: validLink(link) ? link : null };
  });
}

/** Fixed analytics vocabulary id for a tier's support click (hyphens match project_ ids). */
export function supportCtaId(tier: Pick<Tier, "id">): `support_${string}` {
  return `support_${tier.id}`;
}
