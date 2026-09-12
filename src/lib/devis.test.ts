import { describe, expect, it } from "vitest";
import {
  devisPreRempli,
  montantsDevis,
  lignesDepuisJson,
  ligneValide,
  obstaclesEnvoi,
  reservesDevis,
  totalDevisCents,
  totalLigneCents,
  type LigneDevis,
} from "./devis";

/**
 * Un devis part par e-mail à une entreprise, avec une date de validité : il
 * engage le vendeur sur son prix. Chaque cas ci-dessous correspond à une
 * manière précise de se tromper, pas à un exemple décoratif.
 */

const ligne = (p: Partial<LigneDevis> = {}): LigneDevis => ({
  designation: "Team building",
  quantite: 12,
  prixUnitaireCents: 2500,
  ...p,
});

describe("total d'une ligne", () => {
  it("multiplie la quantité par le prix unitaire, en centimes", () => {
    expect(totalLigneCents(ligne())).toBe(30000);
  });

  it("reste entier même sur un prix unitaire qui tombe mal", () => {
    // 3 × 33,33 € = 99,99 € et non 99,98999999999999
    const t = totalLigneCents(ligne({ quantite: 3, prixUnitaireCents: 3333 }));
    expect(Number.isInteger(t)).toBe(true);
    expect(t).toBe(9999);
  });
});

describe("total du devis", () => {
  it("additionne les lignes", () => {
    expect(totalDevisCents([ligne(), ligne({ quantite: 1, prixUnitaireCents: 5000 })])).toBe(35000);
  });

  it("vaut zéro sans ligne", () => {
    expect(totalDevisCents([])).toBe(0);
  });

  it("ne perd pas de centime sur vingt lignes", () => {
    const lignes = Array.from({ length: 20 }, () => ligne({ quantite: 1, prixUnitaireCents: 333 }));
    expect(totalDevisCents(lignes)).toBe(6660);
  });
});

describe("validité d'une ligne", () => {
  it("accepte une ligne complète", () => {
    expect(ligneValide(ligne())).toBe(true);
  });

  it("REFUSE une désignation vide", () => {
    // Sinon le client reçoit une ligne anonyme portant un prix.
    expect(ligneValide(ligne({ designation: "" }))).toBe(false);
    expect(ligneValide(ligne({ designation: "   " }))).toBe(false);
  });

  it("refuse une quantité nulle, négative ou décimale", () => {
    expect(ligneValide(ligne({ quantite: 0 }))).toBe(false);
    expect(ligneValide(ligne({ quantite: -2 }))).toBe(false);
    expect(ligneValide(ligne({ quantite: 1.5 }))).toBe(false);
  });

  it("accepte un prix à zéro — une ligne offerte est légitime", () => {
    expect(ligneValide(ligne({ prixUnitaireCents: 0 }))).toBe(true);
  });

  it("refuse un prix négatif", () => {
    expect(ligneValide(ligne({ prixUnitaireCents: -100 }))).toBe(false);
  });
});

describe("ce qui empêche l'envoi", () => {
  const bon = { lignes: [ligne()], message: "", validite: "2026-12-31", tvaPourcent: null };

  it("ne voit aucun obstacle à un devis complet", () => {
    expect(obstaclesEnvoi(bon)).toEqual([]);
  });

  it("refuse un devis sans ligne", () => {
    expect(obstaclesEnvoi({ ...bon, lignes: [] }).length).toBeGreaterThan(0);
  });

  it("refuse un devis dont le total est nul", () => {
    // Le cas exact du devis pré-rempli qu'on enverrait sans y toucher.
    const obstacles = obstaclesEnvoi({ ...bon, lignes: [ligne({ prixUnitaireCents: 0 })] });
    expect(obstacles.some((o) => o.includes("supérieur à zéro"))).toBe(true);
  });

  it("refuse un devis sans date de validité", () => {
    // Sans limite, l'offre engage le vendeur indéfiniment sur son prix.
    expect(obstaclesEnvoi({ ...bon, validite: "" }).some((o) => o.includes("validité"))).toBe(true);
  });

  it("signale une ligne incomplète laissée au milieu des autres", () => {
    const obstacles = obstaclesEnvoi({ ...bon, lignes: [ligne(), ligne({ designation: "" })] });
    expect(obstacles.some((o) => o.includes("incomplètes"))).toBe(true);
  });
});

describe("devis pré-rempli", () => {
  it("reprend la date, la demi-journée et le nombre de participants", () => {
    const d = devisPreRempli({
      dateSouhaitee: "12 octobre 2026",
      periode: "matin",
      nbParticipants: 24,
    });
    expect(d.lignes).toHaveLength(1);
    expect(d.lignes[0].designation).toContain("12 octobre 2026");
    expect(d.lignes[0].designation).toContain("matin");
    expect(d.lignes[0].quantite).toBe(24);
  });

  it("LAISSE LE PRIX À ZÉRO", () => {
    // Aucun tarif de team building n'existe dans le projet : l'offre est « sur
    // devis ». Un montant pré-rempli finirait par partir tel quel.
    expect(devisPreRempli({ dateSouhaitee: null, periode: null, nbParticipants: 10 })
      .lignes[0].prixUnitaireCents).toBe(0);
  });

  it("ne produit jamais un devis directement envoyable", () => {
    const d = devisPreRempli({ dateSouhaitee: null, periode: null, nbParticipants: 10 });
    expect(obstaclesEnvoi(d).length).toBeGreaterThan(0);
  });

  it("tient debout quand la demande ne dit rien", () => {
    const d = devisPreRempli({ dateSouhaitee: null, periode: null, nbParticipants: null });
    expect(d.lignes[0].designation.length).toBeGreaterThan(0);
    expect(d.lignes[0].quantite).toBeGreaterThan(0);
  });
});

