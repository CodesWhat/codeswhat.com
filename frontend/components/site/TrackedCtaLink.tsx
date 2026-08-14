"use client";

import posthog from "posthog-js";
import type { AnchorHTMLAttributes } from "react";

type TrackedCtaLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  placement: "header" | "hero" | "footer";
};

export function TrackedCtaLink({ placement, onClick, ...props }: TrackedCtaLinkProps) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: this link records an allowlisted outbound CTA.
    <a
      {...props}
      // biome-ignore lint/a11y/useValidAnchor: this remains an anchor for native link behavior.
      onClick={(event) => {
        posthog.capture("cta activated", { cta_id: "github_org", placement });
        onClick?.(event);
      }}
    />
  );
}
