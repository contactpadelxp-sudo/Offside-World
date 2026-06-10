"use client";

import Link from "next/link";
import { openCookieSettings } from "@/components/cookie-banner";
import { Mail, Cookie, MapPin, Phone, Building2, ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto relative overflow-hidden">
      {/* Gradient top border */}
      <div className="h-1 bg-gradient-to-r from-field via-kick to-field" />

      <div className="bg-[#08130c] text-white grain">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-field to-field-dark text-white text-sm font-bold">
                  OW
                </div>
                <span className="text-lg font-bold font-[family-name:var(--font-heading)]">
                  Offside World
                </span>
              </div>
              <p className="mt-4 text-sm text-white/60 leading-relaxed">
                Votre complexe de foot indoor pour anniversaires, entrées libres,
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
                  { label: "Entrées libres", href: "/reservation?activite=libre" },
                  { label: "Location de terrain", href: "/reservation?activite=foot" },
                  { label: "Team Building", href: "/reservation?activite=team-building" },
                ].map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-white/60 hover:text-white transition-colors duration-300 inline-flex items-center gap-1 group">
                      {item.label}
                      <ArrowUpRight className="size-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300" />
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
                <li className="flex items-center gap-2.5"><Building2 className="size-4 text-white/60" />BELANTIS</li>
                <li className="flex items-center gap-2.5"><MapPin className="size-4 text-white/60" />[Adresse à compléter]</li>
                <li className="flex items-center gap-2.5"><Phone className="size-4 text-white/60" />[Téléphone]</li>
                <li className="flex items-center gap-2.5">
                  <Mail className="size-4 text-white/60" />
                  <a href="mailto:contact@offsideworld.be" className="hover:text-white transition-colors">contact@offsideworld.be</a>
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
                  { label: "Confidentialité", href: "/confidentialite" },
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

          {/* Bottom */}
          <div className="mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/60">
            <p>© {new Date().getFullYear()} Offside World — BELANTIS. Tous droits réservés.</p>
            <p>
              Droits RGPD :{" "}
              <a href="mailto:rgpd@offsideworld.be" className="underline hover:text-white transition-colors">rgpd@offsideworld.be</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
