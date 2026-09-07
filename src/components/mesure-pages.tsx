"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { mesurer } from "@/lib/mesure";

/**
 * Déclenche une « page vue » à chaque changement d'URL.
 *
 * Monté une seule fois dans le gabarit du site public — jamais dans le
 * back-office, qui n'a pas à être mesuré.
 *
 * Il écoute aussi `cookie-consent` : un visiteur qui accepte la mesure après
 * avoir chargé la page doit voir sa visite comptée à partir de ce moment-là,
 * sans quoi on perdrait la première page de presque tout le monde — c'est
 * justement celle qui dit d'où les gens viennent.
 */
export function MesurePages() {
  const chemin = usePathname();

  useEffect(() => {
    mesurer("page");

    const auConsentement = () => mesurer("page");
    window.addEventListener("cookie-consent", auConsentement);
    return () => window.removeEventListener("cookie-consent", auConsentement);
  }, [chemin]);

  return null;
}
