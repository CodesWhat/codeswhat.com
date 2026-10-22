import posthog from "posthog-js";
import {
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

function capturePageview(url: string) {
  posthog.capture("$pageview", { path: sanitizeRoute(url) });
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

if (typeof window !== "undefined" && posthogConfig) {
  posthog.init(posthogConfig.token, {
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
    save_campaign_params: false,
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
    before_send: (event) => sanitizeEvent(event) as typeof event | null,
  });

  window.addEventListener("error", (event) => captureClientError("error", event.error));
  window.addEventListener("unhandledrejection", (event) =>
    captureClientError("unhandled_rejection", event.reason),
  );

  capturePageview(window.location.pathname);
}

export function onRouterTransitionStart(url: string) {
  if (typeof window !== "undefined" && posthogConfig) capturePageview(url);
}
