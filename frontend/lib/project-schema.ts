import { BASE_URL, GITHUB_URL, SITE_CONFIG } from "./site-config.ts";
import { SPECIMENS, type Specimen } from "./specimens.ts";

const ORG = { "@id": `${BASE_URL}/#org` };

export const projectSchemaId = (slug: string) => `${BASE_URL}/projects/${slug}#software`;

/** One SoftwareSourceCode node per project, shared by the homepage and the project page. */
export function projectSoftwareNode(s: Specimen) {
  const url = `${BASE_URL}/projects/${s.slug}`;
  return {
    "@type": "SoftwareSourceCode",
    "@id": projectSchemaId(s.slug),
    name: s.name,
    description: s.about,
    url,
    programmingLanguage: s.language,
    author: ORG,
    publisher: ORG,
    ...(s.repo ? { codeRepository: s.repo, license: `${s.repo}/blob/main/LICENSE` } : {}),
    ...(s.site !== s.repo ? { sameAs: [s.site] } : {}),
  };
}

export function projectPageJsonLd(s: Specimen) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      projectSoftwareNode(s),
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "CodesWhat", item: BASE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: s.name,
            item: `${BASE_URL}/projects/${s.slug}`,
          },
        ],
      },
    ],
  };
}

// Organization + WebSite + Person (founder) + one SoftwareSourceCode per project.
// This is the crawlable/answer-engine backbone, server-rendered on the homepage.
export const homepageJsonLd = {
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
    ...SPECIMENS.map(projectSoftwareNode),
  ],
};

/** Escapes "<" so a string value can never close the surrounding script tag. */
export const serializeJsonLd = (obj: unknown) => JSON.stringify(obj).replace(/</g, "\\u003c");
