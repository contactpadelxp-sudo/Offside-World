import { describe, expect, it } from "vitest";
import { capitaliser, heure, jourCompact, jourISO, jourLisible, jourLisibleCap } from "./temps";

/**
 * Le fuseau horaire, et pourquoi ces tests existent.
 *
 * Je me suis fait avoir par ce sujet en lisant la table des créneaux sans
 * préciser de fuseau : PostgreSQL renvoyait de l'UTC, et une même plage y
 * apparaissait DEUX FOIS — 10 h belge vaut 08:00 UTC en été et 09:00 en
 * hiver. J'en avais conclu, à tort, que le complexe ouvrait à huit heures du
 * matin et proposait deux fois plus de créneaux qu'en réalité.
 *
 * Le même piège dans l'autre sens ferait afficher au client une heure fausse
 * pour un créneau juste — et il se présenterait à la mauvaise heure.
 *
 * Ces tests figent donc la seule règle qui tienne : tout est formaté en heure
 * de Bruxelles, quel que soit le fuseau de la machine qui affiche.
 */

// 15 h heure de Bruxelles, en HEURE D'ÉTÉ (UTC+2).
const ETE = new Date("2026-07-15T13:00:00Z");
// 15 h heure de Bruxelles, en HEURE D'HIVER (UTC+1).
const HIVER = new Date("2026-01-15T14:00:00Z");

describe("formatage de l'heure", () => {
  it("affiche l'heure belge en été comme en hiver", () => {
    // Le cœur du sujet : deux instants UTC DIFFÉRENTS doivent afficher la
    // même heure locale, parce que c'est la même heure pour le client.
    expect(heure(ETE)).toBe("15:00");
    expect(heure(HIVER)).toBe("15:00");
  });

  it("ne dépend pas du fuseau de la machine", () => {
    const avant = process.env.TZ;
    try {
      for (const tz of ["UTC", "America/New_York", "Asia/Tokyo"]) {
        process.env.TZ = tz;
        expect(heure(ETE)).toBe("15:00");
      }
    } finally {
      process.env.TZ = avant;
    }
  });

  it("utilise le format 24 heures, sans AM ni PM", () => {
    expect(heure(new Date("2026-07-15T18:00:00Z"))).toBe("20:00");
    expect(heure(ETE)).not.toMatch(/[ap]\.?m/i);
  });
});

describe("identifiant de journée", () => {
  it("donne une date triable au format ISO", () => {
    expect(jourISO(ETE)).toBe("2026-07-15");
    expect(jourISO(HIVER)).toBe("2026-01-15");
  });

  it("range dans la bonne journée BELGE près de minuit", () => {
    // 23 h 30 heure belge le 15 juillet = 21:30 UTC le même jour.
    expect(jourISO(new Date("2026-07-15T21:30:00Z"))).toBe("2026-07-15");
    // Mais 00 h 30 heure belge le 16 = 22:30 UTC le 15. Un calcul en UTC
    // rangerait cette réservation la veille, et elle disparaîtrait de la
    // journée de travail affichée au back-office.
    expect(jourISO(new Date("2026-07-15T22:30:00Z"))).toBe("2026-07-16");
  });

  it("reste triable comme du texte", () => {
    const jours = [
      jourISO(new Date("2026-12-01T12:00:00Z")),
      jourISO(new Date("2026-01-15T12:00:00Z")),
      jourISO(new Date("2026-09-30T12:00:00Z")),
    ];
    expect([...jours].sort()).toEqual(["2026-01-15", "2026-09-30", "2026-12-01"]);
  });
});

describe("libellés affichés", () => {
  it("écrit la date en français", () => {
    expect(jourLisible(ETE)).toBe("mercredi 15 juillet");
  });

  it("met une majuscule au jour, pas au mois", () => {
    // « Mercredi 15 Juillet » serait fautif : les noms de mois ne prennent
    // pas de majuscule en français.
    expect(jourLisibleCap(ETE)).toBe("Mercredi 15 juillet");
  });

  it("abrège pour les écrans étroits", () => {
    const compact = jourCompact(ETE);
    expect(compact.length).toBeLessThan(jourLisible(ETE).length);
    expect(compact).toContain("15");
  });
});

describe("capitalisation", () => {
  it("ne touche qu'à la première lettre", () => {
    expect(capitaliser("samedi 5 septembre")).toBe("Samedi 5 septembre");
  });

  it("ne casse pas sur une chaîne vide", () => {
    expect(capitaliser("")).toBe("");
  });

  it("laisse intacte une chaîne déjà capitalisée", () => {
    expect(capitaliser("Samedi")).toBe("Samedi");
  });
});
