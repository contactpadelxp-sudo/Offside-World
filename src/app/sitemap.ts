import type { MetadataRoute } from "next";

import { URL_SITE as BASE_URL } from "@/lib/site";

// Pages publiques indexables (on exclut /admin et /confirmation)
const routes = [
  "",
  "/reservation",
  "/mentions-legales",
  "/confidentialite",
  "/politique-cookies",
  "/cgv",
  "/cgu",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.6,
  }));
}
