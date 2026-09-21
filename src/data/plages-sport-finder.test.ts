import { describe, expect, it } from "vitest";
import {
  conflitSportFinder,
  conflitSurHeureLocale,
  jourISODeLaDate,
} from "@/data/plages-sport-finder";

/**
 * Ce fichier garde le SEUL rempart contre la double vente d'un même terrain.
 *
 * Le site et Sport-Finder ne se voient pas. Rien ne rattrape une erreur ici :
 * un créneau laissé passer part à la vente sur un sol déjà loué, et personne ne
 * l'apprend avant que les deux groupes se présentent à la porte.
 *
 * Les cas ci-dessous sont donc écrits à partir des horaires réels du complexe,
 * pas d'exemples inventés.
 */

describe("jourISODeLaDate", () => {
  it("numérote le dimanche 7 et non 0", () => {
    // 20 septembre 2026 est un dimanche. `getUTCDay()` rend 0 ; l'ISO veut 7,
    // et c'est la numérotation qu'emploient les plages comme le générateur SQL.
    expect(jourISODeLaDate("2026-09-20")).toBe(7);
    expect(jourISODeLaDate("2026-09-21")).toBe(1);
    expect(jourISODeLaDate("2026-10-03")).toBe(6);
  });

  it("ne bascule pas d'un jour selon le fuseau du serveur", () => {
    // Le serveur tourne en UTC en production et à Bruxelles en développement.
    // Midi UTC met la lecture loin des deux bords : la date reste la même.
    expect(jourISODeLaDate("2026-10-25")).toBe(7); // nuit du changement d'heure
    expect(jourISODeLaDate("2027-03-28")).toBe(7);
  });
});

describe("conflitSurHeureLocale — les créneaux réellement générés sont tous sûrs", () => {
  const CRENEAUX_DU_SITE: [number, string, number][] = [
    [3, "13:30", 120],
    [3, "16:00", 120],
    [5, "16:30", 120],
    [6, "10:00", 120],
    [6, "12:30", 120],
    [6, "15:00", 120],
    [6, "17:30", 120],
    [7, "10:00", 120],
    [7, "12:30", 120],
    [7, "15:00", 120],
    [7, "17:30", 120],
  ];

  it.each(CRENEAUX_DU_SITE)(
    "jour %i à %s ne heurte aucune plage Sport-Finder",
    (jour, heure, duree) => {
      const [h, m] = heure.split(":");
      expect(conflitSurHeureLocale(jour, Number(h) * 60 + Number(m), duree)).toBeNull();
    }
  );

  it("le dernier créneau du week-end touche l'ouverture du foot sans la mordre", () => {
    // Samedi 17h30-19h30, foot à partir de 20h00 : une succession, pas un
    // chevauchement. C'est la marge de 30 minutes voulue entre deux groupes.
    expect(conflitSurHeureLocale(6, 17 * 60 + 30, 120)).toBeNull();
    // Même chose bord à bord : un créneau qui finirait pile à 20h00 passe.
    expect(conflitSurHeureLocale(6, 18 * 60, 120)).toBeNull();
    // Une minute de plus, et il mord.
    expect(conflitSurHeureLocale(6, 18 * 60, 121)).not.toBeNull();
  });
});

describe("conflitSurHeureLocale — ce qui doit être refusé", () => {
  it("refuse le samedi 21h, le cas qui a motivé ce garde-fou", () => {
    const c = conflitSurHeureLocale(6, 21 * 60, 120);
    expect(c).not.toBeNull();
    expect(c?.libelle).toContain("Bubble");
  });

  it("refuse le vendredi 18h30-20h30, que la migration 0028 a fermé", () => {
    // Ces 78 créneaux existent encore en base, simplement fermés. Les rouvrir
    // d'un clic recréait exactement le conflit que 0028 avait supprimé.
    expect(conflitSurHeureLocale(5, 18 * 60 + 30, 120)).not.toBeNull();
  });

  it("refuse un lundi après-midi, alors qu'aucun anniversaire n'y est généré", () => {
    // Le générateur ignore le lundi ; la création à la main, elle, ne l'ignorait
    // pas. Or le foot tourne dès 14h ces jours-là.
    expect(conflitSurHeureLocale(1, 15 * 60, 120)).not.toBeNull();
    // Avant 14h, le lundi est libre.
    expect(conflitSurHeureLocale(1, 11 * 60, 120)).toBeNull();
  });

  it("nomme la plage dans une heure lisible, pas en arithmétique", () => {
    // La fermeture est écrite « 25:00 » pour que la comparaison reste possible
    // sans changer de jour ; l'exploitant, lui, doit lire « 01:00 ».
    expect(conflitSurHeureLocale(6, 21 * 60, 60)?.plage).toBe("20:00 – 01:00");
  });

  it("attrape un créneau qui commence avant la plage et déborde dedans", () => {
    // Mercredi 19h-21h : il commence en zone libre et finit en pleine location.
    expect(conflitSurHeureLocale(3, 19 * 60, 120)).not.toBeNull();
  });
});

describe("conflitSportFinder — depuis un instant, à l'heure de Bruxelles", () => {
  /** Construit l'instant d'une heure murale de Bruxelles, via le décalage réel. */
  const aBruxelles = (iso: string, decalageHeures: number) =>
    new Date(`${iso}:00.000${decalageHeures >= 0 ? "+" : "-"}${String(Math.abs(decalageHeures)).padStart(2, "0")}:00`);

  it("lit l'heure de Bruxelles et non celle du serveur", () => {
    // Samedi 3 octobre 2026, 21h00 heure de Bruxelles (UTC+2 en été).
    const debut = aBruxelles("2026-10-03T21:00", 2);
    const fin = new Date(debut.getTime() + 120 * 60000);
    expect(conflitSportFinder(debut, fin)).not.toBeNull();
  });

  it("reste juste après le retour à l'heure d'hiver", () => {
    // Samedi 7 novembre 2026, 21h00 heure de Bruxelles (UTC+1 en hiver). Lu en
    // UTC, ce créneau serait à 20h — le décalage change, la réponse non.
    const debut = aBruxelles("2026-11-07T21:00", 1);
    const fin = new Date(debut.getTime() + 120 * 60000);
    expect(conflitSportFinder(debut, fin)).not.toBeNull();
  });

  it("laisse passer un samedi après-midi en hiver", () => {
    const debut = aBruxelles("2026-11-07T15:00", 1);
    const fin = new Date(debut.getTime() + 120 * 60000);
    expect(conflitSportFinder(debut, fin)).toBeNull();
  });

  it("rattache un créneau de fin de soirée au jour où il commence", () => {
    // Samedi 23h-01h : c'est la soirée du samedi qui est vendue ailleurs, et
    // c'est sur elle qu'il faut trancher — pas sur le dimanche 00h00 en UTC.
    const debut = aBruxelles("2026-11-07T23:00", 1);
    const fin = new Date(debut.getTime() + 120 * 60000);
    expect(conflitSportFinder(debut, fin)).not.toBeNull();
  });
});
