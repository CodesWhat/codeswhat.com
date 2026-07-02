import { ArrowUpRight, Github } from "lucide-react";
import { Wordmark } from "@/components/site/Wordmark";
import { GITHUB_URL, PROJECTS, SITE_CONFIG } from "@/lib/site-config";

/**
 * Lightweight dark CodesWhat footer — deliberately NOT the drydock SaaS footer.
 * Just the projects, the maker credit, GitHub, and a copyright line.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50/60 dark:border-white/10 dark:bg-neutral-950/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <Wordmark />
            <a
              href={SITE_CONFIG.author.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center gap-0.5 text-xs text-neutral-500 transition-colors hover:text-lime-600 dark:hover:text-lime-200"
            >
              by {SITE_CONFIG.author.name}
              <ArrowUpRight className="h-3 w-3 opacity-60" />
            </a>
          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            {PROJECTS.map((p) => (
              <a
                key={p.slug}
                href={p.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 transition-colors hover:text-lime-600 dark:hover:text-lime-200"
              >
                {p.name}
                <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
              </a>
            ))}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-lime-600 dark:hover:text-lime-200"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </nav>
        </div>

        <p className="text-xs text-neutral-500 dark:text-neutral-600">
          © {year} {SITE_CONFIG.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