describe("relecture des lignes venues de la base", () => {
  it("relit des lignes normales", () => {
    expect(lignesDepuisJson([{ designation: "A", quantite: 2, prixUnitaireCents: 100 }])).toEqual([
      { designation: "A", quantite: 2, prixUnitaireCents: 100 },
    ]);
  });

  it("rend un tableau vide pour tout ce qui n'est pas un tableau", () => {
    for (const v of [null, undefined, {}, "lignes", 42]) {
      expect(lignesDepuisJson(v)).toEqual([]);
    }
  });

  it("ÉCARTE une ligne illisible au lieu de faire planter l'écran", () => {
    // C'est l'écran qui permettrait justement de corriger le devis.
    const lues = lignesDepuisJson([
      { designation: "A", quantite: 1, prixUnitaireCents: 100 },
      { designation: "B", quantite: "beaucoup", prixUnitaireCents: 100 },
      null,
      "n'importe quoi",
    ]);
    expect(lues).toHaveLength(1);
    expect(lues[0].designation).toBe("A");
  });

  it("tronque des nombres décimaux venus d'une écriture antérieure", () => {
    const lues = lignesDepuisJson([{ designation: "A", quantite: 2.7, prixUnitaireCents: 100.9 }]);
    expect(lues[0]).toEqual({ designation: "A", quantite: 2, prixUnitaireCents: 100 });
  });
});

describe("ventilation de la TVA", () => {
  const l = [ligne({ quantite: 10, prixUnitaireCents: 5000 })]; // 500,00 €

  it("NE VENTILE PAS quand le taux est inconnu", () => {
    // Supposer 21 % et reconstituer une base serait inventer un chiffre sur un
    // document comptable. Sans taux, le total EST le total.
    const m = montantsDevis(l, null);
    expect(m.baseCents).toBe(50000);
    expect(m.tvaCents).toBeNull();
    expect(m.totalCents).toBe(50000);
  });

  it("ajoute la TVA au taux donné", () => {
    const m = montantsDevis(l, 21);
    expect(m.baseCents).toBe(50000);
    expect(m.tvaCents).toBe(10500);
    expect(m.totalCents).toBe(60500);
  });

  it("distingue un taux de 0 — exonéré — d'un taux absent", () => {
    const zero = montantsDevis(l, 0);
    expect(zero.tvaCents).toBe(0);        // exonéré : la TVA existe et vaut 0
    expect(montantsDevis(l, null).tvaCents).toBeNull(); // absent : on ne sait pas
  });

  it("gère le taux réduit belge de 6 %", () => {
    expect(montantsDevis(l, 6).tvaCents).toBe(3000);
  });

  it("ARRONDIT SUR LE TOTAL, pas ligne à ligne", () => {
    // Dix lignes à 3,33 € : 33,30 € de base. À 21 %, la TVA vaut 6,993 €.
    // Arrondie une fois : 6,99 €. Arrondie dix fois (0,70 chacune) : 7,00 €.
    // L'écart est petit mais il est faux, et il grandit avec le nombre de lignes.
    const dix = Array.from({ length: 10 }, () => ligne({ quantite: 1, prixUnitaireCents: 333 }));
    const m = montantsDevis(dix, 21);
    expect(m.baseCents).toBe(3330);
    expect(m.tvaCents).toBe(699);
    expect(m.totalCents).toBe(4029);
  });

  it("reste en centimes entiers sur un taux qui tombe mal", () => {
    const m = montantsDevis([ligne({ quantite: 3, prixUnitaireCents: 3333 })], 21);
    expect(Number.isInteger(m.tvaCents!)).toBe(true);
    expect(Number.isInteger(m.totalCents)).toBe(true);
  });
});

describe("réserves — ce qui manque sans bloquer", () => {
  it("signale les trois manques", () => {
    const r = reservesDevis({ tvaPourcent: null, clientAdresse: "", clientTva: "" });
    expect(r).toHaveLength(3);
  });

  it("ne signale rien quand tout est là", () => {
    expect(
      reservesDevis({ tvaPourcent: 21, clientAdresse: "Rue X 1, Namur", clientTva: "BE0123456789" })
    ).toEqual([]);
  });

  it("ne confond pas un taux de 0 avec un taux absent", () => {
    // Exonéré est un choix ; « non renseigné » est un oubli.
    expect(reservesDevis({ tvaPourcent: 0, clientAdresse: "X", clientTva: "Y" })).toEqual([]);
  });

  it("ignore les espaces", () => {
    const r = reservesDevis({ tvaPourcent: 21, clientAdresse: "   ", clientTva: "  " });
    expect(r).toHaveLength(2);
  });
});
