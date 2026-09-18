import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CookieBannerWrapper } from "@/components/cookie-banner";
import { MesurePages } from "@/components/mesure-pages";
import { PhotosProvider } from "@/components/photos-provider";
import { ReglagesMouvement } from "@/components/motion";
import { resolveLogoSrc } from "@/lib/logo";
import { resolvePhotos } from "@/lib/photos";
import { NOM_COMMERCIAL } from "@/data/entreprise";
import { URL_SITE } from "@/lib/site";

/**
 * Coquille du site public : en-tête, pied de page, bandeau cookies.
 *
 * Le back-office ne passe pas par ici. C'est ce qui garantit qu'aucune barre de
 * navigation du site — donc aucun clic ni retour arrière — ne peut mener d'une
 * page d'administration vers le site, ni l'inverse.
 */

/*
  Le titre et la description ne nommaient que « la Belgique ». Or un complexe
  de loisirs se cherche par sa ville : les visiteurs tapent « foot indoor
  Gembloux », pas « foot indoor Belgique », et aucune des deux balises ne
  contenait ce mot. Une mention dans le titre et une dans la description
  suffisent — au-delà, c'est du bourrage, que les moteurs sanctionnent.
*/
const TITRE = `${NOM_COMMERCIAL} Gembloux — Anniversaires, Bubble Foot & Team Building`;
const DESCRIPTION =
  "Le complexe de foot indoor de Gembloux : anniversaires enfants, Bubble Foot, location de terrain et team building.";

/*
  Ces métadonnées valent pour l'accueil ET servent de repli à toute page du
  site qui n'en déclare pas. Pas de balise canonique ici, donc : posée au
  niveau du layout, elle désignerait l'accueil comme l'original de chaque page
  descendante, qui demanderait ainsi sa propre désindexation. Les pages la
  posent elles-mêmes, via `metadonneesPage`.
*/
export const metadata: Metadata = {
  title: TITRE,
  description: DESCRIPTION,
  applicationName: NOM_COMMERCIAL,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "fr_BE",
    siteName: NOM_COMMERCIAL,
    url: URL_SITE,
    title: TITRE,
    description: DESCRIPTION,
    images: [
      { url: "/images/offside-foot-indoor.jpg", width: 1200, height: 630, alt: `${NOM_COMMERCIAL} — foot indoor` },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITRE,
    description: DESCRIPTION,
    images: ["/images/offside-foot-indoor.jpg"],
  },
};

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const logoSrc = resolveLogoSrc();
  const photos = resolvePhotos();

  return (
    <PhotosProvider value={photos}>
      {/*
        `ReglagesMouvement` enveloppe TOUT le site public : les apparitions au
        défilement, les compteurs, les cartes inclinables et les boutons
        magnétiques vivent dans les pages, pas ici, et framer-motion ne consulte
        pas la préférence système sans qu'on le lui dise.
      */}
      <ReglagesMouvement>
        <Header logoSrc={logoSrc} />
        <main className="flex-1">{children}</main>
        <Footer logoSrc={logoSrc} />
        <CookieBannerWrapper />
        <MesurePages />
      </ReglagesMouvement>
    </PhotosProvider>
  );
}
