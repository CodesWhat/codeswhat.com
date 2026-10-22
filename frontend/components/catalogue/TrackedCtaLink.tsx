"use client";

import posthog from "posthog-js";
import type { AnchorHTMLAttributes } from "react";

type TrackedCtaLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  placement: "header" | "hero" | "footer" | "projects" | "support";
  /** Must be in ALLOWED_CTA_IDS (lib/posthog-privacy.ts) or the sanitizer drops the event. */
  ctaId?: string;
};

export function TrackedCtaLink({
  placement,
  ctaId = "github_org",
  onClick,
  ...props
}: TrackedCtaLinkProps) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: this link records an allowlisted outbound CTA.
    <a
      {...props}
      // biome-ignore lint/a11y/useValidAnchor: this remains an anchor for native link behavior.
      onClick={(event) => {
        posthog.capture("cta activated", { cta_id: ctaId, placement });
        onClick?.(event);
      }}
    />
  );
}
