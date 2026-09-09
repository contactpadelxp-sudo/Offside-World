import { describe, expect, it } from "vitest";
import { PALIERS_ANNULATION, partRemboursee } from "./reglement";

/**
 * Le barème d'annulation, tel qu'il est PROMIS au client : la phrase est
 * affichée dans le tunnel de réservation et reprise dans les CGV. Un écart
 * entre ce texte et ce calcul serait un litige, pas un bug.
 *
 * Ces tests deviennent critiques au branchement de Stripe : c'est cette
 * fonction qui décidera du montant réellement remboursé.
 */
describe("barème d'annulation", () => {
  it("rembourse intégralement au-delà de 7 jours", () => {
    expect(partRemboursee(8 * 24)).toBe(1);
    expect(partRemboursee(30 * 24)).toBe(1);
  });

  it("rembourse intégralement À 7 jours pile", () => {
    // La borne est inclusive : « gratuite jusqu'à 7 jours avant ». Un client
    // qui annule exactement 7 jours avant doit être remboursé en entier.
    expect(partRemboursee(7 * 24)).toBe(1);
  });

  it("rembourse la moitié entre 7 jours et 48 heures", () => {
    expect(partRemboursee(6 * 24)).toBe(0.5);
    expect(partRemboursee(72)).toBe(0.5);
  });

  it("rembourse la moitié À 48 heures pile", () => {
    expect(partRemboursee(48)).toBe(0.5);
  });

  it("ne rembourse rien en deçà de 48 heures", () => {
    expect(partRemboursee(47)).toBe(0);
    expect(partRemboursee(1)).toBe(0);
    expect(partRemboursee(0)).toBe(0);
  });

  it("ne rembourse rien une fois l'activité commencée", () => {
    // Un délai négatif signifie que la fête a déjà eu lieu. Aucun palier ne
    // doit s'appliquer — surtout pas le premier de la liste.
    expect(partRemboursee(-1)).toBe(0);
    expect(partRemboursee(-500)).toBe(0);
  });

  it("est décroissant : annuler plus tard ne rapporte jamais plus", () => {
    let precedent = 1;
    for (const h of [200, 168, 167, 100, 49, 48, 47, 10, 0, -5]) {
      const part = partRemboursee(h);
      expect(part).toBeLessThanOrEqual(precedent);
      precedent = part;
    }
  });

  it("ne renvoie jamais une part hors de [0, 1]", () => {
    for (const h of [-100, 0, 47, 48, 167, 168, 10000]) {
      const part = partRemboursee(h);
      expect(part).toBeGreaterThanOrEqual(0);
      expect(part).toBeLessThanOrEqual(1);
    }
  });

  it("garde les paliers ordonnés du plus favorable au moins favorable", () => {
    // `partRemboursee` prend le PREMIER palier atteint : un tableau désordonné
    // rendrait la fonction fausse sans qu'aucun autre test ne le voie.
    for (let i = 1; i < PALIERS_ANNULATION.length; i++) {
      expect(PALIERS_ANNULATION[i].seuilHeures).toBeLessThan(
        PALIERS_ANNULATION[i - 1].seuilHeures
      );
      expect(PALIERS_ANNULATION[i].remboursement).toBeLessThanOrEqual(
        PALIERS_ANNULATION[i - 1].remboursement
      );
    }
  });
});
