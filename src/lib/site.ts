/**
 * Adresse publique du site.
 *
 * Elle servait jusqu'ici recopiée à quatre endroits (métadonnées, robots.txt,
 * sitemap, partage social) : le jour où le domaine définitif remplacera
 * l'adresse Vercel, il n'y aura plus qu'une ligne à changer — ou, mieux, une
 * variable d'environnement à renseigner.
 *
 * `SITE_URL` prend le dessus si elle est définie. Sans elle, on retombe sur
 * l'adresse Vercel actuelle plutôt que de construire une URL invalide.
 */
export const URL_SITE = (process.env.SITE_URL || "https://offside-world.vercel.app").replace(
  /\/+$/,
  ""
);

/** Construit une URL absolue à partir d'un chemin interne. */
export function urlAbsolue(chemin: string): string {
  return `${URL_SITE}${chemin.startsWith("/") ? chemin : `/${chemin}`}`;
}
