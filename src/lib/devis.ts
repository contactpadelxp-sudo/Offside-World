import { TEAM_BUILDING_MIN_PARTICIPANTS } from "@/data/bubble-team";

/**
 * Le devis de team building : ses lignes, son total, et ce qui le rend valide.
 *
 * POURQUOI CE FICHIER EST À PART. Comme `tarification.ts`, c'est un endroit où
 * une erreur se traduit directement en euros — sauf qu'ici l'euro part par
 * e-mail à une entreprise, avec une date de validité, ce qui engage le vendeur
 * sur son prix. Isolé du composant qui l'affiche et de l'action qui l'envoie,
 * le calcul est vérifiable par des tests plutôt que par un envoi réel.
 *
 * TOUT EST EN CENTIMES ENTIERS. Un prix unitaire saisi en euros flottants
 * produirait, sur 23 participants, un écart d'un centime entre ce que
 * l'exploitant voit, ce que le client reçoit et ce qui sera facturé.
 */

export interface LigneDevis {
  designation: string;
  quantite: number;
  prixUnitaireCents: number;
}

export interface Devis {
  lignes: LigneDevis[];
  /** Mot d'introduction libre, repris en tête de l'e-mail. */
  message: string;
  /** Date de fin de validité, au format ISO `AAAA-MM-JJ`. */
  validite: string;
  /**
   * Taux de TVA appliqué, en pourcent. `null` signifie « non renseigné » —
   * et ce n'est PAS 0, qui signifierait exonéré. Tant qu'il est nul, le devis
   * s'affiche en TVAC sans détail ; renseigné, il ventile base, TVA et total.
   */
  tvaPourcent: number | null;
}

/**
 * Les trois montants d'un devis.
 *
 * QUAND LE TAUX EST INCONNU, ON NE VENTILE PAS. Il serait tentant de supposer
 * 21 % et de reconstituer une base HTVA — c'est exactement ce qu'il ne faut
 * pas faire. Le taux applicable à une privatisation de complexe sportif n'est
 * pas une évidence, et un chiffre inventé sur un document comptable est pire
 * qu'un chiffre absent. Sans taux, le total EST le total, sans décomposition.
 */
export interface MontantsDevis {
  /** Somme des lignes, telle que saisie. */
  baseCents: number;
  /** Montant de TVA, ou `null` si le taux n'est pas renseigné. */
  tvaCents: number | null;
  /** Ce que le client paiera. */
  totalCents: number;
}

export function montantsDevis(lignes: LigneDevis[], tvaPourcent: number | null): MontantsDevis {
  const baseCents = totalDevisCents(lignes);
  if (tvaPourcent === null || !Number.isFinite(tvaPourcent)) {
    return { baseCents, tvaCents: null, totalCents: baseCents };
  }
  // Arrondi au centime sur le TOTAL de la TVA, pas ligne à ligne : c'est la
  // règle usuelle, et arrondir chaque ligne ferait dériver le total de
  // quelques centimes sur un devis à dix postes.
  const tvaCents = Math.round((baseCents * tvaPourcent) / 100);
  return { baseCents, tvaCents, totalCents: baseCents + tvaCents };
}

/** Total d'une ligne. */
export function totalLigneCents(l: LigneDevis): number {
  return Math.round(l.quantite * l.prixUnitaireCents);
}

/** Total du devis. */
export function totalDevisCents(lignes: LigneDevis[]): number {
  return lignes.reduce((somme, l) => somme + totalLigneCents(l), 0);
}

/**
 * Une ligne est-elle exploitable ?
 *
 * Une désignation vide produirait sur le devis du client une ligne anonyme
 * avec un prix — exactement ce qu'on ne veut pas lui envoyer. Une quantité
 * nulle ou négative n'a pas de sens non plus.
 */
export function ligneValide(l: LigneDevis): boolean {
  return (
    l.designation.trim().length > 0 &&
    Number.isInteger(l.quantite) &&
    l.quantite > 0 &&
    Number.isInteger(l.prixUnitaireCents) &&
    l.prixUnitaireCents >= 0
  );
}

