import { describe, expect, it } from "vitest";
import { montantARembourser, type Remboursable } from "./remboursement";

/**
 * LA FONCTION QUI DÉCIDE COMBIEN D'ARGENT SORT DU COMPTE.
 *
 * Le barème lui-même (`partRemboursee`) est testé dans `data/reglement.test.ts`.
 * Ce qui manquait, c'est le passage du barème AUX CENTIMES : l'arrondi, et
 * surtout le plafond qui interdit de rendre plus qu'il ne reste. Une erreur ici
 * ne casse pas un affichage — elle envoie de l'argent chez Stripe.
 *
 * Ces tests ne touchent ni Stripe ni la base : `montantARembourser` est une
 * fonction pure, et c'est précisément pour ça qu'elle a été écrite séparément
 * de `rembourser()`, qui, lui, appelle le monde extérieur.
 */

/** Un paiement de 245,50 € intégralement encaissé, rien rendu. */
function paiement(montantCents: number, dejaRembourseCents = 0): Remboursable {
  return {
    paiementId: "p1",
    paymentIntent: "pi_test",
    montantCents,
    dejaRembourseCents,
  };
}

const PLUS_DE_7_JOURS = 8 * 24;
const ENTRE_7J_ET_48H = 72;
const MOINS_DE_48H = 24;

describe("montant à rembourser — le choix de l'exploitant", () => {
  it("« intégral » rend tout, quelle que soit la date", () => {
    const p = paiement(24550);
    expect(montantARembourser(p, "integral", PLUS_DE_7_JOURS)).toBe(24550);
    expect(montantARembourser(p, "integral", MOINS_DE_48H)).toBe(24550);
    // Même une activité déjà passée : c'est le cas « le complexe annule ».
    expect(montantARembourser(p, "integral", -12)).toBe(24550);
  });

  it("« aucun » ne rend rien, même longtemps à l'avance", () => {
    const p = paiement(24550);
    expect(montantARembourser(p, "aucun", PLUS_DE_7_JOURS)).toBe(0);
    expect(montantARembourser(p, "aucun", MOINS_DE_48H)).toBe(0);
  });

  it("« barème » suit les trois paliers des CGV", () => {
    const p = paiement(18000);
    expect(montantARembourser(p, "bareme", PLUS_DE_7_JOURS)).toBe(18000);
    expect(montantARembourser(p, "bareme", ENTRE_7J_ET_48H)).toBe(9000);
    expect(montantARembourser(p, "bareme", MOINS_DE_48H)).toBe(0);
  });

  it("« barème » ne rend rien sur une activité déjà passée", () => {
    // `heuresAvant` est négatif quand la date est dépassée. Le barème doit
    // répondre « rien », pas se tromper de palier.
    expect(montantARembourser(paiement(18000), "bareme", -1)).toBe(0);
    expect(montantARembourser(paiement(18000), "bareme", -500)).toBe(0);
  });
});

describe("montant à rembourser — l'arrondi", () => {
  it("arrondit au centime, jamais en dessous", () => {
    // La moitié de 175,01 € vaut 87,505 € : on ne peut pas envoyer un
    // demi-centime chez Stripe.
    expect(montantARembourser(paiement(17501), "bareme", ENTRE_7J_ET_48H)).toBe(8751);
    // La moitié de 245,51 € vaut 122,755 €.
    expect(montantARembourser(paiement(24551), "bareme", ENTRE_7J_ET_48H)).toBe(12276);
  });

  it("rend un nombre entier de centimes dans tous les cas", () => {
    for (const montant of [1, 7, 13, 99, 17501, 24551, 29000]) {
      const rendu = montantARembourser(paiement(montant), "bareme", ENTRE_7J_ET_48H);
      expect(Number.isInteger(rendu)).toBe(true);
    }
  });
});

