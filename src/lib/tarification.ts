import { BUBBLE_PRIX_PAR_PERSONNE } from "@/data/bubble-team";

/**
 * Calcul des montants facturés.
 *
 * POURQUOI CE FICHIER EXISTE. Ces deux formules étaient écrites au milieu des
 * Server Actions, entre la validation des champs et l'écriture en base. Elles
 * étaient donc impossibles à vérifier autrement qu'en passant une vraie
 * réservation : c'est le seul endroit du projet où une erreur se traduit
 * directement en euros, et c'était le seul qu'aucun test ne pouvait atteindre.
 *
 * Rien n'a changé dans le calcul lui-même — seulement son emplacement.
 *
 * TOUT EST EN CENTIMES ENTIERS, jamais en euros flottants. `0.1 + 0.2` vaut
 * `0.30000000000000004` en JavaScript ; sur un total de 234,50 € cela finirait
 * par produire un centime d'écart entre ce que le client voit, ce que la base
 * enregistre et ce que Stripe encaisse. La conversion en euros n'a lieu qu'à
 * l'affichage.
 */

export interface TarifFormule {
  prixBaseCents: number;
  /** Enfants déjà compris dans le forfait. */
  enfantsInclus: number;
  /** Prix de chaque enfant au-delà de `enfantsInclus`. */
  prixEnfantSupCents: number;
}

/**
 * Total d'un anniversaire : le forfait, plus les enfants au-delà de ceux
 * qu'il comprend, plus les options choisies.
 *
 * `Math.max(0, …)` n'est pas décoratif : sans lui, une fête de 6 enfants sur
 * un forfait qui en comprend 10 produirait un supplément NÉGATIF, donc une
 * réduction que personne n'a décidée.
 */
export function totalAnniversaireCents(
  formule: TarifFormule,
  nbEnfants: number,
  prixOptionsCents: number[] = []
): number {
  const enfantsEnSupplement = Math.max(0, nbEnfants - formule.enfantsInclus);
  const supplements = enfantsEnSupplement * formule.prixEnfantSupCents;
  const options = prixOptionsCents.reduce((somme, prix) => somme + prix, 0);
  return formule.prixBaseCents + supplements + options;
}

/**
 * Total d'un Bubble Foot : un prix par personne, sans forfait ni option.
 *
 * Le tarif est une constante du code et non une ligne de la table `formules` :
 * il ne se facture pas de la même manière, et la page de réservation le dit
 * explicitement. C'est la seule exception, et elle est assumée.
 */
export function totalBubbleCents(nbPersonnes: number): number {
  return BUBBLE_PRIX_PAR_PERSONNE * 100 * nbPersonnes;
}

/** Centimes vers euros, pour l'affichage et les e-mails uniquement. */
export function enEuros(cents: number): number {
  return cents / 100;
}
