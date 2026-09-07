import type { MetadataRoute } from "next";

import { URL_SITE as BASE_URL } from "@/lib/site";
import { lireArticlesPublies } from "@/lib/db/blog";

// Pages publiques indexables (on exclut /admin et /confirmation)
const routes = [
  "",
  "/reservation",
  "/blog",
  "/mentions-legales",
  "/confidentialite",
  "/politique-cookies",
  "/cgv",
  "/cgu",
];

/**
 * Le plan du site inclut les articles du blog, lus en base.
 *
 * Sans ça, un article publié depuis le back-office resterait invisible des
 * moteurs de recherche jusqu'au prochain déploiement — ce qui reviendrait à
 * annuler l'intérêt d'un blog que le client alimente lui-même.
 *
 * `lireArticlesPublies` ne lève jamais et renvoie une liste vide si la base
 * est injoignable : le plan reste alors valable, simplement plus court. Un
 * sitemap qui échoue est bien pire qu'un sitemap incomplet.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixes: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.6,
  }));

  const articles = await lireArticlesPublies(500);
  const billets: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE_URL}/blog/${a.slug}`,
    lastModified: new Date(a.modifieLe),
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  return [...fixes, ...billets];
}
