"use client";

import type { AnchorHTMLAttributes } from "react";
import { TrackedCtaLink } from "@/components/catalogue/TrackedCtaLink";

type SupportLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  /** fixed analytics vocabulary id, e.g. sponsors_github or support_monthly-5 */
  ctaId: string;
};

/**
 * A support or funding link. Fires `cta activated` with a fixed cta_id and the
 * support placement only; the href never reaches analytics.
 */
export function SupportLink({ ctaId, ...props }: SupportLinkProps) {
  return <TrackedCtaLink ctaId={ctaId} placement="support" {...props} />;
}
