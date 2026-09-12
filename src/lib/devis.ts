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
