/**
 * Single source of truth for CodesWhat site identity, branding, and the project
 * roster shown on the homepage. Mirrors the per-site config pattern used by the
 * shared CodesWhat shell (see the drydock apps/web shell) so the chrome stays
 * cohesive across every property.
 */

const githubOrg = "CodesWhat";

export const SITE_CONFIG = {
  /** Brand name in the header/footer/metadata. */
  name: "CodesWhat",
  /** Short tagline used in titles and OG metadata. */
  tagline: "Where curiosity meets code",
  /** Default meta / OpenGraph / description. */
  description:
    "Open-source developer tools for containers, security, and automation — Sockguard, Drydock, Portwing, and Portkey Admin MCP.",
  /** Production domain (no protocol, no trailing slash). */
  domain: "codeswhat.com",
  /** GitHub org. */
  githubOrg,
  /** Twitter/X handle. */
  twitterCreator: "@codeswhat",
  /** Twitter/X profile URL (used in JSON-LD sameAs). */
  twitterUrl: "https://x.com/codeswhat",
  /** Brand logo in /public. */
  logo: "/logos/codeswhat-logo-green.png",
  /** Maker credit. */
  author: { name: "Scott Benson", url: "https://scottbenson.dev" },
} as const;

export const GITHUB_URL = `https://github.com/${githubOrg}`;

/**
 * Site base URL. Prefers NEXT_PUBLIC_SITE_URL (Vercel/preview deploys), falls
 * back to the production domain. `||` (not `??`) so a set-but-empty env var
 * falls back too.
 */
export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || `https://${SITE_CONFIG.domain}`;

export type Project = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  status: string;
  /** hex accent used for the card rule + balloon tint reference */
  accent: string;
  /** primary link out (repo or product site) */
  href: string;
  /** mascot balloon art in /public/logos */
  balloon: string;
};

/** The project roster — real, crawlable content and the SEO/AEO backbone. */
export const PROJECTS: Project[] = [
  {
    slug: "sockguard",
    name: "Sockguard",
    tagline: "Default-deny Docker socket proxy",
    description:
      "A default-deny proxy for the Docker socket — you pick exactly which requests reach the daemon.",
    status: "Apache-2.0 · Go",
    accent: "#e8a11c",
    href: "https://github.com/CodesWhat/sockguard",
    balloon: "/logos/sockguard-balloon.png",
  },
  {
    slug: "drydock",
    name: "Drydock",
    tagline: "Container update monitoring",
    description:
      "Self-hosted update monitoring. Finds what you're running, flags outdated or exposed images, and tells you.",
    status: "AGPL-3.0 · TypeScript",
    accent: "#1f9ed6",
    href: "https://getdrydock.com",
    balloon: "/logos/drydock-balloon.png",
  },
  {
    slug: "portwing",
    name: "Portwing",
    tagline: "Remote Docker agent",
    description: "Control your Docker containers from anywhere, without exposing the daemon.",
    status: "v0.3 · Alpha",
    accent: "#a25bd6",
    href: "https://github.com/CodesWhat/portwing",
    balloon: "/logos/portwing-balloon.png",
  },
  {
    slug: "portkey-admin-mcp",
    name: "Portkey Admin MCP",
    tagline: "Portkey admin, from any MCP client",
    description:
      "A Model Context Protocol (MCP) server for the Portkey admin API — manage configs, keys, guardrails, and analytics from any MCP client.",
    status: "MCP · TypeScript",
    accent: "#6b7bd6",
    href: "https://github.com/CodesWhat/portkey-admin-mcp",
    balloon: "/logos/portkey-balloon.png",
  },
];
