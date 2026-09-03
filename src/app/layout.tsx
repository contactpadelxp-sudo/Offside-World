import type { Metadata, Viewport } from "next";
import { Space_Grotesk, DM_Sans, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/header";
import { resolveLogoSrc } from "@/lib/logo";
import { NOM_COMMERCIAL } from "@/data/entreprise";
import { Footer } from "@/components/footer";
import { CookieBannerWrapper } from "@/components/cookie-banner";
import "./globals.css";

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
  metadataBase: new URL("https://offside-world.vercel.app"),
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

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const logoSrc = resolveLogoSrc();

  return (
    <html
      lang="fr"
      className={`${spaceGrotesk.variable} ${dmSans.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header logoSrc={logoSrc} />
        <main className="flex-1">{children}</main>
        <Footer logoSrc={logoSrc} />
        <CookieBannerWrapper />
      </body>
    </html>
  );
}
