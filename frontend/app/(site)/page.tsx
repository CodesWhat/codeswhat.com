import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/catalogue/catalogue.module.css";
import { Sprite } from "@/components/catalogue/Sprite";
import { SupportLink } from "@/components/catalogue/SupportLink";
import { TrackedCtaLink } from "@/components/catalogue/TrackedCtaLink";
import { BASE_URL, GITHUB_URL, OG_IMAGE, PROJECTS, SITE_CONFIG } from "@/lib/site-config";
import { SERVICES, SPECIMENS } from "@/lib/specimens";
import { GITHUB_SPONSORS_URL } from "@/lib/support";

const title = `${SITE_CONFIG.name}: ${SITE_CONFIG.tagline}`;

export const metadata: Metadata = {
  title,
  description: SITE_CONFIG.description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description: SITE_CONFIG.description,
    url: BASE_URL,
    siteName: SITE_CONFIG.name,
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: SITE_CONFIG.description,
    site: SITE_CONFIG.twitterCreator,
    creator: SITE_CONFIG.twitterCreator,
    images: [OG_IMAGE],
  },
};

// schema.org graph — Organization + WebSite + Person (founder) + one
// SoftwareSourceCode per project. This is the crawlable/answer-engine backbone,
// server-rendered.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#org`,
      name: SITE_CONFIG.name,
      url: BASE_URL,
      logo: `${BASE_URL}${SITE_CONFIG.logo}`,
      description: SITE_CONFIG.description,
      founder: { "@id": `${BASE_URL}/#scott` },
      sameAs: [GITHUB_URL, SITE_CONFIG.twitterUrl],
      contactPoint: {
        "@type": "ContactPoint",
        email: "hello@codeswhat.com",
        contactType: "customer support",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: SITE_CONFIG.name,
      publisher: { "@id": `${BASE_URL}/#org` },
    },
    {
      "@type": "Person",
      "@id": `${BASE_URL}/#scott`,
      name: SITE_CONFIG.author.name,
      url: SITE_CONFIG.author.url,
    },
    ...PROJECTS.map((p) => ({
      "@type": "SoftwareSourceCode",
      name: p.name,
      description: p.description,
      codeRepository: p.href,
      author: { "@id": `${BASE_URL}/#org` },
    })),
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main id="main" className={styles.main}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div>
            <p className={styles.eyebrow}>Open-source tools, and a developer for hire</p>
            <h1 id="hero-title" className={styles.display}>
              One developer. A lot of agents. <em>Small, sharp</em> tools.
            </h1>
            <p className={styles.lede}>
              CodesWhat is Scott Benson, building open-source tools with a crowd of coding agents.
              Each one does a single job, in the open, with nothing phoning home. They're filed
              below as specimens. When you need something built, the same crew takes commissions.
            </p>
            <div className={styles.actions}>
              <a className={styles.btnLime} href="#specimens">
                Meet the specimens
              </a>
              <a className={styles.btnLine} href="#services">
                Work with me
              </a>
            </div>
          </div>

          <figure className={styles.figure} aria-label="The collection">
            <div className={styles.figureGrid}>
              {SPECIMENS.map((s) => (
                <Sprite key={s.slug} slug={s.slug} scale={2} label={s.alt} />
              ))}
            </div>
            <figcaption className={styles.figureCap}>
              <b>Fig. 1</b>
              The collection, as of this morning. None have escaped.
            </figcaption>
          </figure>
        </section>

        <section id="specimens" className={styles.section} aria-labelledby="specimens-title">
          <header className={styles.sectionHead}>
            <p className={styles.eyebrow}>Section I</p>
            <h2 id="specimens-title" className={styles.h2}>
              The specimens, <em>filed and labelled.</em>
            </h2>
            <p className={styles.sectionLede}>
              Eight projects, each drawn from its own mascot, with a Latin name that fits and field
              notes that are mostly true. Open a plate for the full write-up.
            </p>
          </header>

          <ul className={styles.plates}>
            {SPECIMENS.map((specimen, i) => (
              <li key={specimen.slug}>
                <article className={styles.plate} aria-labelledby={`plate-${specimen.slug}`}>
                  <div className={styles.portrait}>
                    <Sprite
                      slug={specimen.slug}
                      scale={5}
                      fit={i === 0 ? 288 : 176}
                      label={specimen.alt}
                    />
                  </div>
                  <div className={styles.plateBody}>
                    <p className={styles.plateNo}>
                      Plate {specimen.no} · {specimen.kind}
                    </p>
                    <h3 id={`plate-${specimen.slug}`} className={styles.plateName}>
                      <Link href={`/projects/${specimen.slug}`}>{specimen.name}</Link>
                    </h3>
                    <p className={styles.latin}>{specimen.latin}</p>
                    <dl className={styles.field}>
                      <div>
                        <dt>Habitat</dt>
                        <dd>{specimen.habitat}</dd>
                      </div>
                      <div>
                        <dt>Diet</dt>
                        <dd>{specimen.diet}</dd>
                      </div>
                      <div>
                        <dt>Temperament</dt>
                        <dd>{specimen.temperament}</dd>
                      </div>
                    </dl>
                    <div className={styles.plateFoot}>
                      <span className={styles.chip}>
                        {specimen.license} · {specimen.language}
                      </span>
                      <Link href={`/projects/${specimen.slug}`}>Field notes</Link>
                      <TrackedCtaLink
                        ctaId={`project_${specimen.slug}`}
                        placement="projects"
                        href={specimen.site}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Visit
                        <span className={styles.srOnly}> {specimen.name} (opens in a new tab)</span>
                      </TrackedCtaLink>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>

        <section id="services" className={styles.section} aria-labelledby="services-title">
          <header className={`${styles.sectionHead} ${styles.headRow}`}>
            <div>
              <p className={styles.eyebrow}>Section II</p>
              <h2 id="services-title" className={styles.h2}>
                CodesWhat? <em>Anything for you.</em>
              </h2>
              <p className={styles.sectionLede}>
                The projects above are only what I have open-sourced. If you are building something,
                I can help you ship it faster.
              </p>
            </div>
            <aside className={styles.dotCard} aria-label="Commissions note">
              <p className={styles.eyebrow}>Commissions</p>
              <p className={styles.dotCardBig}>Taken on, one at a time.</p>
            </aside>
          </header>
          <ol className={styles.services}>
            {SERVICES.map((service, i) => (
              <li key={service.title}>
                <span className={styles.bigNo} aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className={styles.h3}>{service.title}</h3>
                <p>{service.body}</p>
              </li>
            ))}
          </ol>
          <div className={styles.actions}>
            <a className={styles.btnLime} href="mailto:hello@codeswhat.com">
              Tell me what you need help with
            </a>
          </div>
        </section>

        <section id="upkeep" className={styles.section} aria-labelledby="upkeep-title">
          <div className={styles.fund}>
            <div>
              <p className={styles.eyebrow}>Section III</p>
              <h2 id="upkeep-title" className={`${styles.h2} ${styles.h2Small}`}>
                The projects cost money to run. <em>Worth saying out loud.</em>
              </h2>
            </div>
            <div>
              <p className={styles.fundText}>
                Hosting, domains and CI add up, and today it all comes out of my pocket. If the
                tools are useful to you and you'd like to help keep them going, there's a shared
                pool for it. No perks, no gated features.
              </p>
              <div className={styles.actions}>
                <SupportLink
                  className={styles.btnLine}
                  href={GITHUB_SPONSORS_URL}
                  ctaId="sponsors_github"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Sponsors
                  <span className={styles.srOnly}> (opens in a new tab)</span>
                </SupportLink>
                <Link className={styles.btnLine} href="/support">
                  How it works
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
