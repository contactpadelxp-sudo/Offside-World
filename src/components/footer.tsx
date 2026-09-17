"use client";

import Link from "next/link";
import { openCookieSettings } from "@/components/cookie-banner";
import { Logo } from "@/components/logo";
import {
  NOM_COMMERCIAL, ADRESSE, EMAIL,
} from "@/data/entreprise";
import { Cookie, Enveloppe, Epingle, FlecheDiagonale } from "@/components/icons";
import { hrefActivite } from "@/data/activites";

export function Footer({ logoSrc }: { logoSrc: string | null }) {
  return (
    <footer className="mt-auto relative overflow-hidden">
      {/* Filet supérieur */}
      <div className="h-px bg-gradient-to-r from-transparent via-field/60 to-transparent" />

      <div className="bg-[#050506] text-white grain">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-12 sm:py-16">
          {/*
            DEUX COLONNES DÈS LE TÉLÉPHONE.

            En une seule, le pied de page faisait près de 1200 px — deux écrans
            entiers de liens à faire défiler avant d'atteindre les mentions. Les
            deux listes de liens (Activités, Légal) tiennent côte à côte même à
            320 px ; la marque et le bloc Contact, eux, gardent toute la largeur
            parce que l'adresse et l'e-mail ne se replient pas proprement dans
            une demi-colonne.

            L'ordre du DOM suit l'ordre visible — on n'utilise pas `order-*` —
            pour qu'un lecteur d'écran parcoure le pied de page dans l'ordre où
            il s'affiche.
          */}
          {/*
            `[&>*]:min-w-0` : SANS LUI, LE PIED DE PAGE COUPE SES PROPRES LIENS.

            Un élément de grille a `min-width: auto` : il refuse de rétrécir
            sous la largeur minimale de son contenu. Mesuré sur 390 px avec la
            police doublée — critère 1.4.4 du WCAG — la colonne réclamait plus
            de place qu'elle n'en avait, et « Politique de confidentialité »
            sortait de 15 px. Le pied de page étant en `overflow-hidden`, la
            page ne défilait pas : le lien était simplement TRONQUÉ, ce qui est
            pire — on perd du contenu sans aucun signe.

            `min-w-0` seul ne suffit pas : les liens sont en `inline-flex`,
            donc dimensionnés sur leur contenu. Leur boîte grandit au lieu de
            contraindre la ligne, et la césure automatique du `<body>` ne peut
            jamais s'appliquer. `max-w-full` borne cette boîte à la colonne —
            la coupure de mot redevient possible, et le mot passe à la ligne.

            Rien ne change à taille de texte normale : sans débordement, il n'y
            a rien à couper.
          */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4 [&>*]:min-w-0 [&_a]:max-w-full [&_button]:max-w-full">
            {/* Marque */}
            <div className="col-span-2 lg:col-span-1">
              <Link href="/" aria-label={`${NOM_COMMERCIAL} — accueil`} className="inline-flex items-center">
                <Logo src={logoSrc} height={44} className="h-10 md:h-11" textClassName="text-lg" />
              </Link>
              <p className="mt-4 text-sm text-white/60 leading-relaxed">
                Votre complexe de foot indoor pour anniversaires, Bubble Foot,
                location de terrain et team building.
              </p>
            </div>

            {/* Activités */}
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                Activités
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Anniversaires", href: hrefActivite("anniversaire") },
                  { label: "Bubble Foot", href: hrefActivite("groupes") },
                  { label: "Louer un terrain", href: hrefActivite("foot") },
                  { label: "Team Building", href: hrefActivite("groupes") },
                  { label: "Blog", href: "/blog" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-sm text-white/60 hover:text-white transition-colors duration-300 inline-flex min-h-6 items-center gap-1 py-0.5 group">
                      {item.label}
                      <FlecheDiagonale className="size-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Légal */}
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                Légal
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Mentions légales", href: "/mentions-legales" },
                  { label: "Politique de confidentialité", href: "/confidentialite" },
                  { label: "Cookies", href: "/politique-cookies" },
                  { label: "CGV", href: "/cgv" },
                  { label: "CGU", href: "/cgu" },
                ].map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="inline-flex min-h-6 items-center py-0.5 text-sm text-white/60 hover:text-white transition-colors duration-300">{item.label}</Link>
                  </li>
                ))}
                <li>
                  <button onClick={openCookieSettings} className="inline-flex min-h-6 items-center gap-1.5 py-0.5 text-left text-sm text-white/60 hover:text-white transition-colors duration-300">
                    <Cookie className="size-3.5 shrink-0" /> Gérer mes cookies
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="col-span-2 lg:col-span-1">
              <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                Contact
              </h4>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li className="flex items-start gap-2.5">
                  <Epingle className="size-4 text-white/60 shrink-0 mt-0.5" />
                  <address className="not-italic">
                    {ADRESSE.rue}<br />
                    {ADRESSE.codePostal} {ADRESSE.ville}, {ADRESSE.pays}
                  </address>
                </li>
                <li className="flex items-center gap-2.5">
                  <Enveloppe className="size-4 text-white/60 shrink-0" />
                  <a href={`mailto:${EMAIL}`} className="inline-flex min-h-6 items-center py-0.5 break-all hover:text-white transition-colors">{EMAIL}</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bas de page */}
          <div className="mt-10 sm:mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 text-center text-xs text-white/60 sm:text-left">
            <p>© {new Date().getFullYear()} {NOM_COMMERCIAL}. Tous droits réservés.</p>
            <p>
              Droits RGPD :{" "}
              <a
                href={`mailto:${EMAIL}`}
                className="inline-flex min-h-6 items-center py-0.5 underline hover:text-white transition-colors"
              >
                {EMAIL}
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
