import { ArrowRight } from "lucide-react";

/**
 * Services — the "work with me" pitch on black. Server-rendered like the other
 * sections so it's crawlable. Counterpart to Projects: those are the things I've
 * shipped, this is what I can do for you.
 */
const OFFERINGS = [
  {
    title: "Zero to one, fast",
    body: "Idea to a shipped product in weeks, not quarters. Prototypes and MVPs that actually hold up.",
  },
  {
    title: "Get good with AI tools",
    body: "Learn to use AI coding agents for real work — the workflows that stick, not the demos.",
  },
  {
    title: "Automate the busywork",
    body: "Internal tools and automation for the repetitive stuff, built to fit how you already work.",
  },
];

export function Services() {
  return (
    <section id="services" className="relative scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 font-mono text-xs font-semibold tracking-[0.2em] text-lime-700 uppercase dark:text-lime-300">
            Work with me
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
            CodesWhat? Anything for you.
          </h2>
          <p className="mt-3 text-base text-neutral-600 dark:text-neutral-400">
            The projects above are just what I've open-sourced. If you're building something, I can
            help you ship it faster.
          </p>
        </div>

        <ul className="grid gap-5 sm:grid-cols-3">
          {OFFERINGS.map((offering) => (
            <li
              key={offering.title}
              className="flex h-full flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-neutral-900/50 dark:shadow-none"
            >
              <h3 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
                {offering.title}
              </h3>
              <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {offering.body}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <a
            href="mailto:hello@codeswhat.com"
            className="inline-flex items-center gap-2 rounded-full bg-lime-400 px-5 py-2.5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-lime-500 dark:bg-lime-300 dark:hover:bg-lime-200"
          >
            Tell me what you're building
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
