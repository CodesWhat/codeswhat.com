import type { MetadataRoute } from "next";
import { PROJECT_SLUGS } from "@/lib/project-slugs";
import { BASE_URL } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    {
      url: BASE_URL,
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: `${BASE_URL}/support`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    ...PROJECT_SLUGS.map((slug) => ({
      url: `${BASE_URL}/projects/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  return routes;
}
