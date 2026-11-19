import { AnalyticsExtensions } from "posthog-js/dist/extension-bundles";
import posthog from "posthog-js/dist/module.slim";
import {
  browserRequestsNoTracking,
  classifyClientErrorName,
  getPostHogConfig,
  sanitizeEvent,
  sanitizeRoute,
} from "./lib/posthog-privacy";

const posthogConfig = getPostHogConfig({
  NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  NEXT_PUBLIC_POSTHOG_UI_HOST: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST,
});

// Computed once. posthog-js treats cookieless_mode "always" as capturing before
// it checks respect_dnt, so DNT and GPC visitors never get posthog.init at all.
const trackingOptedOut =
  typeof window !== "undefined" && browserRequestsNoTracking(window.navigator, window);

function capturePageview(url: string) {
  posthog.capture("$pageview", { path: sanitizeRoute(url) });
}

// Next passes a relative href for Link clicks and an absolute window.location.href
// for back/forward. Resolve either against the current page; only a same-origin
// pathname (never the query or hash) is handed on, anything else is /_other.
function resolveTransition(url: string) {
  try {
    const destination = new URL(url, window.location.href);
    if (destination.origin !== window.location.origin) return { path: "/_other", same: false };
    const here = window.location;
    return {
      path: sanitizeRoute(destination.pathname),
      same: destination.pathname === here.pathname && destination.search === here.search,
    };
  } catch {
    return { path: "/_other", same: false };
  }
}

const MAX_CLIENT_ERRORS_PER_PAGE_LOAD = 5;
let clientErrorCount = 0;

// Only a bounded kind, an allowlisted constructor name and the sanitized route
// leave the page. No message, stack, filename or URL is ever read.
function captureClientError(errorKind: "error" | "unhandled_rejection", cause: unknown) {
  if (clientErrorCount >= MAX_CLIENT_ERRORS_PER_PAGE_LOAD) return;
  clientErrorCount += 1;
  posthog.capture("client error", {
    error_kind: errorKind,
    error_name: classifyClientErrorName(cause),
    path: sanitizeRoute(window.location.pathname),
  });
}

if (typeof window !== "undefined" && posthogConfig && !trackingOptedOut) {
  posthog.init(posthogConfig.token, {
    // The slim build ships no extensions. Web vitals is the only one this config uses.
    __extensionClasses: { webVitalsAutocapture: AnalyticsExtensions.webVitalsAutocapture },
    api_host: posthogConfig.apiHost,
    ui_host: posthogConfig.uiHost,
    capture_pageview: false,
    // posthog-js only emits $pageleave when capture_pageleave === true, or
    // when it's "if_capture_pageview" AND capture_pageview is enabled
    // (posthog-js posthog-core.ts, _shouldCapturePageleave). capture_pageview
    // is false here because pageviews are captured by hand above, so this has
    // to be an explicit true rather than the default. sanitizeEvent in
    // lib/posthog-privacy.ts rebuilds $pageleave the same way it rebuilds
    // $pageview; without that branch flipping this alone would drop every
    // $pageleave silently.
    capture_pageleave: true,
    autocapture: false,
    rageclick: false,
    disable_session_recording: true,
    capture_heatmaps: false,
    capture_dead_clicks: false,
    capture_exceptions: false,
    disable_surveys: true,
    disable_surveys_automatic_display: true,
    disable_product_tours: true,
    disable_web_experiments: true,
    advanced_disable_flags: true,
    person_profiles: "never",
    cookieless_mode: "always",
    persistence: "memory",
    disable_persistence: true,
    respect_dnt: true,
    save_referrer: true,
    // Campaign labels only: the sanitizer forwards utm_source/medium/campaign
    // through a bounded vocabulary, and masking drops the per-click ids
    // (gclid, fbclid, msclkid and the rest of PERSONAL_DATA_CAMPAIGN_PARAMS).
    save_campaign_params: true,
    mask_personal_data_properties: true,
    disable_capture_url_hashes: true,
    disable_scroll_properties: true,
    mask_all_element_attributes: true,
    mask_all_text: true,
    capture_performance: {
      network_timing: false,
      web_vitals: true,
      web_vitals_allowed_metrics: ["CLS", "FCP", "INP", "LCP"],
      web_vitals_attribution: false,
    },
    before_send: (event) =>
      browserRequestsNoTracking(window.navigator, window)
        ? null
        : (sanitizeEvent(event) as typeof event | null),
  });

  window.addEventListener("error", (event) => captureClientError("error", event.error));
  window.addEventListener("unhandledrejection", (event) =>
    captureClientError("unhandled_rejection", event.reason),
  );

  capturePageview(window.location.pathname);
}

export function onRouterTransitionStart(url: string, navigationType?: string) {
  if (typeof window !== "undefined" && posthogConfig && !trackingOptedOut) {
    const { path, same } = resolveTransition(url);
    // Hash-only and same-page push/replace are not new pageviews. Traverse is
    // always one: location already holds the destination during popstate.
    if (navigationType !== "traverse" && same) return;
    posthog.capture("$pageview", { path });
  }
}
