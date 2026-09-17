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

/*
  LES HEURES SONT `null` TANT QU'ON NE LES CONNAÎT PAS, ET CE N'EST PAS UN OUBLI.

  Elles valaient « 09:00 – 13:00 » et « 14:00 – 18:00 » — des horaires que
  personne n'a confirmés. Le client les voyait en choisissant sa demi-journée,
  puis dans son récapitulatif : une précision inventée, sur l'écran même où il
  demande un devis.

  `null` fait disparaître l'heure de l'affichage sans rien casser : il reste
  « Matin » et « Après-midi », qui sont vrais. Le jour où Brahim répond, il
  suffit de remplir ces deux constantes — les heures réapparaissent partout,
  sans toucher à une ligne d'interface.

  Écrire une heure fausse coûte plus qu'en écrire aucune : une entreprise qui
  accepte un devis s'engage sur l'horaire qu'elle y a lu.
*/
type Plage = { debut: string; fin: string } | null;

export const TEAM_BUILDING_MATIN: Plage = null;
export const TEAM_BUILDING_APRES_MIDI: Plage = null;

export const TEAM_BUILDING_INCLUS = [
  "Terrain privatisé pour votre groupe",
  "Bubble Foot et matériel compris",
  "Organisation et arbitrage du tournoi",
  "Chasubles et ballons",
  "Accès aux vestiaires",
];
