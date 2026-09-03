import type { Metadata, Viewport } from "next";
import { Space_Grotesk, DM_Sans, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/header";
import { resolveLogoSrc } from "@/lib/logo";
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
  title: "Offside World — Anniversaires foot, Bubble Foot & Team Building",
  description:
    "Offside World : le complexe de foot indoor en Belgique. Anniversaires enfants dès 180 €, Bubble Foot, location de terrain et team building.",
  applicationName: "Offside World",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "fr_BE",
    siteName: "Offside World",
    url: "https://offside-world.vercel.app",
    title: "Offside World — Anniversaires foot, Bubble Foot & Team Building",
    description:
      "Le complexe de foot indoor en Belgique. Anniversaires enfants dès 180 €, Bubble Foot, location de terrain et team building.",
    images: [
      { url: "/images/offside-foot-indoor.jpg", width: 1200, height: 630, alt: "Offside World — foot indoor" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Offside World — Anniversaires foot, Bubble Foot & Team Building",
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
  return (
    <html
      lang="fr"
      className={`${spaceGrotesk.variable} ${dmSans.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header logoSrc={resolveLogoSrc()} />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieBannerWrapper />
      </body>
    </html>
  );
}
