import { ArrowUpRight } from "lucide-react";
import { SITE_CONFIG } from "@/lib/site-config";

/**
 * About — one short, honest paragraph on black. Carries the Person link (Scott
 * Benson) in real HTML so the maker is crawlable and matches the JSON-LD.
 */
export function About() {
  return (
    <section id="about" className="relative scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 font-mono text-xs font-semibold tracking-[0.2em] text-lime-300 uppercase">
          The developer
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          One developer, a lot of agents
        </h2>
        <p className="mt-4 text-base leading-relaxed text-neutral-400">
          {SITE_CONFIG.name} is{" "}
          <a
            href={SITE_CONFIG.author.url}
            target="_blank"
            rel="noreferrer author"
            className="inline-flex items-center gap-0.5 font-medium text-white underline decoration-lime-400/60 underline-offset-2 transition-colors hover:text-lime-200"
          >
            {SITE_CONFIG.author.name}
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </a>{" "}
          — one developer finding out how far agentic coding can go. These tools are the result:
          built fast, shipped in the open, and yours to self-host. No telemetry, no lock-in, no
          roadmap theater.
        </p>
      </div>
    </section>
  );
}
