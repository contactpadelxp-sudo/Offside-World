import { describe, expect, it } from "vitest";
import { demiJourneesDepuisCreneaux } from "./demi-journees";
import type { CreneauVue } from "./vues";

function creneau(p: Partial<CreneauVue> & Pick<CreneauVue, "jour" | "debut">): CreneauVue {
  return {
    id: `${p.jour}-${p.debut}-${p.espaceId ?? "espace-1"}`,
    espaceId: "espace-1",
    espaceNom: "Fun zone 1",
    capacite: 18,
    jourLabel: `Jour ${p.jour}`,
    fin: p.debut === "09:00" ? "13:00" : "18:00",
    libre: true,
    ...p,
  };
}

const LUNDI = "2026-10-05";
const VENDREDI = "2026-10-09";

describe("demi-journées de team building", () => {
  it("propose matin, après-midi et journée entière un jour complet", () => {
    const r = demiJourneesDepuisCreneaux([
      creneau({ jour: LUNDI, debut: "09:00" }),
      creneau({ jour: LUNDI, debut: "14:00" }),
    ]);
    expect(r.map((d) => d.periode)).toEqual(["matin", "apres-midi", "journee"]);
    expect(r.every((d) => d.libre)).toBe(true);
    const journee = r.find((d) => d.periode === "journee")!;
    expect([journee.debut, journee.fin]).toEqual(["09:00", "18:00"]);
  });

  it("ne propose PAS de journée entière le vendredi, qui n'a que le matin", () => {
    const r = demiJourneesDepuisCreneaux([creneau({ jour: VENDREDI, debut: "09:00" })]);
    expect(r.map((d) => d.periode)).toEqual(["matin"]);
  });

  it("garde un matin libre tant qu'UNE Fun zone l'est encore", () => {
    const r = demiJourneesDepuisCreneaux([
      creneau({ jour: LUNDI, debut: "09:00", espaceId: "espace-1", libre: false }),
      creneau({ jour: LUNDI, debut: "09:00", espaceId: "espace-2", libre: true }),
    ]);
    expect(r.find((d) => d.periode === "matin")!.libre).toBe(true);
  });

  it("affiche complet un matin pris dans toutes les Fun zones", () => {
    const r = demiJourneesDepuisCreneaux([
      creneau({ jour: LUNDI, debut: "09:00", espaceId: "espace-1", libre: false }),
      creneau({ jour: LUNDI, debut: "09:00", espaceId: "espace-2", libre: false }),
      creneau({ jour: LUNDI, debut: "14:00" }),
    ]);
    expect(r.find((d) => d.periode === "matin")!.libre).toBe(false);
    // Et la journée entière avec lui : elle demande les deux moitiés.
    expect(r.find((d) => d.periode === "journee")!.libre).toBe(false);
    expect(r.find((d) => d.periode === "apres-midi")!.libre).toBe(true);
  });

  it("n'invente pas de demi-journée pour un créneau posé à une autre heure", () => {
    const r = demiJourneesDepuisCreneaux([creneau({ jour: LUNDI, debut: "10:30" })]);
    expect(r).toEqual([]);
  });

  it("garde l'ordre du calendrier", () => {
    const r = demiJourneesDepuisCreneaux([
      creneau({ jour: LUNDI, debut: "09:00" }),
      creneau({ jour: VENDREDI, debut: "09:00" }),
    ]);
    expect(r.map((d) => d.jour)).toEqual([LUNDI, VENDREDI]);
  });

  it("donne des identifiants uniques", () => {
    const r = demiJourneesDepuisCreneaux([
      creneau({ jour: LUNDI, debut: "09:00", espaceId: "espace-1" }),
      creneau({ jour: LUNDI, debut: "09:00", espaceId: "espace-2" }),
      creneau({ jour: LUNDI, debut: "14:00" }),
    ]);
    expect(new Set(r.map((d) => d.id)).size).toBe(r.length);
  });
});
