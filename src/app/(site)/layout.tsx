import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CookieBannerWrapper } from "@/components/cookie-banner";
import { PhotosProvider } from "@/components/photos-provider";
import { resolveLogoSrc } from "@/lib/logo";
import { resolvePhotos } from "@/lib/photos";
import { NOM_COMMERCIAL } from "@/data/entreprise";

/**
 * Coquille du site public : en-tête, pied de page, bandeau cookies.
 *
 * Le back-office ne passe pas par ici. C'est ce qui garantit qu'aucune barre de
 * navigation du site — donc aucun clic ni retour arrière — ne peut mener d'une
 * page d'administration vers le site, ni l'inverse.
 */

export const metadata: Metadata = {
  title: `${NOM_COMMERCIAL} — Anniversaires foot, Bubble Foot & Team Building`,
  description:
    "Offside Foot Indoor : le complexe de foot indoor en Belgique. Anniversaires enfants dès 180 €, Bubble Foot, location de terrain et team building.",
  applicationName: NOM_COMMERCIAL,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "fr_BE",
    siteName: NOM_COMMERCIAL,
    url: "https://offside-world.vercel.app",
    title: `${NOM_COMMERCIAL} — Anniversaires foot, Bubble Foot & Team Building`,
    description:
      "Le complexe de foot indoor en Belgique. Anniversaires enfants dès 180 €, Bubble Foot, location de terrain et team building.",
    images: [
      { url: "/images/offside-foot-indoor.jpg", width: 1200, height: 630, alt: `${NOM_COMMERCIAL} — foot indoor` },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${NOM_COMMERCIAL} — Anniversaires foot, Bubble Foot & Team Building`,
    description:
      "Le complexe de foot indoor en Belgique. Anniversaires enfants dès 180 €, Bubble Foot, location de terrain et team building.",
    images: ["/images/offside-foot-indoor.jpg"],
  },
};

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const logoSrc = resolveLogoSrc();
  const photos = resolvePhotos();

  return (
    <PhotosProvider value={photos}>
      <Header logoSrc={logoSrc} />
      <main className="flex-1">{children}</main>
      <Footer logoSrc={logoSrc} />
      <CookieBannerWrapper />
    </PhotosProvider>
  );
}
