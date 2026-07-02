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
          <p className="mb-3 font-mono text-xs font-semibold tracking-[0.2em] text-brand uppercase">
            Open source software
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            Tools I actually use
          </h2>
          <p className="mt-3 text-base text-fg-muted">
            Containers, security, automation. Each one built because I needed it and couldn't find
            it.
          </p>
        </div>

        <ul className="grid gap-5 sm:grid-cols-2">
          {PROJECTS.map((project) => (
            <li key={project.slug}>
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex h-full flex-col gap-3 rounded-2xl border border-line bg-surface p-6 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface-hover hover:shadow-md dark:shadow-none"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-fg">{project.name}</h3>
                    <p className="text-sm text-fg-faint">{project.tagline}</p>
                  </div>
                  <ArrowUpRight
                    className="h-5 w-5 shrink-0 opacity-70 transition-opacity group-hover:opacity-100"
                    style={{ color: project.accent }}
                  />
                </div>
                <p className="text-sm leading-relaxed text-fg-muted">{project.description}</p>
                <span className="mt-auto pt-2 font-mono text-xs tracking-wide text-fg-faint uppercase">
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
