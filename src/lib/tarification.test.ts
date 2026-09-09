import { describe, expect, it } from "vitest";
import {
  enEuros,
  montantLisible,
  totalAnniversaireCents,
  totalBubbleCents,
} from "./tarification";
import { BUBBLE_PRIX_PAR_PERSONNE } from "@/data/bubble-team";

/**
 * Le seul endroit du projet où une erreur se traduit directement en euros.
 *
 * Les cas ci-dessous ne sont pas des exemples décoratifs : chacun correspond à
 * une manière précise de se tromper, et plusieurs décrivent un bug qui aurait
 * coûté de l'argent au client ou à l'exploitant.
 */

const KICK_OFF = { prixBaseCents: 18000, enfantsInclus: 10, prixEnfantSupCents: 1000 };
const BUBBLE = { prixBaseCents: 29000, enfantsInclus: 10, prixEnfantSupCents: 1500 };

describe("total d'un anniversaire", () => {
  it("facture le forfait seul quand le groupe tient dedans", () => {
    expect(totalAnniversaireCents(KICK_OFF, 10)).toBe(18000);
    expect(totalAnniversaireCents(KICK_OFF, 1)).toBe(18000);
  });

  it("NE FAIT PAS DE RÉDUCTION sous le nombre d'enfants compris", () => {
    // Sans le `Math.max(0, …)`, six enfants sur un forfait qui en comprend dix
    // produiraient un supplément de −4 × 10 € : le client paierait 140 € au
    // lieu de 180. C'est le bug le plus coûteux que ce fichier prévient.
    expect(totalAnniversaireCents(KICK_OFF, 6)).toBe(18000);
    expect(totalAnniversaireCents(KICK_OFF, 6)).toBeGreaterThan(0);
  });

  it("facture chaque enfant au-delà du forfait", () => {
    expect(totalAnniversaireCents(KICK_OFF, 11)).toBe(18000 + 1000);
    expect(totalAnniversaireCents(KICK_OFF, 14)).toBe(18000 + 4 * 1000);
    expect(totalAnniversaireCents(BUBBLE, 14)).toBe(29000 + 4 * 1500);
  });

  it("ajoute les options", () => {
    expect(totalAnniversaireCents(KICK_OFF, 10, [2000])).toBe(20000);
    expect(totalAnniversaireCents(KICK_OFF, 10, [2000, 1500])).toBe(21500);
  });

  it("cumule suppléments et options", () => {
    // Le cas vérifié à la main en production : Bubble, 14 enfants, deux options.
    expect(totalAnniversaireCents(BUBBLE, 14, [2000, 1500])).toBe(29000 + 6000 + 3500);
  });

  it("traite une liste d'options vide comme une absence d'options", () => {
    expect(totalAnniversaireCents(KICK_OFF, 12, [])).toBe(totalAnniversaireCents(KICK_OFF, 12));
  });

  it("reste en entiers, sans centime perdu en route", () => {
    // Un calcul en euros flottants produirait ici 234.50000000000003 et, une
    // fois arrondi ailleurs, un écart d'un centime entre l'écran, la base et
    // l'encaissement.
    const total = totalAnniversaireCents(KICK_OFF, 13, [2050, 1500]);
    expect(Number.isInteger(total)).toBe(true);
    expect(total).toBe(24550);
    expect(enEuros(total)).toBe(245.5);
  });
});

describe("total d'un Bubble Foot", () => {
  it("facture au nombre de personnes", () => {
    expect(totalBubbleCents(9)).toBe(BUBBLE_PRIX_PAR_PERSONNE * 100 * 9);
    expect(totalBubbleCents(9)).toBe(20700);
  });

  it("reste en centimes entiers", () => {
    for (const n of [6, 7, 11, 13, 20]) {
      expect(Number.isInteger(totalBubbleCents(n))).toBe(true);
    }
  });

  it("croît strictement avec le nombre de personnes", () => {
    // Une remise par palier introduite plus tard ne doit pas casser l'ordre.
    for (let n = 6; n < 20; n++) {
      expect(totalBubbleCents(n + 1)).toBeGreaterThan(totalBubbleCents(n));
    }
  });
});

describe("conversion en euros", () => {
  it("ne s'applique qu'à l'affichage et ne perd rien sur les cas réels", () => {
    expect(enEuros(18000)).toBe(180);
    expect(enEuros(20700)).toBe(207);
    expect(enEuros(24550)).toBe(245.5);
  });
});

describe("montant écrit pour un client belge", () => {
  it("omet les centimes quand il n'y en a pas", () => {
    expect(montantLisible(18000)).toBe("180\u00a0€");
    expect(montantLisible(0)).toBe("0\u00a0€");
  });

  it("écrit les centimes avec une virgule et deux décimales", () => {
    // Le cas qui a motivé la fonction : la moitié de 175 €.
    expect(montantLisible(8750)).toBe("87,50\u00a0€");
    expect(montantLisible(24550)).toBe("245,50\u00a0€");
    // Un seul centime ne doit pas s'écrire « 1,5 € ».
    expect(montantLisible(105)).toBe("1,05\u00a0€");
  });

  it("sépare le nombre de son symbole par une espace insécable", () => {
    expect(montantLisible(18000)).toContain("\u00a0€");
    expect(montantLisible(18000)).not.toContain(" €");
  });

  it("ne laisse pas passer un flottant issu d'un calcul de remboursement", () => {
    // 50 % de 175,01 € vaut 8750,5 centimes : on arrondit au centime plutôt
    // que d'écrire un montant impossible à encaisser.
    expect(montantLisible(17501 * 0.5)).toBe("87,51\u00a0€");
  });

  it("garde le signe d'un montant négatif", () => {
    expect(montantLisible(-8750)).toBe("-87,50\u00a0€");
  });
});
