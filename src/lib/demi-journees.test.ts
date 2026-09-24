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

/** Les deux Fun zones en service aujourd'hui, à une heure donnée. */
function lesDeux(jour: string, debut: string, libres: [boolean, boolean] = [true, true]): CreneauVue[] {
  return [
    creneau({ jour, debut, espaceId: "espace-1", libre: libres[0] }),
    creneau({ jour, debut, espaceId: "espace-2", espaceNom: "Fun zone 2", libre: libres[1] }),
  ];
}

const LUNDI = "2026-10-05";
const VENDREDI = "2026-10-09";
/** Terrains en service, que la privatisation doit tenir. */
const DEUX = 2;

describe("demi-journées de team building", () => {
  it("propose matin, après-midi et journée entière un jour complet", () => {
    const r = demiJourneesDepuisCreneaux([...lesDeux(LUNDI, "09:00"), ...lesDeux(LUNDI, "14:00")], DEUX);
    expect(r.map((d) => d.periode)).toEqual(["matin", "apres-midi", "journee"]);
    expect(r.every((d) => d.libre)).toBe(true);
    const journee = r.find((d) => d.periode === "journee")!;
    expect([journee.debut, journee.fin]).toEqual(["09:00", "18:00"]);
  });

  it("ne propose PAS de journée entière le vendredi, qui n'a que le matin", () => {
    const r = demiJourneesDepuisCreneaux(lesDeux(VENDREDI, "09:00"), DEUX);
    expect(r.map((d) => d.periode)).toEqual(["matin"]);
  });

  it("affiche complet un matin dont UN SEUL terrain est pris — le complexe n'est plus privatisable", () => {
    const r = demiJourneesDepuisCreneaux(
      [...lesDeux(LUNDI, "09:00", [false, true]), ...lesDeux(LUNDI, "14:00")],
      DEUX
    );
    expect(r.find((d) => d.periode === "matin")!.libre).toBe(false);
    // La journée entière suit : elle demande les deux moitiés.
    expect(r.find((d) => d.periode === "journee")!.libre).toBe(false);
    expect(r.find((d) => d.periode === "apres-midi")!.libre).toBe(true);
  });

  it("affiche complet un matin dont un terrain a été FERMÉ par l'exploitant", () => {
    // Un créneau fermé n'apparaît pas dans la vue : il ne reste qu'une zone.
    const r = demiJourneesDepuisCreneaux([creneau({ jour: LUNDI, debut: "09:00" })], DEUX);
    expect(r.find((d) => d.periode === "matin")!.libre).toBe(false);
  });

  it("couvre un troisième terrain le jour où il ouvre", () => {
    const deuxSurTrois = demiJourneesDepuisCreneaux(lesDeux(VENDREDI, "09:00"), 3);
    expect(deuxSurTrois[0].libre).toBe(false);
  });

  it("n'annonce rien de libre s'il n'y a aucun terrain en service", () => {
    const r = demiJourneesDepuisCreneaux(lesDeux(VENDREDI, "09:00"), 0);
    expect(r[0].libre).toBe(false);
  });

  it("n'invente pas de demi-journée pour un créneau posé à une autre heure", () => {
    const r = demiJourneesDepuisCreneaux([creneau({ jour: LUNDI, debut: "10:30" })], DEUX);
    expect(r).toEqual([]);
  });

  it("garde l'ordre du calendrier", () => {
    const r = demiJourneesDepuisCreneaux([...lesDeux(LUNDI, "09:00"), ...lesDeux(VENDREDI, "09:00")], DEUX);
    expect([...new Set(r.map((d) => d.jour))]).toEqual([LUNDI, VENDREDI]);
  });

  it("donne des identifiants uniques", () => {
    const r = demiJourneesDepuisCreneaux([...lesDeux(LUNDI, "09:00"), ...lesDeux(LUNDI, "14:00")], DEUX);
    expect(new Set(r.map((d) => d.id)).size).toBe(r.length);
  });
});
