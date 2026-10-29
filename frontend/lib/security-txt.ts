import { BASE_URL } from "./site-config.ts";

const VALID_DAYS = 180;

/** RFC 9116 security.txt. Expires must stay under a year out (section 2.5.5). */
export function buildSecurityTxt(now: Date = new Date()): string {
  const expires = new Date(now.getTime() + VALID_DAYS * 86_400_000).toISOString();
  return `${[
    "Contact: mailto:security@codeswhat.com",
    `Expires: ${expires}`,
    "Preferred-Languages: en",
    `Canonical: ${BASE_URL}/.well-known/security.txt`,
    "Policy: https://github.com/CodesWhat/.github/blob/main/SECURITY.md",
  ].join("\n")}\n`;
}
