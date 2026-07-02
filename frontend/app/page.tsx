import type { Metadata } from "next";
import { FloatingScene } from "@/components/site/FloatingScene";
import { SiteBackground } from "@/components/site/SiteBackground";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { About } from "@/components/site/sections/About";
import { Contact } from "@/components/site/sections/Contact";
import { Hero } from "@/components/site/sections/Hero";
import { Projects } from "@/components/site/sections/Projects";
import { BASE_URL, GITHUB_URL, OG_IMAGE, PROJECTS, SITE_CONFIG } from "@/lib/site-config";

const title = `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`;

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
// server-rendered independently of the WebGL layer.
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
      <SiteBackground />
      <FloatingScene />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-neutral-900 focus:shadow-lg dark:focus:bg-neutral-900 dark:focus:text-neutral-100"
      >
        Skip to content
      </a>

      <div className="relative z-10">
        <SiteHeader />
        <main id="main-content">
          <Hero />
          <Projects />
          <About />
          <Contact />
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
