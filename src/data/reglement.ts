/**
 * Règles commerciales et opérationnelles du complexe.
 * Source unique : ces valeurs alimentent le funnel, les CGV et les pages légales.
 */

/** Délai minimum entre la réservation et le début de l'activité (heures). */
export const DELAI_RESERVATION_HEURES = 1;

/** Nombre d'anniversaires pouvant se dérouler simultanément. */
export const ANNIVERSAIRES_SIMULTANES = 2;

/** Battement entre deux anniversaires successifs, pour le changement (minutes). */
export const BATTEMENT_MINUTES = 30;

export interface PalierAnnulation {
  /** Délai avant l'activité, en heures. */
  seuilHeures: number;
  /** Part remboursée, de 0 à 1. */
  remboursement: number;
  label: string;
}

/**
 * Barème d'annulation, du plus favorable au moins favorable.
 * On applique le premier palier dont le délai restant est supérieur au seuil.
 */
export const PALIERS_ANNULATION: PalierAnnulation[] = [
  { seuilHeures: 7 * 24, remboursement: 1, label: "Plus de 7 jours avant : remboursement intégral" },
  { seuilHeures: 48, remboursement: 0.5, label: "Entre 7 jours et 48 heures avant : remboursement de 50 %" },
  { seuilHeures: 0, remboursement: 0, label: "Moins de 48 heures avant : aucun remboursement" },
];

/** Résumé du barème, en une phrase, pour les écrans de réservation. */
export const RESUME_ANNULATION =
  "Annulation gratuite jusqu'à 7 jours avant. Entre 7 jours et 48 heures : 50 % remboursés. Moins de 48 heures : aucun remboursement.";

/**
 * Part remboursée pour une annulation intervenant `heuresAvant` heures
 * avant le début de l'activité.
 */
export function partRemboursee(heuresAvant: number): number {
  const palier = PALIERS_ANNULATION.find((p) => heuresAvant >= p.seuilHeures);
  return palier ? palier.remboursement : 0;
}
