export const POSTHOG_API_HOST = "https://e.codeswhat.com";
export const POSTHOG_UI_HOST = "https://us.posthog.com";
export const PRODUCTION_ORIGIN = "https://codeswhat.com";
export const ALLOWED_ROUTES = ["/"] as const;
export const ALLOWED_CTA_IDS = ["github_org"] as const;

const OTHER_PATH = "/_other";
const PROJECT_TOKEN_PATTERN = /^phc_[A-Za-z0-9_-]+$/u;
const allowedRoutes = new Set<string>(ALLOWED_ROUTES);
const allowedCtaIds = new Set<string>(ALLOWED_CTA_IDS);
const allowedPlacements = new Set(["header", "hero", "footer"]);
const allowedVitalKeys = new Set([
  "$web_vitals_CLS_value",
  "$web_vitals_FCP_value",
  "$web_vitals_INP_value",
  "$web_vitals_LCP_value",
]);

export type PostHogEnvironment = {
  NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN?: string;
  NEXT_PUBLIC_POSTHOG_HOST?: string;
  NEXT_PUBLIC_POSTHOG_UI_HOST?: string;
};

export function getPostHogConfig(env: PostHogEnvironment) {
  const token = env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (
    typeof token !== "string" ||
    !PROJECT_TOKEN_PATTERN.test(token) ||
    env.NEXT_PUBLIC_POSTHOG_HOST !== POSTHOG_API_HOST ||
    env.NEXT_PUBLIC_POSTHOG_UI_HOST !== POSTHOG_UI_HOST
  ) {
    return null;
  }
  return { token, apiHost: POSTHOG_API_HOST, uiHost: POSTHOG_UI_HOST } as const;
}

export function sanitizeRoute(input: unknown): string {
  if (typeof input !== "string" || /^[a-z][a-z\d+.-]*:/i.test(input) || input.startsWith("//")) {
    return OTHER_PATH;
  }
  const pathname = input.split(/[?#]/, 1)[0] || "/";
  return allowedRoutes.has(pathname) ? pathname : OTHER_PATH;
}

type EventInput = {
  event?: unknown;
  properties?: unknown;
  timestamp?: unknown;
  uuid?: unknown;
};

type SanitizedEvent = {
  event: "$pageview" | "$pageleave" | "cta activated" | "$web_vitals";
  properties: Record<string, boolean | number | string>;
  timestamp?: Date;
  uuid?: string;
};

function getRawPath(properties: Record<string, unknown>): unknown {
  if (typeof properties.path === "string") return properties.path;
  if (typeof properties.$pathname === "string") return properties.$pathname;
  if (typeof properties.$current_url !== "string") return undefined;
  try {
    return new URL(properties.$current_url).pathname;
  } catch {
    return undefined;
  }
}

function createCommonProperties(properties: Record<string, unknown>) {
  const token = properties.token;
  // PostHog's cookieless server-hash ingestion step computes the anonymous
  // distinct id from day + team + $ip + $host + $raw_user_agent. It reads
  // $raw_user_agent/$host straight off event.properties (not headers) and
  // silently drops the event with a cookieless_missing_user_agent /
  // cookieless_missing_host ingestion warning if either is absent
  // (PostHog/posthog nodejs/src/ingestion/common/cookieless/cookieless-manager.ts,
  // getProperties()/doBatchInner()). posthog-js attaches both to every
  // envelope by default (PostHog/posthog-js
  // packages/browser-common/src/utils/event-utils.ts, getEventProperties()),
  // so they must survive the allowlist rebuild below. $ip is deliberately
  // NOT forwarded here: posthog-js never sends it, and PostHog's capture
  // service fills it in from the request's own connection IP when absent — a
  // client-supplied $ip would only be able to make that worse, never better.
  const rawUserAgent = properties.$raw_user_agent;
  const host = properties.$host;
  if (
    typeof token !== "string" ||
    !PROJECT_TOKEN_PATTERN.test(token) ||
    properties.$cookieless_mode !== true ||
    properties.$process_person_profile !== false ||
    typeof rawUserAgent !== "string" ||
    rawUserAgent === "" ||
    typeof host !== "string" ||
    host === ""
  ) {
    return null;
  }

  const path = sanitizeRoute(getRawPath(properties));
  const common: Record<string, boolean | number | string> = {
    token,
    $cookieless_mode: true,
    $process_person_profile: false,
    schema_version: 1,
    site: "codeswhat",
    surface: "marketing",
    path,
    $raw_user_agent: rawUserAgent,
    $host: host,
  };
  if (properties.distinct_id === "$posthog_cookieless") {
    common.distinct_id = "$posthog_cookieless";
  }
  return common;
}

function createSanitizedEvent(
  input: EventInput,
  event: SanitizedEvent["event"],
  properties: SanitizedEvent["properties"],
): SanitizedEvent {
  const result: SanitizedEvent = { event, properties };
  if (typeof input.uuid === "string") result.uuid = input.uuid;
  if (input.timestamp instanceof Date && Number.isFinite(input.timestamp.getTime())) {
    result.timestamp = input.timestamp;
  }
  return result;
}

export function sanitizeEvent(input: unknown): SanitizedEvent | null {
  if (!input || typeof input !== "object") return null;
  const eventInput = input as EventInput;
  const { event, properties } = eventInput;
  if (typeof event !== "string" || !properties || typeof properties !== "object") return null;

  const values = properties as Record<string, unknown>;
  const common = createCommonProperties(values);
  if (common === null) return null;
  // posthog-js emits $pageleave itself once capture_pageleave is true;
  // nothing in this codebase calls it directly. It has to be rebuilt here
  // like every other envelope — before this branch existed, $pageleave fell
  // through to the `return null` below and was dropped silently, which is
  // why flipping capture_pageleave on the init options alone fixes nothing.
  // $pathname is set to the already-sanitized `path` rather than the raw
  // pathname so PostHog's Web analytics Page / Entry page / Exit page
  // tables — which key off $pathname — resolve without leaking any route
  // outside ALLOWED_ROUTES.
  if (event === "$pageview" || event === "$pageleave") {
    return createSanitizedEvent(eventInput, event, {
      ...common,
      $current_url: `${PRODUCTION_ORIGIN}${common.path}`,
      $pathname: common.path,
    });
  }

  if (event === "cta activated") {
    const ctaId = typeof values.cta_id === "string" ? values.cta_id : "";
    const placement = typeof values.placement === "string" ? values.placement : "";
    return allowedCtaIds.has(ctaId) && allowedPlacements.has(placement)
      ? createSanitizedEvent(eventInput, event, { ...common, cta_id: ctaId, placement })
      : null;
  }

  if (event === "$web_vitals") {
    const vitalProperties: Record<string, number> = {};
    for (const key of allowedVitalKeys) {
      const value = values[key];
      if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
        vitalProperties[key] = value;
      }
    }
    return Object.keys(vitalProperties).length > 0
      ? createSanitizedEvent(eventInput, event, { ...common, ...vitalProperties })
      : null;
  }

  return null;
}
