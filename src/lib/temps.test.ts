import { describe, expect, it } from "vitest";
import { capitaliser, heure, heuresAvant, jourCompact, jourISO, jourLisible, jourLisibleCap } from "./temps";

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

describe("délai avant l'activité — le nombre dont dépend chaque remboursement", () => {
  /*
    C'est ce nombre qui décide si un client récupère 200 €, 100 € ou rien.
    Le barème qui le consomme est testé ailleurs ; ici on vérifie qu'il reçoit
    la bonne valeur — l'unité, le signe, et l'indépendance au fuseau.
  */
  const LE_15_OCTOBRE_15H_BELGE = "2026-10-15T13:00:00+00:00"; // 15 h à Bruxelles, heure d'été

  it("compte en HEURES, pas en minutes ni en jours", () => {
    const debut = new Date("2026-10-15T13:00:00Z");
    const vingtQuatreHeuresAvant = new Date("2026-10-14T13:00:00Z");
    expect(heuresAvant(debut, vingtQuatreHeuresAvant)).toBe(24);
    // Le garde-fou qui compte : 24 et 1440 ne tombent pas dans le même palier.
    expect(heuresAvant(debut, vingtQuatreHeuresAvant)).not.toBe(1440);
  });

  it("donne le même délai quelle que soit l'écriture de l'instant", () => {
    /*
      PostgreSQL peut renvoyer un `timestamptz` avec « +00:00 », « Z » ou le
      décalage local. Ces trois écritures désignent le MÊME instant : le délai
      doit être identique, sinon un client remboursé dépendrait du format de
      sérialisation de la base.
    */
    const maintenant = new Date("2026-10-08T13:00:00Z");
    const attendu = heuresAvant(LE_15_OCTOBRE_15H_BELGE, maintenant);
    expect(heuresAvant("2026-10-15T13:00:00Z", maintenant)).toBe(attendu);
    expect(heuresAvant("2026-10-15T15:00:00+02:00", maintenant)).toBe(attendu);
    expect(heuresAvant(new Date("2026-10-15T13:00:00Z"), maintenant)).toBe(attendu);
    // Sept jours pile : la borne du remboursement intégral.
    expect(attendu).toBe(7 * 24);
  });

  it("ne dépend pas du fuseau du serveur", () => {
    /*
      Le serveur peut tourner en UTC sur Vercel et à Bruxelles en local. Deux
      instants absolus ont le même écart partout : si ce test échouait, le
      remboursement d'un client dépendrait de l'endroit où le code s'exécute.
    */
    const avant = process.env.TZ;
    const mesures: number[] = [];
    try {
      for (const tz of ["UTC", "Europe/Brussels", "Pacific/Auckland", "America/Los_Angeles"]) {
        process.env.TZ = tz;
        mesures.push(heuresAvant("2026-10-15T13:00:00Z", new Date("2026-10-12T13:00:00Z")));
      }
    } finally {
      process.env.TZ = avant;
    }
    expect(new Set(mesures).size).toBe(1);
    expect(mesures[0]).toBe(72);
  });

  it("traverse le changement d'heure sans se décaler", () => {
    /*
      Le passage à l'heure d'hiver en Belgique a lieu le dernier dimanche
      d'octobre — le 25 octobre 2026 à 03:00 locale. Une réservation de part et
      d'autre de cette nuit doit être comptée en heures réelles écoulées.
      C'est le cas où un calcul naïf en jours civils se tromperait d'une heure,
      donc de palier pour qui annule à la limite.
    */
    // 24 octobre 15 h belge (+02:00) → 26 octobre 15 h belge (+01:00) :
    // 49 heures réelles, et non 48.
    const veille = new Date("2026-10-24T13:00:00Z");
    const surlendemain = new Date("2026-10-26T14:00:00Z");
    expect(heuresAvant(surlendemain, veille)).toBe(49);
  });

  it("devient négatif une fois l'activité commencée", () => {
    const debut = new Date("2026-10-15T13:00:00Z");
    expect(heuresAvant(debut, new Date("2026-10-15T14:00:00Z"))).toBe(-1);
    expect(heuresAvant(debut, new Date("2026-10-16T13:00:00Z"))).toBe(-24);
  });

  it("refuse une date illisible au lieu d'inventer un délai", () => {
    /*
      Renvoyer 0 ferait tomber l'annulation dans le dernier palier — « moins de
      48 heures, aucun remboursement » —, c'est-à-dire priver le client de son
      argent sur une erreur de lecture. On lève, l'appelant décide.
    */
    expect(() => heuresAvant("pas une date")).toThrow(/illisible/);
    expect(() => heuresAvant("")).toThrow(/illisible/);
  });
});
