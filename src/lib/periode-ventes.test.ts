import { describe, expect, it } from "vitest";
import { bornesDuRaccourci, lirePeriodeVentes } from "./periode-ventes";

describe("raccourcis de période", () => {
  const AUJ = "2026-10-16";

  it("ce mois-ci : du 1er à aujourd'hui", () => {
    expect(bornesDuRaccourci("mois", AUJ)).toEqual({ du: "2026-10-01", au: "2026-10-16" });
  });

  it("mois dernier : un mois civil entier", () => {
    expect(bornesDuRaccourci("mois-dernier", AUJ)).toEqual({ du: "2026-09-01", au: "2026-09-30" });
    // Janvier : le mois dernier est décembre de l'année précédente.
    expect(bornesDuRaccourci("mois-dernier", "2027-01-10")).toEqual({ du: "2026-12-01", au: "2026-12-31" });
    // Mars d'une année bissextile : février a 29 jours.
    expect(bornesDuRaccourci("mois-dernier", "2028-03-05")).toEqual({ du: "2028-02-01", au: "2028-02-29" });
  });

  it("trimestres civils, comme une déclaration de TVA trimestrielle", () => {
    expect(bornesDuRaccourci("trimestre", AUJ)).toEqual({ du: "2026-10-01", au: "2026-10-16" });
    expect(bornesDuRaccourci("trimestre-dernier", AUJ)).toEqual({ du: "2026-07-01", au: "2026-09-30" });
    expect(bornesDuRaccourci("trimestre-dernier", "2027-02-01")).toEqual({ du: "2026-10-01", au: "2026-12-31" });
  });

  it("années", () => {
    expect(bornesDuRaccourci("annee", AUJ)).toEqual({ du: "2026-01-01", au: "2026-10-16" });
    expect(bornesDuRaccourci("annee-derniere", AUJ)).toEqual({ du: "2025-01-01", au: "2025-12-31" });
  });
});

describe("période lue dans l'adresse", () => {
  const AUJ = "2026-10-16";

  it("par défaut : ce mois-ci", () => {
    expect(lirePeriodeVentes({}, AUJ)).toEqual({ du: "2026-10-01", au: "2026-10-16", raccourci: "mois" });
  });

  it("des dates libres l'emportent, et retrouvent leur raccourci s'il existe", () => {
    expect(lirePeriodeVentes({ du: "2026-09-01", au: "2026-09-30" }, AUJ)).toEqual({
      du: "2026-09-01",
      au: "2026-09-30",
      raccourci: "mois-dernier",
    });
    expect(lirePeriodeVentes({ du: "2026-09-10", au: "2026-09-20" }, AUJ).raccourci).toBeNull();
  });

  it("des dates inversées sont remises dans l'ordre", () => {
    expect(lirePeriodeVentes({ du: "2026-09-30", au: "2026-09-01" }, AUJ)).toMatchObject({
      du: "2026-09-01",
      au: "2026-09-30",
    });
  });

  it("une date impossible fait revenir au raccourci", () => {
    expect(lirePeriodeVentes({ du: "2026-02-30", au: "2026-03-10" }, AUJ).raccourci).toBe("mois");
    expect(lirePeriodeVentes({ du: "n'importe quoi", au: "2026-03-10", periode: "annee" }, AUJ)).toMatchObject({
      du: "2026-01-01",
      raccourci: "annee",
    });
  });

  it("une période de plus de deux ans est raccourcie par le début", () => {
    const p = lirePeriodeVentes({ du: "2020-01-01", au: "2026-10-16" }, AUJ);
    expect(p.au).toBe("2026-10-16");
    expect(p.du).toBe("2024-10-16");
  });
});
