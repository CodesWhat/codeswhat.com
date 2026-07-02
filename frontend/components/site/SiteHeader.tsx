import { Github } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { Wordmark } from "@/components/site/Wordmark";
import { GITHUB_URL, SITE_CONFIG } from "@/lib/site-config";

const navLinkCn =
  "text-sm text-fg-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:text-brand-hover";

/**
 * Sticky, translucent dark header — concept-shell chrome (logo + lime-tracked
 * wordmark left, nav + GitHub right, blurred hairline border below).
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bar backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label={`${SITE_CONFIG.name} — home`} className="flex items-center">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-4">
          <a href="#projects" className={`hidden px-2 py-2 sm:inline-block ${navLinkCn}`}>
            Projects
          </a>
          <a href="#services" className={`hidden px-2 py-2 sm:inline-block ${navLinkCn}`}>
            Services
          </a>
          <a href="#contact" className={`hidden px-2 py-2 sm:inline-block ${navLinkCn}`}>
            Contact
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="CodesWhat on GitHub"
            className="rounded-full p-2 text-fg-muted transition-colors hover:bg-line hover:text-fg"
          >
            <Github className="h-5 w-5" />
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
