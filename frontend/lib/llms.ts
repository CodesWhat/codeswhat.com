import { BASE_URL, SITE_CONFIG } from "./site-config.ts";
import { SPECIMENS } from "./specimens.ts";

/** llmstxt.org index, built from the project roster so it can't drift. */
export function buildLlmsTxt(): string {
  const projects = SPECIMENS.map((s) =>
    [
      `- [${s.name}](${s.site ?? `${BASE_URL}/projects/${s.slug}`}): ${s.about} ${s.comingSoon ? "Coming soon. " : ""}${s.license}, ${s.language}.`,
      `  - Field notes: ${BASE_URL}/projects/${s.slug}`,
      ...(s.repo ? [`  - Repository: ${s.repo}`] : []),
      ...(s.docs ? [`  - Docs: ${s.docs}`] : []),
    ].join("\n"),
  );

  return `${[
    "# CodesWhat",
    `> ${SITE_CONFIG.description}`,
    "CodesWhat is Scott Benson building tools, apps and games with a crew of coding agents. Released projects link to their own sites; upcoming projects are marked coming soon. codeswhat.com has field notes for each.",
    `## Projects\n\n${projects.join("\n")}`,
    `## Optional\n\n- [Support CodesWhat](${BASE_URL}/support): GitHub Sponsors and Stripe tiers.`,
  ].join("\n\n")}\n`;
}
