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
  /**
   * Argent réellement encaissé, s'il y en a. `null` pour une réservation payée
   * autrement qu'en ligne — c'est ce qui décide si l'annulation propose un
   * remboursement ou se contente de libérer le créneau.
   */
  paiement: {
    montantCents: number;
    rembourseCents: number;
    /** Ce que le barème d'annulation rendrait si on annulait maintenant. */
    baremeCents: number;
  } | null;
}

/**
 * Ce que l'exploitant décide de rendre en annulant.
 *
 * Ce type vit ici, et non dans le module de remboursement, pour une raison
 * mécanique : ce dernier commence par `import "server-only"`, et la fiche de
 * réservation est un composant navigateur. Un `import type` est certes effacé à
 * la compilation, mais faire dépendre — même en apparence — du code client d'un
 * module marqué serveur est le genre de fil qu'on finit par tirer.
 */
export type ChoixRemboursement = "integral" | "bareme" | "aucun";

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
  /**
   * Le devis rédigé pour cette demande. Ses lignes sont vides tant que rien
   * n'a été écrit ; `envoyeLe` est `null` tant que rien n'est parti.
   */
  devis: {
    lignes: { designation: string; quantite: number; prixUnitaireCents: number }[];
    message: string;
    /** Date de validité au format ISO, pour alimenter un champ date. */
    validite: string;
    /** Horodatage lisible de l'envoi réel, `null` si le devis n'est pas parti. */
    envoyeLe: string | null;
    /** Taux de TVA, `null` tant qu'il n'est pas renseigné. */
    tvaPourcent: number | null;
  };
  /** Coordonnées de facturation de la société cliente, saisies au back-office. */
  client: { adresse: string; tva: string };
  /** Les valeurs brutes de la demande, pour pré-remplir un devis vierge. */
  brut: { dateSouhaitee: string | null; periode: string | null; nbParticipants: number | null };
}

/**
 * Ce que le back-office envoie au serveur quand il enregistre ou expédie un
 * devis. Vit ici plutôt que dans `lib/devis.ts` pour que la fiche — un
 * composant navigateur — puisse le typer sans importer de module serveur.
 */
export interface SaisieDevis {
  lignes: { designation: string; quantite: number; prixUnitaireCents: number }[];
  message: string;
  validite: string;
  /** `null` = non renseigné, ce qui n'est pas 0 = exonéré. */
  tvaPourcent: number | null;
  clientAdresse: string;
  clientTva: string;
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

// ── Tarifs modifiables ───────────────────────────────────────────────────────

export interface FormuleAdmin {
  id: string;
  nom: string;
  accroche: string;
  description: string;
  /** en euros */
  prixBase: number;
  enfantsInclus: number;
  /** en euros */
  prixEnfantSup: number;
  enfantsMax: number;
  dureeMinutes: number;
  inclus: string[];
  actif: boolean;
}

export interface OptionAdmin {
  id: string;
  libelle: string;
  description: string;
  /** en euros */
  prix: number;
  actif: boolean;
}
