import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/catalogue/catalogue.module.css";
import { Supporters } from "@/components/catalogue/Supporters";
import { SupportLink } from "@/components/catalogue/SupportLink";
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

const SUPPORT_OG = {
  url: "/og/support.png",
  width: 1200,
  height: 630,
  alt: "Support CodesWhat: what the projects cost to run, and how to help",
};

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
    images: [SUPPORT_OG],
  },
  twitter: {
    card: "summary_large_image",
    title: `Support ${SITE_CONFIG.name}`,
    description,
    images: [SUPPORT_OG],
  },
};

// read per request so the links can change without a rebuild
export const dynamic = "force-dynamic";

export default function SupportPage() {
  const tiers = tiersWith(supportLinksFrom(process.env.CODESWHAT_SUPPORT_LINKS, console.warn));

  return (
    <main id="main" className={styles.main}>
      <Link href="/" className={styles.crumb}>
        ← Back to the catalogue
      </Link>

      <section className={styles.hero} aria-labelledby="sup-title">
        <div>
          <p className={styles.eyebrow}>Support</p>
          <h1 id="sup-title" className={`${styles.display} ${styles.displayMid}`}>
            What it costs, and <em>how to help.</em>
          </h1>
          <p className={styles.lede}>
            These projects are free and open source, and they cost real money and time to keep
            going. Everything below goes into one pool that covers whichever project needs it most.
            Each project's running cost is listed further down.
          </p>
        </div>
      </section>

      <section id="tiers" className={styles.section} aria-labelledby="menu-title">
        <header className={styles.sectionHead}>
          <p className={styles.eyebrow}>One pool</p>
          <h2 id="menu-title" className={styles.h2}>
            Ways to <em>chip in.</em>
          </h2>
          <p className={styles.sectionLede}>
            GitHub Sponsors is the easiest way to give if you're on GitHub. Not on GitHub? Pay by
            card through Stripe instead. The tiers match.
          </p>
        </header>
        <div className={styles.sponsorBar}>
          <p>Same tiers, pay through GitHub. It goes to the same pool.</p>
          <SupportLink
            href={GITHUB_SPONSORS_URL}
            ctaId="sponsors_github"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnLime}
          >
            Sponsor CodesWhat on GitHub
            <span className={styles.srOnly}> (opens in a new tab)</span>
          </SupportLink>
        </div>
        <h3 className={styles.subhead}>Not on GitHub? Pay by card</h3>
        <ul className={styles.menu}>
          {tiers.map((tier) => {
            const price = `$${tier.price}`;
            const cadence = tier.cadence === "monthly" ? "per month" : "one time";
            return (
              <li key={tier.id}>
                <div className={styles.menuRow}>
                  <h4 className={styles.menuName}>{tier.name}</h4>
                  <span className={styles.leader} aria-hidden="true" />
                  <span className={styles.menuPrice}>
                    {price}
                    <small> {cadence}</small>
                  </span>
                </div>
                <p className={styles.menuLine}>{tier.buys}</p>
                <div className={styles.menuAction}>
                  {tier.link ? (
                    <SupportLink
                      href={tier.link}
                      ctaId={supportCtaId(tier)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.btnLine}
                    >
                      {tier.cadence === "monthly" ? "Support monthly" : "Give once"}
                      <span className={styles.srOnly}>
                        {" "}
                        with {tier.name}, {price} {cadence} (opens in a new tab)
                      </span>
                    </SupportLink>
                  ) : (
                    <button type="button" className={styles.btnOff} disabled aria-disabled="true">
                      <b>
                        {price} {cadence}
                      </b>
                      <span>Opening soon</span>
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="supporters">
        <header className={styles.sectionHead}>
          <p className={styles.eyebrow}>Thank you</p>
          <h2 id="supporters" className={styles.h2}>
            Supporters<em>.</em>
          </h2>
        </header>
        <Supporters />
      </section>

      <section className={styles.section} aria-labelledby="where-the-money-goes">
        <header className={styles.sectionHead}>
          <p className={styles.eyebrow}>Running costs</p>
          <h2 id="where-the-money-goes" className={styles.h2}>
            Where the money <em>goes.</em>
          </h2>
          <p className={styles.sectionLede}>
            Only the confirmed figures are printed. A placeholder means the number isn't confirmed
            yet, and I'd sooner say so than invent one.
          </p>
        </header>

        <h3 className={styles.subhead}>Shared costs</h3>
        <table className={styles.table}>
          <caption className={styles.srOnly}>Costs shared across projects</caption>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col" className={styles.num}>
                Cost
              </th>
            </tr>
          </thead>
          <tbody>
            {SHARED_COSTS.map((item) => (
              <tr key={item.label}>
                <td data-label="Item">{item.label}</td>
                <td data-label="Cost" className={styles.num}>
                  <strong>{item.cost}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className={styles.subhead}>By project</h3>
        <table className={styles.table}>
          <caption className={styles.srOnly}>Running cost by project</caption>
          <thead>
            <tr>
              <th scope="col">Project</th>
              <th scope="col">Source</th>
              <th scope="col" className={styles.num}>
                Running cost
              </th>
            </tr>
          </thead>
          <tbody>
            {PROJECTS.map((project) => {
              const cost = PROJECT_COSTS[project.slug as SupportProjectId];
              return (
                <tr
                  key={project.slug}
                  id={project.slug}
                  className={`${styles.scrollAnchor} ${cost.placeholder ? styles.rowTbd : ""}`}
                >
                  <td data-label="Project" className={styles.cellTitle}>
                    <Link href={`/projects/${project.slug}`} className={styles.titleLink}>
                      {project.name}
                    </Link>
                  </td>
                  <td data-label="Source">
                    <a
                      href={project.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.costLink}
                    >
                      Repo
                      <span className={styles.srOnly}>
                        {" "}
                        for {project.name} (opens in a new tab)
                      </span>
                    </a>
                  </td>
                  <td data-label="Running cost" className={styles.num}>
                    {cost.placeholder ? (
                      <span className={styles.tbd}>{cost.line}</span>
                    ) : (
                      <strong>{cost.line}</strong>
                    )}
                  </td>
                </tr>
              );
            })}
            <tr id="systema" className={styles.scrollAnchor}>
              <td data-label="Project" className={styles.cellTitle}>
                <Link href="/projects/systema-machinae" className={styles.titleLink}>
                  {SYSTEMA.name}
                </Link>
                <span className={styles.oneLiner}>{SYSTEMA.note}</span>
              </td>
              <td data-label="Source">
                <SupportLink
                  href={SYSTEMA.supportUrl}
                  ctaId="support_systema"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.costLink}
                >
                  Support Systema
                  <span className={styles.srOnly}> (opens in a new tab)</span>
                </SupportLink>
              </td>
              <td data-label="Running cost" className={styles.num}>
                <strong>{SYSTEMA.cost}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className={styles.section}>
        <p className={styles.fine}>
          Stripe handles card payments on its own pages. This site loads nothing from Stripe, and a
          link only opens when you click it. Supporting a project buys no say in its roadmap.
        </p>
      </section>
    </main>
  );
}