describe("montant à rembourser — le plafond, qui est la vraie protection", () => {
  /*
    C'est le garde-fou contre le double remboursement. Le cumul déjà rendu est
    écrit en base par `rembourser()` ; si l'exploitant relance une annulation
    sur une réservation déjà remboursée, on ne doit rendre que le solde — et
    zéro s'il n'y en a plus. Sans ce plafond, deux clics sur « annuler »
    rendraient deux fois la somme.
  */

  it("ne rend jamais plus que ce qui reste", () => {
    // 180 € encaissés, 120 € déjà rendus : il reste 60 €, pas 180.
    const p = paiement(18000, 12000);
    expect(montantARembourser(p, "integral", PLUS_DE_7_JOURS)).toBe(6000);
  });

  it("ne rend rien quand tout a déjà été rendu", () => {
    const p = paiement(18000, 18000);
    expect(montantARembourser(p, "integral", PLUS_DE_7_JOURS)).toBe(0);
    expect(montantARembourser(p, "bareme", PLUS_DE_7_JOURS)).toBe(0);
  });

  it("laisse passer le barème quand il tient sous le solde", () => {
    // 180 € encaissés, 20 € déjà rendus (un geste commercial, par exemple) :
    // la moitié du barème vaut 90 €, le solde en autorise 160. On rend 90.
    const p = paiement(18000, 2000);
    expect(montantARembourser(p, "bareme", ENTRE_7J_ET_48H)).toBe(9000);
  });

  it("rabote le barème au solde quand le solde est plus petit", () => {
    // 180 € encaissés, 150 € déjà rendus : la moitié vaudrait 90 €, il ne
    // reste que 30.
    const p = paiement(18000, 15000);
    expect(montantARembourser(p, "bareme", ENTRE_7J_ET_48H)).toBe(3000);
  });

  it("ne renvoie jamais un montant négatif", () => {
    // Cas qui ne devrait pas exister — la contrainte de base l'interdit — mais
    // un montant négatif envoyé chez Stripe serait un débit, pas un crédit.
    const p = paiement(18000, 20000);
    expect(montantARembourser(p, "integral", PLUS_DE_7_JOURS)).toBe(0);
    expect(montantARembourser(p, "bareme", PLUS_DE_7_JOURS)).toBe(0);
  });
});

describe("montant à rembourser — un paiement à zéro", () => {
  it("ne rend rien, sans planter", () => {
    const p = paiement(0);
    expect(montantARembourser(p, "integral", PLUS_DE_7_JOURS)).toBe(0);
    expect(montantARembourser(p, "bareme", PLUS_DE_7_JOURS)).toBe(0);
    expect(montantARembourser(p, "aucun", PLUS_DE_7_JOURS)).toBe(0);
  });
});

describe("la politique d'annulation de Brahim, en euros", () => {
  /*
    LE BARÈME TEL QU'IL EST AFFICHÉ AU CLIENT, VÉRIFIÉ SUR DE VRAIS MONTANTS.

      « Gratuite jusqu'à 7 jours avant. Entre 7 jours et 48 heures : 50 %
        remboursés. Moins de 48 heures : aucun remboursement. »

    `reglement.test.ts` vérifie les paliers et interdit à cette phrase de
    diverger d'eux. Ici on vérifie le dernier maillon : la somme en euros qui
    part réellement chez Stripe quand Brahim clique « Barème d'annulation ».

    Le montant de 200 € est celui du paiement de test du 15 septembre 2026.
  */
  const DEUX_CENTS_EUROS = paiement(20000);
  const jours = (n: number) => n * 24;

  it("annulation à plus de 7 jours : tout est rendu", () => {
    expect(montantARembourser(DEUX_CENTS_EUROS, "bareme", jours(30))).toBe(20000);
    expect(montantARembourser(DEUX_CENTS_EUROS, "bareme", jours(8))).toBe(20000);
    // La borne est inclusive : « jusqu'à 7 jours avant ».
    expect(montantARembourser(DEUX_CENTS_EUROS, "bareme", jours(7))).toBe(20000);
  });

  it("annulation entre 7 jours et 48 heures : la moitié", () => {
    expect(montantARembourser(DEUX_CENTS_EUROS, "bareme", jours(6))).toBe(10000);
    expect(montantARembourser(DEUX_CENTS_EUROS, "bareme", jours(3))).toBe(10000);
    expect(montantARembourser(DEUX_CENTS_EUROS, "bareme", 49)).toBe(10000);
    expect(montantARembourser(DEUX_CENTS_EUROS, "bareme", 48)).toBe(10000);
  });

  it("annulation à moins de 48 heures : rien", () => {
    expect(montantARembourser(DEUX_CENTS_EUROS, "bareme", 47)).toBe(0);
    expect(montantARembourser(DEUX_CENTS_EUROS, "bareme", 2)).toBe(0);
    expect(montantARembourser(DEUX_CENTS_EUROS, "bareme", 0)).toBe(0);
  });

  it("le choix de Brahim prime sur le barème quand il annule lui-même", () => {
    /*
      Le barème s'applique au client qui se désiste. Si c'est le complexe qui
      annule — terrain indisponible, animateur malade —, retenir la moitié
      serait indéfendable : c'est le vendeur qui n'exécute pas. D'où
      « remboursement intégral », qui ignore la date.
    */
    expect(montantARembourser(DEUX_CENTS_EUROS, "integral", 2)).toBe(20000);
    expect(montantARembourser(DEUX_CENTS_EUROS, "integral", 0)).toBe(20000);
  });

  it("une heure de décalage ne change rien loin des bornes", () => {
    // Garde-fou contre une erreur d'unité : si `heuresAvant` était calculé en
    // minutes ou en jours, ces trois appels ne donneraient pas le même montant.
    for (const h of [jours(10), jours(10) + 1, jours(10) - 1]) {
      expect(montantARembourser(DEUX_CENTS_EUROS, "bareme", h)).toBe(20000);
    }
  });
});
