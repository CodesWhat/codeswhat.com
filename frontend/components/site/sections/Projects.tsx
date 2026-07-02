import { ArrowUpRight } from "lucide-react";
import { PROJECTS } from "@/lib/site-config";

/**
 * Projects — the crawlable heart of the page on black. Every project ships a
 * real name, tagline, and description in server-rendered HTML (the SEO/AEO
 * backbone), while its mascot balloon floats past in the 3D layer behind it.
 */
export function Projects() {
  return (
    <section id="projects" className="relative scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 font-mono text-xs font-semibold tracking-[0.2em] text-lime-300 uppercase">
            The roster
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Four projects
          </h2>
          <p className="mt-3 text-base text-neutral-400">
            Small tools for containers, security, and automation.
          </p>
        </div>

        <ul className="grid gap-5 sm:grid-cols-2">
          {PROJECTS.map((project) => (
            <li key={project.slug}>
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex h-full flex-col gap-3 rounded-2xl bg-neutral-900/50 p-6 transition-all hover:-translate-y-0.5 hover:bg-neutral-900/80"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-white">
                      {project.name}
                    </h3>
                    <p className="text-sm text-neutral-500">{project.tagline}</p>
                  </div>
                  <ArrowUpRight
                    className="h-5 w-5 shrink-0 opacity-70 transition-opacity group-hover:opacity-100"
                    style={{ color: project.accent }}
                  />
                </div>
                <p className="text-sm leading-relaxed text-neutral-400">{project.description}</p>
                <span className="mt-auto pt-2 font-mono text-xs tracking-wide text-neutral-500 uppercase">
                  {project.status}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
