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
        <span className="inline-flex items-center rounded-full border border-lime-600/30 bg-lime-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-lime-700 uppercase dark:border-lime-300/25 dark:bg-lime-300/10 dark:text-lime-200">
          Open Source · Developer Tools
        </span>

        <h1 className="text-5xl font-semibold tracking-tight text-neutral-900 sm:text-6xl lg:text-7xl dark:text-white">
          Where curiosity
          <br />
          <span className="text-neutral-400 dark:text-neutral-500">meets code.</span>
        </h1>

        <p className="max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
          Open-source tools for containers, security, and automation — small, sharp, and built in
          the open.
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#projects"
            className="inline-flex items-center gap-2 rounded-full bg-lime-400 px-5 py-2.5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-lime-500 dark:bg-lime-300 dark:hover:bg-lime-200"
          >
            See the projects
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-400 hover:text-neutral-900 dark:border-white/15 dark:text-neutral-200 dark:hover:border-white/30 dark:hover:text-white"
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
