import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/catalogue/catalogue.module.css";
import { Supporters } from "@/components/catalogue/Supporters";
import { SupportLink } from "@/components/catalogue/SupportLink";
import { BASE_URL, SITE_CONFIG } from "@/lib/site-config";
import {
  GITHUB_SPONSORS_URL,
  SYSTEMA,
  supportCtaId,
  supportLinksFrom,
  tiersWith,
} from "@/lib/support";

const description = "Back CodesWhat through GitHub Sponsors or a Stripe payment link.";

const SUPPORT_OG = {
  url: "/og/support.png",
  width: 1200,
  height: 630,
  alt: "Support CodesWhat: how to help",
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
            Feed the <em>specimens.</em>
          </h1>
          <p className={styles.lede}>
            These projects are free and open source. Everything here goes into one pool that keeps
            them running. {SYSTEMA.name} takes support on{" "}
            <SupportLink
              href={SYSTEMA.supportUrl}
              ctaId="support_systema"
              target="_blank"
              rel="noopener noreferrer"
            >
              its own page
              <span className={styles.srOnly}> (opens in a new tab)</span>
            </SupportLink>
            .
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

      <section className={styles.section}>
        <p className={styles.fine}>
          Stripe handles card payments on its own pages. This site loads nothing from Stripe, and a
          link only opens when you click it. Supporting a project buys no say in its roadmap.
        </p>
      </section>
    </main>
  );
}
