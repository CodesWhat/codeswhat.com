"use client";

import { ArrowUpRight, Github, Mail, X } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { EmailSignupForm } from "@/components/EmailSignupForm";

// WebGL + Rapier WASM are client-only — load the live board without SSR.
const BoardScene = dynamic(() => import("./BoardScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center bg-[#0b0e14] text-sm text-neutral-500">
      Loading 3D board…
    </div>
  ),
});

export function BoardConcept() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <main className="relative h-screen overflow-hidden bg-[#0b0e14] text-neutral-100">
      {/* the live board fills the whole viewport, behind the floating chrome */}
      <BoardScene onContact={() => setContactOpen(true)} />

      {/* floating header — a thin bar that fades into the board. The scrim is
          click-through (pointer-events-none) so you can orbit under it; only the
          nav row itself captures clicks. */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-50 bg-gradient-to-b from-neutral-950/60 via-neutral-950/20 to-transparent pb-12">
        <div className="pointer-events-auto mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logos/codeswhat-logo-green.png"
              alt=""
              width={30}
              height={30}
              className="rounded-lg"
              priority
            />
            <span className="text-sm font-semibold tracking-[0.18em] text-lime-200 uppercase">
              CodesWhat
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/30 px-3 py-2 text-sm text-neutral-200 backdrop-blur transition hover:border-lime-300/60 hover:text-lime-100"
          >
            <Mail className="h-4 w-4" />
            Contact
          </button>
        </div>
      </header>

      {/* orbit hint — floats just above the footer */}
      <div className="pointer-events-none absolute right-4 bottom-[4.5rem] z-40 rounded-md bg-black/40 px-2.5 py-1.5 text-xs text-neutral-400 backdrop-blur">
        drag to orbit · scroll to zoom · click a mascot for its repo
      </div>

      {/* floating footer — mirror of the header, fading up from the bottom */}
      <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-50 bg-gradient-to-t from-neutral-950/60 via-neutral-950/20 to-transparent pt-12">
        <div className="pointer-events-auto mx-auto flex flex-col items-start justify-between gap-3 px-4 py-3 text-sm sm:flex-row sm:items-center sm:px-6">
          <a
            href="https://scottbenson.dev"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 text-xs text-neutral-500 hover:text-lime-200"
          >
            by Scott Benson
            <ArrowUpRight className="h-3 w-3 opacity-60" />
          </a>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-neutral-300">
            {[
              { label: "Sockguard", href: "https://github.com/CodesWhat/sockguard" },
              { label: "Drydock", href: "https://github.com/CodesWhat/drydock" },
              { label: "Portwing", href: "https://github.com/CodesWhat/portwing" },
              { label: "Portkey MCP", href: "https://github.com/CodesWhat/portkey-admin-mcp" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 hover:text-lime-200"
              >
                {label}
                <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
              </a>
            ))}
          </nav>
          <div className="flex gap-2">
            <a
              href="https://github.com/CodesWhat"
              target="_blank"
              rel="noreferrer"
              aria-label="CodesWhat on GitHub"
              className="rounded-full border border-white/10 bg-black/30 p-2 text-neutral-300 backdrop-blur transition hover:border-lime-300/50 hover:text-lime-200"
            >
              <Github className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              aria-label="Contact CodesWhat"
              className="rounded-full border border-white/10 bg-black/30 p-2 text-neutral-300 backdrop-blur transition hover:border-lime-300/50 hover:text-lime-200"
            >
              <Mail className="h-4 w-4" />
            </button>
          </div>
        </div>
      </footer>

      {/* contact modal — reuses the site's EmailOctopus signup, opened by the
          clear "@" marble on the board */}
      {contactOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4">
          <button
            type="button"
            aria-label="Close contact"
            onClick={() => setContactOpen(false)}
            className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-6 text-center shadow-2xl shadow-black/60">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setContactOpen(false)}
              className="absolute top-3 right-3 rounded-full p-1.5 text-neutral-400 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <EmailSignupForm />
            <p className="mt-4 text-xs text-neutral-500">
              or email{" "}
              <a href="mailto:hello@codeswhat.com" className="text-lime-300 hover:underline">
                hello@codeswhat.com
              </a>
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
