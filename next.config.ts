import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
// Vercel renseigne VERCEL_ENV au moment du build : "production" | "preview" | "development".
const isPreview = process.env.VERCEL_ENV === "preview";

/** Ajoute des hôtes à une directive, uniquement sur les déploiements de preview. */
const preview = (hosts: string) => (isPreview ? ` ${hosts}` : "");

/**
 * Politique de sécurité du contenu (CSP).
 * Chaque assouplissement conservé ci-dessous a été vérifié sur le build réel
 * (Next 16.2.7, Turbopack) : ce ne sont pas des précautions de principe.
 *
 * CE QUI RESTE PERMISSIF, ET POURQUOI
 *
 * - script-src 'unsafe-inline' : chaque page prérendue porte des <script> inline
 *   sans src qui transportent la charge RSC (self.__next_f.push). Un attribut
 *   `integrity` ne peut pas exister sur un script inline : SRI ne peut donc pas
 *   les couvrir. La seule alternative est la nonce, qui impose le rendu dynamique
 *   de toutes les pages — on perdrait le prérendu des 14 routes.
 * - style-src 'unsafe-inline' : Framer Motion sérialise ses états initiaux en
 *   attributs style="", qu'aucune nonce ne couvre (une nonce ne vaut que pour les
 *   balises <style>). Les pages d'erreur embarquent en plus une vraie <style>.
 * - img-src data: : trois background-image en data:image/svg+xml dans le CSS
 *   compilé (grain et motifs de terrain, globals.css).
 *
 * CE QUI A ÉTÉ RETIRÉ
 *
 * - 'unsafe-eval' en production : aucun eval ni constructeur Function dans
 *   .next/static, hormis Function("return this") dans le polyfill hérité servi
 *   en noModule — donc jamais chargé par un navigateur moderne. three, lenis et
 *   framer-motion en sont exempts. Conservé en développement, où React s'en sert
 *   pour reconstruire les traces d'erreur.
 * - img-src https: et blob: : aucune image distante, aucun remotePatterns, tout
 *   passe par /_next/image en même origine. `https:` autorisait n'importe quel
 *   hôte, donc l'exfiltration de données par une balise <img>.
 * - font-src data: : les trois familles next/font/google sont téléchargées au
 *   build et auto-hébergées en .woff2. Aucune @font-face en data:.
 * - worker-src blob: devient 'none' : aucun `new Worker` dans le projet ni dans
 *   les chunks de production. `blob:` permettait de contourner script-src.
 * - base-uri 'self' devient 'none' : aucune balise <base> dans les pages.
 *
 * CE QUI A ÉTÉ AJOUTÉ
 *
 * - script-src-attr 'none' : bloque les gestionnaires inline (onclick="...") que
 *   'unsafe-inline' autoriserait sinon. Aucun attribut on* dans les pages rendues.
 * - frame-src 'none' : aucune iframe dans le projet.
 * - branche isPreview : la Vercel Toolbar, injectée sur les déploiements de
 *   preview uniquement, charge des ressources tierces que cette CSP bloquerait.
 *   La production n'est pas concernée. Si la Toolbar est désactivée sur le projet,
 *   supprimer isPreview, le helper `preview` et ses appels.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${preview("https://vercel.live")}`,
  "script-src-attr 'none'",
  `style-src 'self' 'unsafe-inline'${preview("https://vercel.live")}`,
  `img-src 'self' data:${preview("https://vercel.live https://vercel.com")}`,
  `font-src 'self'${preview("https://vercel.live https://assets.vercel.com")}`,
  `connect-src 'self'${preview("https://vercel.live wss://ws-us3.pusher.com")}`,
  "media-src 'self'",
  "worker-src 'none'",
  `frame-src ${isPreview ? "https://vercel.live" : "'none'"}`,
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        /*
         * Le back-office affiche des noms, des téléphones, des prénoms et des
         * âges d'enfants. Rien de tout cela ne doit être conservé par un CDN,
         * un proxy d'entreprise ou le cache du navigateur : une page encore en
         * cache reste lisible après la déconnexion, et se sert sans repasser
         * par l'authentification.
         *
         * `src/proxy.ts` pose déjà ces en-têtes ; les redéclarer ici les rend
         * indépendants d'une éventuelle modification du matcher du proxy.
         */
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
      {
        source: "/admin",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};

export default nextConfig;
