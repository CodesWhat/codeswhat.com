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
          <p className="mb-3 font-mono text-xs font-semibold tracking-[0.2em] text-brand uppercase">
            Work with me
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            CodesWhat? Anything for you.
          </h2>
          <p className="mt-3 text-base text-fg-muted">
            The projects above are just what I've open-sourced. If you're building something, I can
            help you ship it faster.
          </p>
        </div>

        <ul className="grid gap-5 sm:grid-cols-3">
          {OFFERINGS.map((offering) => (
            <li
              key={offering.title}
              className="flex h-full flex-col gap-2 rounded-2xl border border-line bg-surface p-6 shadow-sm backdrop-blur-sm dark:shadow-none"
            >
              <h3 className="text-lg font-semibold tracking-tight text-fg">{offering.title}</h3>
              <p className="text-sm leading-relaxed text-fg-muted">{offering.body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <a
            href="mailto:hello@codeswhat.com"
            className="inline-flex items-center gap-2 rounded-full bg-brand-solid px-5 py-2.5 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-solid-hover"
          >
            Tell me what you need help with
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
