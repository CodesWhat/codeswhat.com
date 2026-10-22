/**
 * Every project slug the site knows about: the roster in site-config plus
 * Systema Machinae. Kept dependency-free because the analytics sanitizer ships
 * to the browser and uses it to bound the routes and CTA ids it will report.
 */
export const PROJECT_SLUGS = [
  "sockguard",
  "drydock",
  "portwing",
  "portkey-admin-mcp",
  "mouthtype",
  "idlescreen",
  "careerrat",
  "systema-machinae",
] as const;
