/**
 * Formes de données échangées entre le serveur et le funnel.
 *
 * Ce fichier ne contient QUE des types, et n'importe rien : il peut donc être
 * lu aussi bien par un composant serveur que par un composant navigateur, sans
 * risquer d'entraîner avec lui le client de base de données.
 *
 * Les montants y sont en euros — la conversion depuis les centimes se fait au
 * moment de la lecture. Le calcul du prix facturé, lui, reste en centimes
 * entiers côté serveur.
 */

export interface FormuleVue {
  id: string;
  nom: string;
  accroche: string | null;
  description: string;
  /** en euros */
  prixBase: number;
  enfantsInclus: number;
  /** en euros */
  prixEnfantSup: number;
  enfantsMax: number;
  dureeMinutes: number;
  inclus: string[];
  /** chemin sous /images, ou null */
  image: string | null;
}

export interface OptionVue {
  id: string;
  libelle: string;
  description: string | null;
  /** en euros */
  prix: number;
}

export interface CreneauVue {
  id: string;
  espaceId: string;
  espaceNom: string;
  capacite: number;
  /** « 2026-09-05 », en heure de Bruxelles */
  jour: string;
  /** « samedi 5 septembre » */
  jourLabel: string;
  /** « 10:00 » */
  debut: string;
  /** « 12:00 » */
  fin: string;
  libre: boolean;
}

// ── Back-office ──────────────────────────────────────────────────────────────

export type StatutReservation = "en_attente" | "confirmee" | "annulee" | "expiree";
export type StatutDevis = "nouvelle" | "traitee" | "devis_envoye" | "acceptee" | "refusee";

export interface ReservationAdmin {
  id: string;
  reference: string;
  type: "anniversaire" | "bubble";
  statut: StatutReservation;
  /** en euros */
  total: number;
  formuleNom: string | null;
  nbEnfants: number | null;
  enfantPrenom: string | null;
  enfantAge: number | null;
  nbPersonnes: number | null;
  options: string[];
  clientNom: string;
  clientEmail: string;
  clientTelephone: string;
  allergies: string | null;
  remarques: string | null;
  noteInterne: string | null;
  jour: string;
  jourLabel: string;
  debut: string;
  fin: string;
  espaceNom: string | null;
  /** Vrai si le créneau est déjà passé : on n'y propose plus d'action. */
  passee: boolean;
}

export interface DevisAdmin {
  id: string;
  reference: string;
  entreprise: string;
  contactNom: string;
  contactEmail: string;
  contactTelephone: string;
  dateSouhaitee: string | null;
  periode: string | null;
  nbParticipants: number | null;
  message: string | null;
  noteInterne: string | null;
  statut: StatutDevis;
  recuLe: string;
}

export interface EntreeJournal {
  id: number;
  acteur: string;
  action: string;
  cible: string | null;
  detail: string | null;
  quand: string;
}

export interface CreneauAdmin {
  id: string;
  type: "anniversaire" | "bubble";
  espaceNom: string;
  jour: string;
  jourLabel: string;
  debut: string;
  fin: string;
  ouvert: boolean;
  /** Référence de la réservation active, si le créneau est pris. */
  reservePar: string | null;
}

export type FiltreReservations = "a-venir" | "a-confirmer" | "passees" | "annulees";
