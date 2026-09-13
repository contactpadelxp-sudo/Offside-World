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
