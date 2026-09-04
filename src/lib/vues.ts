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
