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

/**
 * Montant écrit comme on l'écrit en Belgique : « 180 € », « 87,50 € ».
 *
 * POURQUOI PAS `${cents / 100} €`. C'est ce que faisait le code, et cela
 * suffisait tant que tous les prix étaient ronds. Ils ne le sont plus : un
 * remboursement de 50 % sur 175 € vaut 87,5, que JavaScript écrit « 87.5 » —
 * point décimal anglais et centime tronqué. Sur un e-mail qui annonce une
 * somme d'argent à un client belge, c'est exactement le genre de détail qui
 * fait douter du reste.
 *
 * La virgule et l'espace insécable sont posés à la main plutôt que par
 * `toLocaleString('fr-BE')` : le rendu de cette dernière dépend des données de
 * localisation présentes sur la machine, qui ne sont pas les mêmes dans le
 * navigateur, dans Node et dans une fonction serverless.
 */
export function montantLisible(cents: number): string {
  const negatif = cents < 0;
  const absolu = Math.abs(Math.round(cents));
  const unites = Math.floor(absolu / 100);
  const centimes = absolu % 100;
  const corps = centimes === 0 ? String(unites) : `${unites},${String(centimes).padStart(2, "0")}`;
  // Espace insécable : le montant ne doit jamais être coupé de son symbole.
  return `${negatif ? "-" : ""}${corps} €`;
}
