"use client";

import posthog from "posthog-js";
import type { AnchorHTMLAttributes } from "react";

type TrackedCtaLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  placement: "header" | "hero" | "footer" | "projects" | "support" | "services";
  /** Must be in ALLOWED_CTA_IDS (lib/posthog-privacy.ts) or the sanitizer drops the event. */
  ctaId?: string;
};

export function TrackedCtaLink({
  placement,
  ctaId = "github_org",
  href,
  onClick,
  ...props
}: TrackedCtaLinkProps) {
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        posthog.capture("cta activated", { cta_id: ctaId, placement });
        onClick?.(event);
      }}
    />
  );
}
