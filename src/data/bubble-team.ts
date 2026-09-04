/**
 * Bubble Foot et Team Building — regroupés sur une même offre « groupes ».
 *
 * Bubble Foot : tarif à la personne, à l'heure. Ses créneaux vivent en base
 * (table `creneaux`, type « bubble ») ; seul le tarif reste ici.
 * Team Building : privatisation à la demi-journée, sur devis, donc sans créneau.
 */

// ── Bubble Foot ──────────────────────────────────────────────────────────────

/**
 * Tarif du Bubble Foot.
 *
 * Volontairement hors de la table `formules` : celle-ci décrit des forfaits
 * (un prix de base + un supplément par enfant), alors que le Bubble Foot se
 * facture à la personne. Ces trois constantes sont donc la SEULE source du
 * tarif Bubble — rien ne les duplique en base, et le serveur les relit au
 * moment de calculer le total. À déplacer dans une table dédiée le jour où le
 * tarif devra changer sans redéploiement.
 */
export const BUBBLE_PRIX_PAR_PERSONNE = 23; // €
export const BUBBLE_MIN_PERSONNES = 6;
export const BUBBLE_MAX_PERSONNES = 20;
export const BUBBLE_DUREE_MINUTES = 60;

export function bubbleTotal(nbPersonnes: number): number {
  return BUBBLE_PRIX_PAR_PERSONNE * Math.max(BUBBLE_MIN_PERSONNES, nbPersonnes);
}

// ── Team Building ────────────────────────────────────────────────────────────

/** Le team building se réserve à la demi-journée, tarif sur devis. */
export const TEAM_BUILDING_SUR_DEVIS = true;

/** Participants acceptés dans une demande de devis. */
export const TEAM_BUILDING_MIN_PARTICIPANTS = 6;
export const TEAM_BUILDING_MAX_PARTICIPANTS = 60;

// TODO horaires à confirmer avec Brahim (plages de demi-journée réelles).
export const TEAM_BUILDING_MATIN = { debut: "09:00", fin: "13:00" } as const;
export const TEAM_BUILDING_APRES_MIDI = { debut: "14:00", fin: "18:00" } as const;

export const TEAM_BUILDING_INCLUS = [
  "Terrain privatisé pour votre groupe",
  "Bubble Foot et matériel compris",
  "Organisation et arbitrage du tournoi",
  "Chasubles et ballons",
  "Accès aux vestiaires",
];
