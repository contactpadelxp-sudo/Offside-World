"use client";

import { useEffect } from "react";

/**
 * Ramène la fenêtre en haut de page à chaque changement de `key`.
 *
 * Le tunnel de réservation change d'étape sans changer d'URL : sans cela,
 * un visiteur qui clique « Continuer » en bas d'une étape longue arrive
 * sur l'étape suivante toujours positionné en bas.
 *
 * Le saut est instantané (et non animé) pour reproduire le comportement
 * d'un vrai changement de page : `html` porte `scroll-smooth`, qui
 * animerait sinon un long défilement à chaque étape.
 */
export function useScrollTop(key: unknown) {
  useEffect(() => {
    // `instant` ignore scroll-smooth ; on retombe sur un scroll direct si besoin.
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [key]);
}
