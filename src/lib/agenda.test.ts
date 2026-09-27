import { describe, expect, it } from "vitest";
import { construireAgenda, enMinutes } from "./agenda";
import type { CreneauAdmin, ReservationAdmin } from "./vues";

const SAMEDI = "2026-10-03";
const VENDREDI = "2026-10-02";

function creneau(p: Partial<CreneauAdmin> & Pick<CreneauAdmin, "debut" | "fin">): CreneauAdmin {
  return {
    id: `c-${p.espaceNom ?? "Fun zone 1"}-${p.debut}`,
    type: "anniversaire",
    espaceNom: "Fun zone 1",
    jour: SAMEDI,
    jourLabel: "Samedi 3 octobre",
    ouvert: true,
    espaceActif: true,
    reservePar: null,
    tenuParDevis: null,
    ...p,
  };
}

function reservation(p: Partial<ReservationAdmin> & Pick<ReservationAdmin, "debut" | "fin">): ReservationAdmin {
  return {
    id: `r-${p.debut}`,
    reference: "OW-TEST0001",
    type: "anniversaire",
    statut: "confirmee",
    total: 190,
    formuleNom: "Kick-Off",
    nbEnfants: 10,
    enfantPrenom: "Léa",
    enfantAge: 7,
    nbPersonnes: null,
    options: [],
    clientNom: "Client",
    clientEmail: "client@example.com",
    clientTelephone: "0470000000",
    allergies: null,
    remarques: null,
    noteInterne: null,
    jour: SAMEDI,
    jourLabel: "Samedi 3 octobre",
    espaceNom: "Fun zone 1",
    passee: false,
    paiement: null,
    paiementEnCours: false,
    ...p,
  };
}

const ESPACES = ["Fun zone 1", "Fun zone 2"];

describe("agenda d'une journée", () => {
  it("place une réservation dans sa Fun zone, à son heure", () => {
    const a = construireAgenda({
      jour: SAMEDI,
      creneaux: [creneau({ debut: "15:00", fin: "17:00", reservePar: "OW-TEST0001" })],
      reservations: [reservation({ debut: "15:00", fin: "17:00" })],
      espaces: ESPACES,
    });
    const zone1 = a.colonnes.find((c) => c.espace === "Fun zone 1")!;
    // Une seule fois : le créneau réservé ne se dessine pas en doublon.
    expect(zone1.blocs).toHaveLength(1);
    expect(zone1.blocs[0]).toMatchObject({ genre: "reservation", debut: 900, fin: 1020 });
  });

  it("garde une colonne par Fun zone en service, même vide", () => {
    const a = construireAgenda({ jour: SAMEDI, creneaux: [], reservations: [], espaces: ESPACES });
    expect(a.colonnes.map((c) => c.espace)).toEqual(ESPACES);
  });

  it("montre un anniversaire bloqué par téléphone comme fermé", () => {
    const a = construireAgenda({
      jour: SAMEDI,
      creneaux: [creneau({ debut: "12:30", fin: "14:30", ouvert: false })],
      reservations: [],
      espaces: ESPACES,
    });
    expect(a.colonnes[0].blocs[0].genre).toBe("ferme");
  });

  it("n'affiche pas les anciens vendredis 18h30 fermés, qui tombent chez Sport-Finder", () => {
    const a = construireAgenda({
      jour: VENDREDI,
      creneaux: [creneau({ jour: VENDREDI, debut: "18:30", fin: "20:30", ouvert: false })],
      reservations: [],
      espaces: ESPACES,
    });
    expect(a.colonnes.flatMap((c) => c.blocs)).toEqual([]);
  });

  it("montre la matinée tenue par une demande de team building", () => {
    const a = construireAgenda({
      jour: VENDREDI,
      creneaux: [
        creneau({
          jour: VENDREDI,
          type: "team_building",
          debut: "09:00",
          fin: "13:00",
          tenuParDevis: { id: "d1", reference: "TB-TEST0001" },
        }),
      ],
      reservations: [],
      espaces: ESPACES,
    });
    expect(a.colonnes[0].blocs[0]).toMatchObject({ genre: "devis", reference: "TB-TEST0001", debut: 540 });
  });

  it("ignore la Fun zone hors service quand elle ne porte rien", () => {
    const a = construireAgenda({
      jour: SAMEDI,
      creneaux: [creneau({ espaceNom: "Fun zone 3", espaceActif: false, debut: "10:00", fin: "12:00" })],
      reservations: [],
      espaces: ESPACES,
    });
    expect(a.colonnes.map((c) => c.espace)).toEqual(ESPACES);
  });

  it("dessine la plage Sport-Finder du jour, jusqu'à minuit", () => {
    const samedi = construireAgenda({ jour: SAMEDI, creneaux: [], reservations: [], espaces: ESPACES });
    expect(samedi.sportFinder).toMatchObject({ debut: 17 * 60, fin: 24 * 60 });
    const vendredi = construireAgenda({ jour: VENDREDI, creneaux: [], reservations: [], espaces: ESPACES });
    expect(vendredi.sportFinder).toMatchObject({ debut: 18 * 60 });
    expect([samedi.debut, samedi.fin]).toEqual([9 * 60, 24 * 60]);
  });

  it("met côte à côte deux blocs qui se chevauchent", () => {
    const a = construireAgenda({
      jour: SAMEDI,
      // Un créneau fermé ajouté à la main, qui mord sur l'anniversaire.
      creneaux: [creneau({ debut: "14:00", fin: "16:00", ouvert: false })],
      reservations: [reservation({ debut: "15:00", fin: "17:00" })],
      espaces: ESPACES,
    });
    const blocs = a.colonnes[0].blocs;
    expect(blocs.map((b) => [b.voie, b.voies])).toEqual([
      [0, 2],
      [1, 2],
    ]);
  });

  it("n'élargit pas les blocs qui se suivent sans se chevaucher", () => {
    const a = construireAgenda({
      jour: SAMEDI,
      creneaux: [creneau({ debut: "10:00", fin: "12:00" }), creneau({ debut: "12:30", fin: "14:30" })],
      reservations: [],
      espaces: ESPACES,
    });
    expect(a.colonnes[0].blocs.every((b) => b.voies === 1)).toBe(true);
  });

  it("étend la grille si un créneau commence avant 9h", () => {
    const a = construireAgenda({
      jour: SAMEDI,
      creneaux: [creneau({ debut: "08:30", fin: "10:30" })],
      reservations: [],
      espaces: ESPACES,
    });
    expect(a.debut).toBe(8 * 60);
  });

  it("lit les heures en minutes", () => {
    expect(enMinutes("15:30")).toBe(930);
  });
});
