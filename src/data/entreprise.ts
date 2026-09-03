/**
 * Identité de l'entreprise — source unique pour les pages légales,
 * le pied de page et les écrans de réservation.
 *
 * Valeurs issues des documents fournis par le client (version du
 * 1er septembre 2026). Les champs `null` restent à compléter : ils
 * s'affichent alors comme « [à compléter] » sur le site.
 */

export const NOM_COMMERCIAL = "Offside Foot Indoor";

/** Dénomination sociale (raison sociale) — à compléter. */
export const DENOMINATION_SOCIALE: string | null = null;

/** Siège social s'il diffère de l'adresse d'exploitation. */
export const SIEGE_SOCIAL: string | null = null;

/** Numéro d'entreprise à la Banque-Carrefour des Entreprises. */
export const BCE: string | null = null;

/** Numéro de TVA (sans le préfixe « BE »). */
export const TVA: string | null = null;

/** Responsable de la publication du site. */
export const RESPONSABLE_PUBLICATION: string | null = null;

export const ADRESSE = {
  rue: "Rue des Orchidées 6",
  codePostal: "5030",
  ville: "Gembloux",
  pays: "Belgique",
} as const;

export const ADRESSE_LIGNE = `${ADRESSE.rue}, ${ADRESSE.codePostal} ${ADRESSE.ville}, ${ADRESSE.pays}`;

export const EMAIL = "info@offsidefootindoor.be";
export const TELEPHONE = "0471/34.21.80";
/** Format international, pour les liens tel: */
export const TELEPHONE_TEL = "+32471342180";

/** Date de la dernière mise à jour des documents légaux. */
export const MAJ_LEGALE = "1er septembre 2026";

/** Affiche une valeur ou un marqueur explicite si elle n'est pas encore renseignée. */
export function ouACompleter(valeur: string | null, libelle = "à compléter"): string {
  return valeur ?? `[${libelle}]`;
}
