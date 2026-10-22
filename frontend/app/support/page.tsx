import type { Metadata } from "next";
import { SiteBackground } from "@/components/site/SiteBackground";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Supporters } from "@/components/site/Supporters";
import { SupportLink } from "@/components/site/SupportLink";
import { BASE_URL, PROJECTS, SITE_CONFIG } from "@/lib/site-config";
import {
  GITHUB_SPONSORS_URL,
  PROJECT_COSTS,
  SHARED_COSTS,
  type SupportProjectId,
  SYSTEMA,
  supportCtaId,
  supportLinksFrom,
  tiersWith,
} from "@/lib/support";

const description =
  "Back CodesWhat through GitHub Sponsors or a Stripe payment link, see what each project costs to run, and what happens to a project that can't cover its costs.";

export const metadata: Metadata = {
  title: `Support ${SITE_CONFIG.name}`,
  description,
  alternates: { canonical: "/support" },
  openGraph: {
    title: `Support ${SITE_CONFIG.name}`,
    description,
    url: `${BASE_URL}/support`,
    siteName: SITE_CONFIG.name,
    type: "website",
  },
};

// read per request so the links can change without a rebuild
export const dynamic = "force-dynamic";

const linkCn =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-line-strong px-4 py-2 text-sm font-semibold text-fg transition-colors hover:border-fg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

const primaryCn =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

const disabledCn =
  "inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-full border border-dashed border-line-strong px-4 py-2 text-sm font-semibold text-fg-faint";

const textLinkCn =
  "text-sm font-medium text-fg-muted underline decoration-brand/60 underline-offset-2 hover:text-brand-hover";

export default function SupportPage() {
  const tiers = tiersWith(supportLinksFrom(process.env.CODESWHAT_SUPPORT_LINKS, console.warn));

  return (
    <>
      <SiteBackground />
      <div className="relative z-10">
        <SiteHeader />
        <main id="main-content" className="px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <p className="mb-3 font-mono text-xs font-semibold tracking-[0.2em] text-brand uppercase">
              Support
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
              Back CodesWhat
            </h1>
            <p className="mt-4 text-base leading-relaxed text-fg-muted">
              These projects are free and open source, and they cost real money and time to keep
              going. Everything below goes into one pool that covers whichever project needs it
              most. Each project's running cost is listed further down.
            </p>

            <section
              className="mt-8 rounded-2xl border border-line bg-surface p-6 backdrop-blur-sm"
              aria-labelledby="github-sponsors"
            >
              <h2 id="github-sponsors" className="text-lg font-semibold text-fg">
                GitHub Sponsors
              </h2>
              <p className="mt-1 text-sm text-fg-muted">
                The easiest way to give if you're on GitHub. Same tiers, pay through GitHub.
              </p>
              <div className="mt-4">
                <SupportLink
                  href={GITHUB_SPONSORS_URL}
                  ctaId="sponsors_github"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={primaryCn}
                >
                  Sponsor CodesWhat on GitHub
                </SupportLink>
              </div>
            </section>

            <section id="tiers" className="mt-12 scroll-mt-20" aria-labelledby="not-on-github">
              <h2 id="not-on-github" className="text-2xl font-semibold tracking-tight text-fg">
                Not on GitHub?
              </h2>
              <p className="mt-2 text-sm text-fg-muted">
                Pay by card through Stripe instead. The tiers match the ones on GitHub.
              </p>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {tiers.map((tier) => (
                  <li
                    key={tier.id}
                    className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-6 backdrop-blur-sm"
                  >
                    <div>
                      <h3 className="text-base font-semibold text-fg">{tier.name}</h3>
                      <p className="text-sm text-fg-faint">
                        ${tier.price}
                        {tier.cadence === "monthly" ? " / month" : " once"}
                      </p>
                    </div>
                    <p className="text-sm text-fg-muted">{tier.buys}</p>
                    <div className="mt-auto">
                      {tier.link ? (
                        <SupportLink
                          href={tier.link}
                          ctaId={supportCtaId(tier)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={linkCn}
                        >
                          {tier.cadence === "monthly" ? "Support monthly" : "Give once"}
                        </SupportLink>
                      ) : (
                        <span aria-disabled="true" className={disabledCn}>
                          Opening soon
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-12" aria-labelledby="supporters">
              <h2 id="supporters" className="text-2xl font-semibold tracking-tight text-fg">
                Supporters
              </h2>
              <div className="mt-4">
                <Supporters />
              </div>
            </section>

            <section className="mt-12" aria-labelledby="where-the-money-goes">
              <h2
                id="where-the-money-goes"
                className="text-2xl font-semibold tracking-tight text-fg"
              >
                Where the money goes
              </h2>
              <h3 className="mt-4 text-sm font-semibold text-fg">Shared costs</h3>
              <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface text-sm backdrop-blur-sm">
                {SHARED_COSTS.map((item) => (
                  <li
                    key={item.label}
                    className="flex flex-wrap justify-between gap-x-4 gap-y-1 px-5 py-3 text-fg-muted"
                  >
                    <span>{item.label}</span>
                    <span className="text-fg">{item.cost}</span>
                  </li>
                ))}
              </ul>
              <h3 className="mt-6 text-sm font-semibold text-fg">By project</h3>
              <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface backdrop-blur-sm">
                {PROJECTS.map((project) => {
                  const cost = PROJECT_COSTS[project.slug as SupportProjectId];
                  return (
                    <li key={project.slug} id={project.slug} className="scroll-mt-20 p-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <h4 className="text-base font-semibold text-fg">{project.name}</h4>
                        <a
                          href={project.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={textLinkCn}
                        >
                          Repo
                        </a>
                      </div>
                      <p className="mt-1 text-sm text-fg-muted">
                        <span className="font-mono text-xs tracking-wide text-fg-faint uppercase">
                          Running cost
                        </span>{" "}
                        {cost.placeholder ? (
                          <span className="rounded border border-dashed border-line-strong px-1.5 py-0.5 font-mono text-xs text-fg">
                            {cost.line}
                          </span>
                        ) : (
                          cost.line
                        )}
                      </p>
                    </li>
                  );
                })}
                <li id="systema" className="scroll-mt-20 p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h4 className="text-base font-semibold text-fg">{SYSTEMA.name}</h4>
                    <SupportLink
                      href={SYSTEMA.supportUrl}
                      ctaId="support_systema"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={textLinkCn}
                    >
                      Support Systema
                    </SupportLink>
                  </div>
                  <p className="mt-1 text-sm text-fg-muted">
                    <span className="font-mono text-xs tracking-wide text-fg-faint uppercase">
                      Running cost
                    </span>{" "}
                    {SYSTEMA.cost}
                  </p>
                  <p className="mt-1 text-sm text-fg-muted">{SYSTEMA.note}</p>
                </li>
              </ul>
            </section>

            <section className="mt-10 rounded-2xl border border-line p-6">
              <h2 className="text-lg font-semibold text-fg">Fund it or wind it down</h2>
              {/* wording pending Scott's approval */}
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                A project that can't cover its running costs gets wound down. It goes read-only or
                archived, the last release stays published, and the repo stays public.
              </p>
            </section>

            <p className="mt-6 text-xs leading-relaxed text-fg-faint">
              Stripe handles card payments on its own pages. This site loads nothing from Stripe,
              and a link only opens when you click it. Supporting a project buys no say in its
              roadmap.
            </p>
          </div>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
