import type { Metadata } from "next";

import { NOM_COMMERCIAL } from "@/data/entreprise";

/**
 * Adresse publique du site.
 *
 * Elle servait jusqu'ici recopiée à quatre endroits (métadonnées, robots.txt,
 * sitemap, partage social) : le jour où le domaine définitif remplacera
 * l'adresse Vercel, il n'y aura plus qu'une ligne à changer — ou, mieux, une
 * variable d'environnement à renseigner.
 *
 * `SITE_URL` prend le dessus si elle est définie.
 *
 * SANS ELLE, ON RETOMBE SUR L'ADRESSE VERCEL, ET SURTOUT PAS SUR LE DOMAINE
 * DÉFINITIF.
 *
 * `devis-pdf.ts` avait son propre repli sur `offsidefootindoor.be` pendant que
 * celui-ci pointait vers Vercel : un même déploiement sans `SITE_URL` renvoyait
 * donc aux CGV sur deux domaines différents selon qu'on lisait un devis PDF ou
 * le sitemap. L'unification était nécessaire — mais dans CE sens-là.
 *
 * `offsidefootindoor.be` ne sert pas encore ce site : il pointe toujours vers
 * l'ancien site Wix du complexe. Prendre ce domaine comme repli ferait mener
 * chaque lien d'e-mail, chaque PDF de devis et chaque adresse canonique vers un
 * site qui n'est pas celui-ci — c'est-à-dire exactement le jour où l'oubli de
 * la variable ne se verrait pas.
 *
 * L'adresse Vercel, elle, sert réellement le site aujourd'hui. Le basculement
 * se fait en renseignant `SITE_URL`, ce que décrit la procédure de mise en
 * ligne — pas en pariant sur un domaine qui n'est pas encore à nous.
 */
export const URL_SITE = (process.env.SITE_URL || "https://offside-world.vercel.app").replace(
  /\/+$/,
  ""
);

/** Construit une URL absolue à partir d'un chemin interne. */
export function urlAbsolue(chemin: string): string {
  return `${URL_SITE}${chemin.startsWith("/") ? chemin : `/${chemin}`}`;
}

/** Vignette de partage par défaut, commune à toutes les pages. */
const IMAGE_PARTAGE = "/images/offside-foot-indoor.jpg";

type OptionsMetadonnees = {
  /** Titre complet de l'onglet et du résultat de recherche. */
  titre: string;
  description: string;
  /** Chemin interne de la page, pour la balise canonique et le partage. */
  chemin: string;
  /** `false` ajoute un `noindex` : réservé aux pages nominatives. */
  indexable?: boolean;
};

/**
 * Métadonnées d'une page du site.
 *
 * Next fusionne les métadonnées SUPERFICIELLEMENT : une page qui redéclarerait
 * seulement `openGraph.title` écraserait tout l'`openGraph` du layout, vignette
 * et nom du site compris, et son partage sur les réseaux arriverait nu. Passer
 * par cette fabrique force chaque page à réémettre l'objet entier.
 *
 * La balise canonique est posée ici, page par page, et non dans le layout :
 * déclarée dans le layout elle vaudrait pour TOUS ses descendants, qui
 * annonceraient alors l'accueil comme leur original et se désindexeraient
 * eux-mêmes.
 */
export function metadonneesPage({
  titre,
  description,
  chemin,
  indexable = true,
}: OptionsMetadonnees): Metadata {
  return {
    title: titre,
    description,
    alternates: { canonical: chemin },
    robots: { index: indexable, follow: indexable },
    openGraph: {
      type: "website",
      locale: "fr_BE",
      siteName: NOM_COMMERCIAL,
      url: urlAbsolue(chemin),
      title: titre,
      description,
      images: [
        { url: IMAGE_PARTAGE, width: 1200, height: 630, alt: `${NOM_COMMERCIAL} — foot indoor` },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: titre,
      description,
      images: [IMAGE_PARTAGE],
    },
  };
}
