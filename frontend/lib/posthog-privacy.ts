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
};

type SanitizedEvent = {
  event: "$pageview" | "cta activated" | "$web_vitals";
  properties: Record<string, string | number>;
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
  const path = sanitizeRoute(getRawPath(properties));
  return { schema_version: 1, site: "codeswhat", surface: "marketing", path } as Record<
    string,
    string | number
  >;
}

export function sanitizeEvent(input: unknown): SanitizedEvent | null {
  if (!input || typeof input !== "object") return null;
  const { event, properties } = input as EventInput;
  if (typeof event !== "string" || !properties || typeof properties !== "object") return null;

  const values = properties as Record<string, unknown>;
  const common = createCommonProperties(values);
  if (event === "$pageview") {
    return { event, properties: { ...common, $current_url: `${PRODUCTION_ORIGIN}${common.path}` } };
  }

  if (event === "cta activated") {
    const ctaId = typeof values.cta_id === "string" ? values.cta_id : "";
    const placement = typeof values.placement === "string" ? values.placement : "";
    return allowedCtaIds.has(ctaId) && allowedPlacements.has(placement)
      ? { event, properties: { ...common, cta_id: ctaId, placement } }
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
    if (Object.keys(vitalProperties).length === 0) {
      const metricName = typeof values.metric_name === "string" ? values.metric_name : "";
      const value = typeof values.value === "number" ? values.value : Number.NaN;
      if (Number.isFinite(value) && ["CLS", "FCP", "INP", "LCP"].includes(metricName)) {
        vitalProperties[`$web_vitals_${metricName}_value`] = value;
      }
    }
    return Object.keys(vitalProperties).length > 0
      ? { event, properties: { ...common, ...vitalProperties } }
      : null;
  }

  return null;
}
