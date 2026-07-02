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
          Who's behind it
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          A one-person studio, shipping in the open
        </h2>
        <p className="mt-4 text-base leading-relaxed text-neutral-400">
          {SITE_CONFIG.name} is built by{" "}
          <a
            href={SITE_CONFIG.author.url}
            target="_blank"
            rel="noreferrer author"
            className="inline-flex items-center gap-0.5 font-medium text-white underline decoration-lime-400/60 underline-offset-2 transition-colors hover:text-lime-200"
          >
            {SITE_CONFIG.author.name}
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </a>
          . Everything here is open source, self-hostable, and made because the tool didn't exist
          yet or didn't work the way it should. No telemetry, no lock-in, no roadmap theater.
        </p>
      </div>
    </section>
  );
}
