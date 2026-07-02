import { ArrowRight, Github } from "lucide-react";
import { GITHUB_URL } from "@/lib/site-config";

/**
 * Hero — concept-shell typography on black: lime uppercase eyebrow, oversized
 * two-tone white/neutral heading, muted lead copy. The spinning 3D coin drifts
 * behind this via the FloatingScene layer; all text is server-rendered.
 */
export function Hero() {
  return (
    <section className="relative px-4 pt-20 pb-16 sm:pt-28 sm:pb-20">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <span className="inline-flex items-center rounded-full border border-lime-300/25 bg-lime-300/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-lime-200 uppercase">
          Open Source · Developer Tools
        </span>

        <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
          Where curiosity
          <br />
          <span className="text-neutral-500">meets code.</span>
        </h1>

        <p className="max-w-2xl text-lg text-neutral-400">
          Open-source developer tools for containers, security, and automation. Small tools that do
          one thing well.
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#projects"
            className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-2.5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-lime-200"
          >
            See the projects
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-neutral-200 transition-colors hover:border-white/30 hover:text-white"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </div>
      </div>

      {/* spacer so the floating coin has room to breathe above the fold */}
      <div aria-hidden="true" className="h-40 sm:h-56" />
    </section>
  );
}
