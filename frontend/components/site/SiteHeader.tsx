import { Github } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { GITHUB_URL, SITE_CONFIG } from "@/lib/site-config";

const navLinkCn =
  "text-sm text-neutral-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:text-lime-200";

/**
 * Sticky, translucent dark header — concept-shell chrome (logo + lime-tracked
 * wordmark left, nav + GitHub right, blurred hairline border below).
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/78 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src={SITE_CONFIG.logo}
            alt=""
            width={30}
            height={30}
            className="rounded-lg"
            priority
          />
          <span className="text-sm font-semibold tracking-[0.18em] text-lime-200 uppercase">
            {SITE_CONFIG.name}
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-4">
          <a href="#projects" className={`hidden px-2 py-2 sm:inline-block ${navLinkCn}`}>
            Projects
          </a>
          <a href="#contact" className={`hidden px-2 py-2 sm:inline-block ${navLinkCn}`}>
            Contact
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="CodesWhat on GitHub"
            className="rounded-full p-2 text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Github className="h-5 w-5" />
          </a>
        </nav>
      </div>
    </header>
  );
}
