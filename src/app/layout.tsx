import type { Metadata, Viewport } from "next";
import { Space_Grotesk, DM_Sans, JetBrains_Mono } from "next/font/google";
import { NOM_COMMERCIAL } from "@/data/entreprise";
import { URL_SITE } from "@/lib/site";
import "./globals.css";

/**
 * Racine commune au site public et au back-office : polices, feuille de style,
 * balises <html> et <body>. Rien d'autre.
 *
 * Tout ce qui appartient au site vitrine — en-tête, pied de page, bandeau
 * cookies, métadonnées de partage — vit dans `(site)/layout.tsx`. Le
 * back-office a le sien dans `(admin)/layout.tsx`. Les deux coquilles sont
 * ainsi étanches : aucune barre de navigation du site n'existe dans le
 * back-office, et aucun lien ne mène de l'un à l'autre.
 */

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITE),
  title: NOM_COMMERCIAL,
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${spaceGrotesk.variable} ${dmSans.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
