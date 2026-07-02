import { ArrowLeft, ExternalLink, Github, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const conceptLinks = [
  { href: "/concepts/atlas", label: "Atlas" },
  { href: "/concepts/console", label: "Console" },
  { href: "/concepts/gallery", label: "Gallery" },
  { href: "/concepts/board", label: "Board" },
];

type ConceptShellProps = {
  children: ReactNode;
  eyebrow: string;
  title: string;
  summary: string;
};

export function ConceptShell({ children, eyebrow, title, summary }: ConceptShellProps) {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/78 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/concepts" className="flex items-center gap-3">
            <Image
              src="/logos/codeswhat-logo-green.png"
              alt=""
              width={34}
              height={34}
              className="rounded-lg"
              priority
            />
            <span className="text-sm font-semibold tracking-[0.18em] text-lime-200 uppercase">
              CodesWhat
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Concept navigation">
            {conceptLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-2 text-sm text-neutral-400 transition hover:bg-white/8 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/12 px-3 py-2 text-sm text-neutral-300 transition hover:border-lime-300/60 hover:text-lime-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </div>
      </header>

      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(200,255,0,0.14),transparent_34%),radial-gradient(circle_at_top_right,rgba(45,212,191,0.11),transparent_30%),linear-gradient(135deg,#09090b,#141418_58%,#071311)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
          <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-lime-300 uppercase">
            {eyebrow}
          </p>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(280px,0.28fr)] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-300 sm:text-lg">
                {summary}
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-2">
              {conceptLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-2 text-center text-xs font-semibold text-neutral-300 transition hover:bg-lime-300 hover:text-neutral-950"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {children}

      <footer className="border-t border-white/10 bg-neutral-950">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_auto]">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <Image
                src="/logos/codeswhat-logo-green.png"
                alt=""
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-base font-semibold text-white">CodesWhat</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-neutral-400">
              A product showcase for useful software, sharp prototypes, and the docs that make them
              usable.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
            <div>
              <p className="mb-3 font-semibold text-neutral-200">Concepts</p>
              <div className="grid gap-2 text-neutral-400">
                {conceptLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="hover:text-lime-200">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 font-semibold text-neutral-200">Projects</p>
              <div className="grid gap-2 text-neutral-400">
                <a href="https://github.com/CodesWhat/drydock" className="hover:text-lime-200">
                  Drydock
                </a>
                <a href="https://github.com/CodesWhat/rolester" className="hover:text-lime-200">
                  Rolester
                </a>
              </div>
            </div>
            <div>
              <p className="mb-3 font-semibold text-neutral-200">Contact</p>
              <div className="flex gap-2">
                <a
                  href="https://github.com/CodesWhat"
                  aria-label="CodesWhat on GitHub"
                  className="rounded-full border border-white/10 p-2 text-neutral-400 transition hover:border-lime-300/50 hover:text-lime-200"
                >
                  <Github className="h-4 w-4" />
                </a>
                <a
                  href="mailto:hello@codeswhat.com"
                  aria-label="Email CodesWhat"
                  className="rounded-full border border-white/10 p-2 text-neutral-400 transition hover:border-lime-300/50 hover:text-lime-200"
                >
                  <Mail className="h-4 w-4" />
                </a>
                <a
                  href="/"
                  aria-label="CodesWhat home"
                  className="rounded-full border border-white/10 p-2 text-neutral-400 transition hover:border-lime-300/50 hover:text-lime-200"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
