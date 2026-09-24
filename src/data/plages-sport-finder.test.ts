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
  /** Ceux des générateurs SQL depuis la migration 0036 : jour ISO, début, durée. */
  const CRENEAUX_DU_SITE: [string, number, string, number][] = [
    // Anniversaires (0034).
    ["anniversaire", 3, "13:30", 120],
    ["anniversaire", 3, "16:00", 120],
    ["anniversaire", 5, "16:00", 120],
    ["anniversaire", 6, "10:00", 120],
    ["anniversaire", 6, "12:30", 120],
    ["anniversaire", 6, "15:00", 120],
    ["anniversaire", 7, "10:00", 120],
    ["anniversaire", 7, "12:30", 120],
    ["anniversaire", 7, "15:00", 120],
    // Team building (0036).
    ["team building", 1, "09:00", 240],
    ["team building", 1, "14:00", 240],
    ["team building", 2, "09:00", 240],
    ["team building", 2, "14:00", 240],
    ["team building", 4, "09:00", 240],
    ["team building", 4, "14:00", 240],
    ["team building", 5, "09:00", 240],
  ];

  it.each(CRENEAUX_DU_SITE)(
    "%s du jour %i à %s ne heurte aucune plage Sport-Finder",
    (_type, jour, heure, duree) => {
      const [h, m] = heure.split(":");
      expect(conflitSurHeureLocale(jour, Number(h) * 60 + Number(m), duree)).toBeNull();
    }
  );

  it("l'après-midi de team building finit pile à l'ouverture du foot, sans la mordre", () => {
    // Lundi 14h-18h, foot à partir de 18h00 : une succession. Tant que ce
    // fichier portait la cible du 21 septembre (foot dès 14h), chaque
    // après-midi était signalé à tort à Brahim.
    expect(conflitSurHeureLocale(1, 14 * 60, 240)).toBeNull();
    // Une minute de plus, et il mord.
    expect(conflitSurHeureLocale(1, 14 * 60, 241)).not.toBeNull();
  });

  it("le dernier anniversaire du week-end touche l'ouverture du foot sans la mordre", () => {
    // Samedi 15h-17h, foot à partir de 17h00.
    expect(conflitSurHeureLocale(6, 15 * 60, 120)).toBeNull();
    expect(conflitSurHeureLocale(6, 15 * 60, 121)).not.toBeNull();
  });
});

describe("conflitSurHeureLocale — ce qui doit être refusé", () => {
  it("refuse le samedi 17h30, le créneau retiré par la migration 0034", () => {
    // Le foot ouvre à 17h le week-end : l'ancien dernier anniversaire,
    // 17h30-19h30, tombe désormais en pleine location.
    const c = conflitSurHeureLocale(6, 17 * 60 + 30, 120);
    expect(c).not.toBeNull();
    expect(c?.libelle).toContain("Bubble");
  });

  it("refuse le vendredi 16h30-18h30, l'ancien créneau que 0034 a fermé", () => {
    // Il mord d'une demi-heure sur l'ouverture de 18h.
    expect(conflitSurHeureLocale(5, 16 * 60 + 30, 120)).not.toBeNull();
  });

  it("refuse un lundi soir, alors qu'aucun créneau n'y est généré", () => {
    // Le générateur ignore le lundi soir ; la création à la main, elle, ne
    // l'ignore pas. Or le foot tourne dès 18h tous les jours de semaine.
    expect(conflitSurHeureLocale(1, 19 * 60, 120)).not.toBeNull();
  });

  it("nomme la plage dans une heure lisible, pas en arithmétique", () => {
    // La fermeture est écrite « 24:00 » pour que la comparaison reste possible
    // sans changer de jour ; l'exploitant, lui, doit lire « 00:00 ».
    expect(conflitSurHeureLocale(6, 21 * 60, 60)?.plage).toBe("17:00 – 00:00");
  });

  it("attrape un créneau qui commence avant la plage et déborde dedans", () => {
    // Mercredi 17h-19h : il commence en zone libre et finit en pleine location.
    expect(conflitSurHeureLocale(3, 17 * 60, 120)).not.toBeNull();
  });
});

describe("conflitSportFinder — depuis un instant, à l'heure de Bruxelles", () => {
  /** Construit l'instant d'une heure murale de Bruxelles, via le décalage réel. */
  const aBruxelles = (iso: string, decalageHeures: number) =>
    new Date(`${iso}:00.000${decalageHeures >= 0 ? "+" : "-"}${String(Math.abs(decalageHeures)).padStart(2, "0")}:00`);

  it("lit l'heure de Bruxelles et non celle du serveur", () => {
    // Samedi 3 octobre 2026, 17h00 heure de Bruxelles (UTC+2 en été). Lu en
    // UTC, ce créneau serait à 15h et passerait.
    const debut = aBruxelles("2026-10-03T17:00", 2);
    const fin = new Date(debut.getTime() + 120 * 60000);
    expect(conflitSportFinder(debut, fin)).not.toBeNull();
  });

  it("reste juste après le retour à l'heure d'hiver", () => {
    // Samedi 7 novembre 2026, 16h-18h heure de Bruxelles (UTC+1 en hiver). Lu
    // en UTC, ce créneau serait à 15h et finirait pile à 17h, sans mordre.
    const debut = aBruxelles("2026-11-07T16:00", 1);
    const fin = new Date(debut.getTime() + 120 * 60000);
    expect(conflitSportFinder(debut, fin)).not.toBeNull();
  });

  it("laisse passer un samedi après-midi en hiver", () => {
    const debut = aBruxelles("2026-11-07T15:00", 1);
    const fin = new Date(debut.getTime() + 120 * 60000);
    expect(conflitSportFinder(debut, fin)).toBeNull();
  });

  it("laisse passer un après-midi de team building en hiver", () => {
    // Lundi 9 novembre 2026, 14h-18h heure de Bruxelles : lu en UTC, il
    // finirait à 17h ; lu à Bruxelles, il finit pile à l'ouverture.
    const debut = aBruxelles("2026-11-09T14:00", 1);
    const fin = new Date(debut.getTime() + 240 * 60000);
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
