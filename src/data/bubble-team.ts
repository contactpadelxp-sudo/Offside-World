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

/*
 * Pas de `bubbleTotal()` ici. Une fonction de ce nom existait, inutilisée :
 * le montant facturé est recalculé par le serveur au moment d'écrire la
 * réservation. Un second calcul côté navigateur finirait par diverger du
 * premier, et c'est le genre d'écart qu'on découvre sur une facture.
 */

// ── Team Building ────────────────────────────────────────────────────────────

/** Participants acceptés dans une demande de devis. */
export const TEAM_BUILDING_MIN_PARTICIPANTS = 6;
export const TEAM_BUILDING_MAX_PARTICIPANTS = 60;

/*
  LES JOURS SONT CONNUS, LES HEURES NE LE SONT TOUJOURS PAS.

  Brahim a répondu le 17 septembre 2026 : lundi, mardi et jeudi matin ET
  après-midi ; vendredi matin seulement. Pas de team building le mercredi, ni
  le week-end — ces journées sont prises par les anniversaires.

  Il n'a en revanche pas donné les HEURES des demi-journées. Celles ci-dessous
  restent donc provisoires, et c'est écrit ici plutôt que supposé résolu : un
  devis part avec elles.
*/
export const TEAM_BUILDING_JOURS = [1, 2, 4, 5] as const; // ISO : lun, mar, jeu, ven

/** Le vendredi, seule la matinée est proposée. */
export const TEAM_BUILDING_JOURS_APRES_MIDI = [1, 2, 4] as const;

// TODO heures exactes à confirmer avec Brahim — les jours le sont, pas les plages.
export const TEAM_BUILDING_MATIN = { debut: "09:00", fin: "13:00" } as const;
export const TEAM_BUILDING_APRES_MIDI = { debut: "14:00", fin: "18:00" } as const;

export const TEAM_BUILDING_INCLUS = [
  "Terrain privatisé pour votre groupe",
  "Bubble Foot et matériel compris",
  "Organisation et arbitrage du tournoi",
  "Chasubles et ballons",
  "Accès aux vestiaires",
];
