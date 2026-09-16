import { montantLisible } from "@/lib/tarification";
import type { ChoixRemboursement } from "@/lib/vues";

/**
 * CE QUI VA SE PASSER, ÉCRIT EN FRANÇAIS, À PARTIR DE LA SITUATION CHOISIE.
 *
 * Séparé du composant pour une raison simple : c'est ici que se décide quelle
 * somme part chez Stripe et si le créneau du client survit. Une erreur ne casse
 * pas un affichage, elle envoie de l'argent — ou elle n'en envoie pas alors
 * qu'elle le devrait. Ça se teste.
 *
 * DEUX RÈGLES QUI ONT COÛTÉ CHER AILLEURS, ET QU'ON TIENT ICI :
 *
 * 1. ON NE FUSIONNE JAMAIS « barème » EN « intégral », même quand les deux
 *    valent la même chose à l'instant du rendu. Le serveur recalcule à partir
 *    de la date : sur une page restée ouverte qui franchit le seuil des
 *    7 jours, envoyer « intégral » rendrait 100 % là où le barème n'en prévoit
 *    plus que 50.
 *
 * 2. ON NE DÉDUIT JAMAIS LE DÉLAI D'UNE ÉGALITÉ DE MONTANTS. `baremeCents` est
 *    plafonné au reste par la couche base, donc « barème = reste » survient
 *    aussi bien à plus de 7 jours que sur une réservation déjà partiellement
 *    remboursée. Les phrases disent le RÉSULTAT, pas le palier.
 *
 *    Seule exception, et elle se démontre : `bareme === 0` avec `reste > 0`
 *    impose une part nulle, donc moins de 48 heures. Là seulement, on nomme la
 *    raison. Avec `reste === 0`, `bareme` vaut 0 quelle que soit la date — d'où
 *    le traitement séparé de ce cas.
 */

export type Situation =
  /* Réservation encore active */
  | "desistement"
  | "complexe"
  | "rien"
  | "geste"
  /* Réservation déjà annulée : il ne reste qu'une question d'argent */
  | "remb-partie"
  | "remb-tout";

export interface Consequence {
  /** La phrase affichée avant validation, rédigée pour être lue au client. */
  phrase: string;
  /** Le libellé du bouton, qui porte le geste ET la somme. */
  bouton: string;
  action: "annuler" | "rembourser";
  choix: ChoixRemboursement;
}

export interface EtatFiche {
  /** Ce qu'il reste à rendre, en centimes. */
  reste: number;
  /** Le montant du barème, déjà plafonné au reste par la couche base. */
  bareme: number;
  /** Le sous-choix du geste commercial, `null` tant qu'il n'est pas fait. */
  montantGeste: ChoixRemboursement | null;
  /** Réservation active ET plus rien à rendre : annuler ne pose aucune question. */
  sansArgent: boolean;
  /** Pour nommer le créneau conservé, ou libéré, dans la phrase. */
  creneau: string;
}

/** Le geste commercial n'offre deux montants que lorsqu'ils diffèrent vraiment. */
export function gesteADeuxMontants(bareme: number, reste: number): boolean {
  return bareme > 0 && bareme < reste;
}

/**
 * Renvoie `null` tant que la décision n'est pas complète — c'est ce qui garde
 * le bouton inerte. Aucune somme ne part sans un choix explicite.
 */
export function decrireConsequence(
  situation: Situation | null,
  e: EtatFiche
): Consequence | null {
  // Aucune question n'a été posée : le panneau EST la confirmation.
  if (e.sansArgent) {
    return {
      action: "annuler",
      choix: "aucun",
      phrase: `La réservation est annulée et ${e.creneau} redevient libre à la vente.`,
      bouton: "Oui, annuler",
    };
  }

  switch (situation) {
    case "desistement":
      return {
        action: "annuler",
        choix: "bareme",
        phrase:
          e.bareme > 0
            ? `La réservation est annulée. Le client récupère ${montantLisible(e.bareme)}, selon vos conditions d'annulation.`
            : "La réservation est annulée. Le client ne récupère rien : à cette date, vos conditions d'annulation ne prévoient plus de remboursement.",
        bouton:
          e.bareme > 0
            ? `Annuler et rendre ${montantLisible(e.bareme)}`
            : "Annuler sans rien rendre",
      };

    case "complexe":
      return {
        action: "annuler",
        choix: "integral",
        phrase: `La réservation est annulée. Le client récupère ${montantLisible(e.reste)}, soit tout ce qui reste à lui rendre : l'annulation vient de vous.`,
        bouton: `Annuler et rendre ${montantLisible(e.reste)}`,
      };

    case "rien":
      return {
        action: "annuler",
        choix: "aucun",
        phrase: `La réservation est annulée. Rien n'est rendu : les ${montantLisible(e.reste)} vous restent acquis.`,
        bouton: "Annuler sans rien rendre",
      };

    case "geste": {
      /*
        Combien vaut un geste commercial est la seule décision réellement libre
        de cet écran : on ne la prend pas à la place de l'exploitant. Quand une
        seule somme est possible, il n'y a rien à choisir et on retient
        `integral` — c'est-à-dire tout ce qui reste, et non « le maximum » pris
        au hasard : sans second montant, il n'y a pas d'alternative.
      */
      const choix = gesteADeuxMontants(e.bareme, e.reste) ? e.montantGeste : "integral";
      if (!choix) return null;
      const montant = choix === "bareme" ? e.bareme : e.reste;
      return {
        action: "rembourser",
        choix,
        phrase: `La réservation n'est pas annulée : ${e.creneau} reste réservé. Le client récupère ${montantLisible(montant)}.`,
        bouton: `Rendre ${montantLisible(montant)} au client`,
      };
    }

    case "remb-partie":
      return {
        action: "rembourser",
        choix: "bareme",
        phrase: `Le client récupère ${montantLisible(e.bareme)}. La réservation reste annulée.`,
        bouton: `Rendre ${montantLisible(e.bareme)} au client`,
      };

    case "remb-tout":
      return {
        action: "rembourser",
        choix: "integral",
        phrase: `Le client récupère ${montantLisible(e.reste)}. La réservation reste annulée.`,
        bouton: `Rendre ${montantLisible(e.reste)} au client`,
      };

    default:
      return null;
  }
}
