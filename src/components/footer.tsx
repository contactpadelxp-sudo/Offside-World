"use client";

import Link from "next/link";
import { openCookieSettings } from "@/components/cookie-banner";
import { Logo } from "@/components/logo";
import {
  NOM_COMMERCIAL, ADRESSE, EMAIL, TELEPHONE, TELEPHONE_TEL,
} from "@/data/entreprise";
import { Cookie, Enveloppe, Epingle, FlecheDiagonale, Telephone } from "@/components/icons";

export function Footer({ logoSrc }: { logoSrc: string | null }) {
  return (
    <footer className="mt-auto relative overflow-hidden">
      {/* Filet supérieur */}
      <div className="h-px bg-gradient-to-r from-transparent via-field/60 to-transparent" />

      <div className="bg-[#050506] text-white grain">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Marque */}
            <div className="lg:col-span-1">
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
                  { label: "Anniversaires", href: "/reservation?activite=anniversaire" },
                  { label: "Bubble Foot", href: "/reservation?activite=groupes" },
                  { label: "Louer un terrain", href: "/reservation?activite=foot" },
                  { label: "Team Building", href: "/reservation?activite=groupes" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-sm text-white/60 hover:text-white transition-colors duration-300 inline-flex items-center gap-1 group">
                      {item.label}
                      <FlecheDiagonale className="size-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
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
                  <Telephone className="size-4 text-white/60 shrink-0" />
                  <a href={`tel:${TELEPHONE_TEL}`} className="hover:text-white transition-colors">{TELEPHONE}</a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Enveloppe className="size-4 text-white/60 shrink-0" />
                  <a href={`mailto:${EMAIL}`} className="hover:text-white transition-colors">{EMAIL}</a>
                </li>
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
                    <Link href={item.href} className="text-sm text-white/60 hover:text-white transition-colors duration-300">{item.label}</Link>
                  </li>
                ))}
                <li>
                  <button onClick={openCookieSettings} className="text-sm text-white/60 hover:text-white transition-colors duration-300 inline-flex items-center gap-1.5">
                    <Cookie className="size-3.5" /> Gérer mes cookies
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bas de page */}
          <div className="mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/60">
            <p>© {new Date().getFullYear()} {NOM_COMMERCIAL}. Tous droits réservés.</p>
            <p>
              Droits RGPD :{" "}
              <a href={`mailto:${EMAIL}`} className="underline hover:text-white transition-colors">{EMAIL}</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
