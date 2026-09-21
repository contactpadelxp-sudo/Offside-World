/**
 * Règles commerciales et opérationnelles du complexe.
 * Source unique : ces valeurs alimentent le funnel, les CGV et les pages légales.
 */

/** Délai minimum entre la réservation et le début de l'activité (heures). */
export const DELAI_RESERVATION_HEURES = 1;

/**
 * Âge minimum de la personne fêtée, tous forfaits confondus.
 *
 * « À partir de 4 ans », répondu par Brahim le 17 septembre 2026. C'est une
 * règle du COMPLEXE et non d'une formule : elle n'a donc pas sa place dans la
 * table `formules`, où elle serait à tenir d'accord ligne par ligne.
 *
 * Le maximum, lui, EST par formule — colonne `formules.age_max`, `null` pour
 * « pas de limite ». Les deux formules y sont sans limite aujourd'hui ; le
 * champ existe pour que l'exploitant puisse fermer un forfait aux adultes d'un
 * réglage, pas parce qu'on l'a décidé pour lui.
 */
export const AGE_MINIMUM = 4;

/**
 * Jusqu'où va la LISTE proposée dans le tunnel — pas une limite d'âge.
 *
 * Au-delà, dérouler des dizaines de lignes coûte plus qu'il ne sert. Quelqu'un
 * qui fête ses 75 ans est assez rare pour qu'un appel règle le cas, et assez
 * rare pour ne pas allonger la liste de tout le monde.
 */
export const AGE_MAXIMUM_LISTE = 60;

/**
 * Garde-fou de saisie côté serveur : au-delà, un nombre n'est plus un âge.
 * La vraie limite commerciale est `formules.age_max`, vérifiée juste après.
 */
export const AGE_ABSURDE_AU_DELA = 120;

/*
 * Anniversaires simultanés et battement entre deux groupes : ces deux règles
 * ne sont plus des constantes ici. Elles sont désormais inscrites dans la base,
 * là où elles s'appliquent réellement :
 *   - le nombre d'anniversaires en parallèle est le nombre d'espaces actifs
 *     (table `espaces`) ;
 *   - le battement est l'espacement des créneaux produits par
 *     `generer_creneaux_anniversaire()`, et la contrainte d'exclusion sur
 *     `creneaux` interdit tout chevauchement.
 * Les redéclarer ici créerait une seconde vérité, qui divergerait au premier
 * changement d'horaire.
 */

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
  // Le texte est toujours précédé du mot « Annulation » dans l'interface et
  // dans les e-mails : le répéter ici donnait « Annulation : Annulation
  // gratuite… ». Espaces insécables avant % pour que le nombre ne se sépare
  // pas de son symbole en fin de ligne.
  "Gratuite jusqu'à 7 jours avant. Entre 7 jours et 48 heures : 50 % remboursés. Moins de 48 heures : aucun remboursement.";

/**
 * Part remboursée pour une annulation intervenant `heuresAvant` heures
 * avant le début de l'activité.
 *
 * ELLE EST DÉSORMAIS EN SERVICE. Écrite avant que rien n'encaisse, elle est
 * appelée depuis le 15 septembre 2026 par `montantARembourser()`, donc par
 * chaque annulation faite au barème depuis le back-office. C'est elle qui
 * décide de la somme réellement renvoyée chez Stripe.
 *
 * Elle traduit en calcul le barème affiché au client et repris dans les CGV.
 * `reglement.test.ts` verrouille les deux ensemble : la phrase publiée et les
 * paliers calculés ne peuvent plus diverger sans faire échouer un test.
 */
export function partRemboursee(heuresAvant: number): number {
  const palier = PALIERS_ANNULATION.find((p) => heuresAvant >= p.seuilHeures);
  return palier ? palier.remboursement : 0;
}
