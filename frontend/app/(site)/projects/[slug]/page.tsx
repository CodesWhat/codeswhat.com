import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/components/catalogue/catalogue.module.css";
import { Sprite } from "@/components/catalogue/Sprite";
import { SupportLink } from "@/components/catalogue/SupportLink";
import { TrackedCtaLink } from "@/components/catalogue/TrackedCtaLink";
import { projectDescription, projectTitle } from "@/lib/project-meta";
import { projectPageJsonLd, serializeJsonLd } from "@/lib/project-schema";
import { BASE_URL, SITE_CONFIG } from "@/lib/site-config";
import { bySlug, SPECIMENS } from "@/lib/specimens";
import { SYSTEMA } from "@/lib/support";

export const dynamicParams = false;

export function generateStaticParams() {
  return SPECIMENS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const s = bySlug((await params).slug);
  if (!s) return {};
  const title = projectTitle(s, SITE_CONFIG.name);
  const description = projectDescription(s);
  const image = {
    url: `/og/${s.slug}.png`,
    width: 1200,
    height: 630,
    alt: `${s.name}, ${s.latin}: ${s.tagline}`,
  };
  return {
    title,
    description,
    alternates: { canonical: `/projects/${s.slug}` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/projects/${s.slug}`,
      siteName: SITE_CONFIG.name,
      type: "website",
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function SpecimenPage({ params }: { params: Promise<{ slug: string }> }) {
  const s = bySlug((await params).slug);
  if (!s) notFound();
  const i = SPECIMENS.findIndex((x) => x.slug === s.slug);
  const prev = SPECIMENS[(i + SPECIMENS.length - 1) % SPECIMENS.length];
  const next = SPECIMENS[(i + 1) % SPECIMENS.length];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(projectPageJsonLd(s)) }}
      />
      <main id="main" className={styles.main}>
        <Link href="/#specimens" className={styles.crumb}>
          ← All specimens
        </Link>

        <section className={styles.detailHero} aria-labelledby="spec-title">
          <div className={styles.portraitBig}>
            <Sprite slug={s.slug} scale={10} label={s.alt} />
          </div>
          <div>
            <p className={styles.eyebrow}>
              Plate {s.no} · {s.kind}
            </p>
            <h1 id="spec-title" className={`${styles.display} ${styles.detailName}`}>
              <em>{s.name}</em>
            </h1>
            <p className={styles.detailLatin}>{s.latin}</p>
            <p className={styles.lede}>{s.about}</p>
            <ul className={styles.metaRow} aria-label="License and language">
              <li>{s.license}</li>
              <li>{s.language}</li>
              <li>{s.kind}</li>
            </ul>
            <div className={styles.actions}>
              <TrackedCtaLink
                ctaId={`project_${s.slug}`}
                placement="projects"
                className={styles.btnLime}
                href={s.site}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit the site
                <span className={styles.srOnly}> (opens in a new tab)</span>
              </TrackedCtaLink>
              {s.repo ? (
                <a
                  className={styles.btnLine}
                  href={s.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Repository
                </a>
              ) : null}
              {s.docs ? (
                <a
                  className={styles.btnLine}
                  href={s.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Docs
                </a>
              ) : null}
            </div>
          </div>
        </section>

        <section className={styles.notesSection} aria-labelledby="notes-title">
          <header>
            <p className={styles.eyebrow}>Field notes</p>
            <h2 id="notes-title" className={styles.h2}>
              What to <em>look for.</em>
            </h2>
          </header>
          <dl className={styles.specs}>
            <div>
              <dt>Habitat</dt>
              <dd>{s.habitat}</dd>
            </div>
            <div>
              <dt>Diet</dt>
              <dd>{s.diet}</dd>
            </div>
            <div>
              <dt>Temperament</dt>
              <dd>{s.temperament}</dd>
            </div>
            <div>
              <dt>Marks</dt>
              <dd>{s.marks}</dd>
            </div>
            <div>
              <dt>Handling</dt>
              <dd>{s.handling}</dd>
            </div>
          </dl>
        </section>

        <div className={styles.upkeep}>
          <strong>Upkeep</strong>
          <span>{s.upkeep}</span>
          {s.monthly === null ? (
            <Link href="/support">Support</Link>
          ) : (
            <SupportLink
              href={SYSTEMA.supportUrl}
              ctaId="support_systema"
              target="_blank"
              rel="noopener noreferrer"
            >
              Its support page
              <span className={styles.srOnly}> (opens in a new tab)</span>
            </SupportLink>
          )}
        </div>

        <nav className={styles.pager} aria-label="More specimens">
          <Link href={`/projects/${prev.slug}`}>
            <small>Previous</small>
            <span>{prev.name}</span>
          </Link>
          <Link href={`/projects/${next.slug}`} className={styles.pagerNext}>
            <small>Next</small>
            <span>{next.name}</span>
          </Link>
        </nav>
      </main>
    </>
  );
}