/**
 * Ce qui empêche d'envoyer, dit en clair.
 *
 * Rendu à l'écran sous le bouton plutôt que découvert après le clic : c'est le
 * même principe que le bouton de réservation du tunnel, qui refusait sans
 * dire pourquoi.
 */
export function obstaclesEnvoi(d: Devis): string[] {
  const obstacles: string[] = [];
  const exploitables = d.lignes.filter(ligneValide);

  if (exploitables.length === 0) {
    obstacles.push("au moins une ligne avec une désignation et une quantité");
  }
  if (d.lignes.length !== exploitables.length) {
    obstacles.push("de compléter ou de retirer les lignes incomplètes");
  }
  if (totalDevisCents(exploitables) <= 0) {
    obstacles.push("un montant supérieur à zéro");
  }
  if (!d.validite) {
    obstacles.push("une date de validité");
  }
  return obstacles;
}

/**
 * Ce qui manque au devis sans l'empêcher de partir.
 *
 * Distinct des obstacles : un devis sans adresse de facturation ni numéro de
 * TVA du client reste envoyable — il est simplement moins utile à la
 * comptabilité qui le recevra. On le signale sans bloquer, parce que ces
 * informations ne sont pas dans le formulaire public et que l'exploitant ne
 * les a pas toujours sous la main au moment où il chiffre.
 */
export function reservesDevis(d: {
  tvaPourcent: number | null;
  clientAdresse: string;
  clientTva: string;
}): string[] {
  const reserves: string[] = [];
  if (d.tvaPourcent === null) reserves.push("le taux de TVA");
  if (!d.clientAdresse.trim()) reserves.push("l'adresse du client");
  if (!d.clientTva.trim()) reserves.push("le numéro de TVA du client");
  return reserves;
}

/**
 * Le devis pré-rempli à partir de la demande.
 *
 * L'exploitant ne part jamais d'une page blanche : il reçoit une ligne déjà
 * libellée avec la date, la demi-journée et le nombre de participants
 * demandés, et il n'a qu'à poser son prix.
 *
 * LE PRIX UNITAIRE EST À ZÉRO, délibérément. Il n'existe aucun tarif de team
 * building dans le projet — l'offre est « sur devis », c'est tout l'objet de
 * ce formulaire. Pré-remplir un montant inventé serait le meilleur moyen qu'il
 * parte un jour tel quel.
 */
export function devisPreRempli(demande: {
  dateSouhaitee: string | null;
  periode: string | null;
  nbParticipants: number | null;
}): Devis {
  const quand = [demande.dateSouhaitee, demande.periode].filter(Boolean).join(" ");
  return {
    lignes: [
      {
        designation: quand
          ? `Team building — privatisation, ${quand}`
          : "Team building — privatisation à la demi-journée",
        quantite: Math.max(
          TEAM_BUILDING_MIN_PARTICIPANTS,
          demande.nbParticipants ?? TEAM_BUILDING_MIN_PARTICIPANTS
        ),
        prixUnitaireCents: 0,
      },
    ],
    message: "",
    validite: "",
    tvaPourcent: null,
  };
}

/**
 * Relit des lignes venues de la base, où elles sont du JSON libre.
 *
 * La contrainte SQL garantit un tableau, rien de plus : le contenu de chaque
 * élément n'est vérifié nulle part côté base. On ne fait donc confiance à
 * aucun champ, et une ligne illisible est écartée plutôt que de faire planter
 * l'écran qui permettrait de la corriger.
 */
export function lignesDepuisJson(v: unknown): LigneDevis[] {
  if (!Array.isArray(v)) return [];
  const lignes: LigneDevis[] = [];
  for (const brut of v) {
    if (!brut || typeof brut !== "object") continue;
    const o = brut as Record<string, unknown>;
    const designation = typeof o.designation === "string" ? o.designation : "";
    const quantite = Number(o.quantite);
    const prix = Number(o.prixUnitaireCents);
    if (!Number.isFinite(quantite) || !Number.isFinite(prix)) continue;
    lignes.push({
      designation,
      quantite: Math.trunc(quantite),
      prixUnitaireCents: Math.trunc(prix),
    });
  }
  return lignes;
}
