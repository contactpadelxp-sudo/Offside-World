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

/**
 * Téléphone public — retiré du site à la demande du client.
 *
 * Tous les affichages (pied de page, pages légales, e-mails, page d'erreur)
 * sont désormais conditionnels ou reformulés autour de l'e-mail : redonner une
 * valeur à ces deux constantes ne suffirait donc PAS à le faire réapparaître,
 * il faudrait rétablir les blocs correspondants. L'e-mail reste le moyen de
 * contact direct, ce que la loi exige (Code de droit économique, art. III.74).
 */
export const TELEPHONE: string | null = null;
/** Format international, pour les liens tel:. */
export const TELEPHONE_TEL: string | null = null;

/** Date de la dernière mise à jour des documents légaux. */
export const MAJ_LEGALE = "1er septembre 2026";

/** Affiche une valeur ou un marqueur explicite si elle n'est pas encore renseignée. */
export function ouACompleter(valeur: string | null, libelle = "à compléter"): string {
  return valeur ?? `[${libelle}]`;
}
