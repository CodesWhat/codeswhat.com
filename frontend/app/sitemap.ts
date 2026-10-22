import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  // Add your routes here as you create new pages
  const routes = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: `${BASE_URL}/support`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];

  return routes;
}
