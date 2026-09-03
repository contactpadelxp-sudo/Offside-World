/**
 * Bubble Foot et Team Building — regroupés sur une même offre « groupes ».
 *
 * Bubble Foot : tarif à la personne, à l'heure.
 * Team Building : privatisation à la demi-journée, sur devis.
 */

// ── Bubble Foot ──────────────────────────────────────────────────────────────

export const BUBBLE_PRIX_PAR_PERSONNE = 23; // €
export const BUBBLE_MIN_PERSONNES = 6;
export const BUBBLE_DUREE_MINUTES = 60;

export interface BubbleSlot {
  id: string;
  date: string; // "YYYY-MM-DD"
  start: string; // "HH:mm"
  end: string;
  available: boolean;
}

// Créneaux de démonstration — à remplacer par le planning réel.
export const bubbleSlots: BubbleSlot[] = [
  { id: "b1", date: "2026-09-12", start: "18:00", end: "19:00", available: true },
  { id: "b2", date: "2026-09-12", start: "19:00", end: "20:00", available: false },
  { id: "b3", date: "2026-09-12", start: "20:00", end: "21:00", available: true },
  { id: "b4", date: "2026-09-13", start: "14:00", end: "15:00", available: true },
  { id: "b5", date: "2026-09-13", start: "15:00", end: "16:00", available: true },
  { id: "b6", date: "2026-09-13", start: "18:00", end: "19:00", available: true },
  { id: "b7", date: "2026-09-19", start: "18:00", end: "19:00", available: true },
  { id: "b8", date: "2026-09-19", start: "19:00", end: "20:00", available: true },
];

export function bubbleTotal(nbPersonnes: number): number {
  return BUBBLE_PRIX_PAR_PERSONNE * Math.max(BUBBLE_MIN_PERSONNES, nbPersonnes);
}

// ── Team Building ────────────────────────────────────────────────────────────

export interface DemiJournee {
  id: string;
  date: string; // "YYYY-MM-DD"
  periode: "Matin" | "Après-midi";
  start: string;
  end: string;
  available: boolean;
}

/** Le team building se réserve à la demi-journée, tarif sur devis. */
export const TEAM_BUILDING_SUR_DEVIS = true;

// TODO horaires à confirmer avec Brahim (plages de demi-journée réelles).
export const demiJournees: DemiJournee[] = [
  { id: "tb1", date: "2026-09-14", periode: "Matin", start: "09:00", end: "13:00", available: true },
  { id: "tb2", date: "2026-09-14", periode: "Après-midi", start: "14:00", end: "18:00", available: true },
  { id: "tb3", date: "2026-09-15", periode: "Matin", start: "09:00", end: "13:00", available: false },
  { id: "tb4", date: "2026-09-15", periode: "Après-midi", start: "14:00", end: "18:00", available: true },
  { id: "tb5", date: "2026-09-17", periode: "Matin", start: "09:00", end: "13:00", available: true },
  { id: "tb6", date: "2026-09-17", periode: "Après-midi", start: "14:00", end: "18:00", available: true },
];

export const TEAM_BUILDING_INCLUS = [
  "Terrain privatisé pour votre groupe",
  "Bubble Foot et matériel compris",
  "Organisation et arbitrage du tournoi",
  "Chasubles et ballons",
  "Accès aux vestiaires",
];
