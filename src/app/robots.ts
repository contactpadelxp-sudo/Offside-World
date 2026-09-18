import type { MetadataRoute } from "next";

import { URL_SITE as BASE_URL } from "@/lib/site";

/**
 * Le fichier autorisait tout, `/admin` compris.
 *
 * `/admin` est le back-office et `/api/` des points d'entrée, pas des pages :
 * les faire explorer ne produit que des erreurs. Ils sont écartés.
 *
 * `/confirmation` NE L'EST PAS, ET C'EST VOLONTAIRE — c'est même l'inverse de
 * ce qu'on croit devoir faire.
 *
 * Cette page récapitule la réservation d'une personne : on veut qu'elle ne soit
 * pas indexée. Or interdire l'exploration N'EMPÊCHE PAS l'indexation : un robot
 * qui ne peut pas charger la page ne peut pas non plus y lire le `noindex`, et
 * une adresse citée quelque part peut alors se retrouver indexée sans contenu,
 * sur son seul intitulé. Les deux mesures ne se complètent pas : la première
 * annule la seconde.
 *
 * On laisse donc explorer, pour que le `noindex` de la page soit lu et obéi.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
