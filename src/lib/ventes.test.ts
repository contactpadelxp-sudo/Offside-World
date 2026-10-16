import { describe, expect, it } from "vitest";
import {
  construireRapport,
  lignesFigeesDepuisJson,
  repartir,
  tauxDeLaLigne,
  ventilerTva,
  type LigneFigee,
  type PaiementVente,
  type TauxActuels,
} from "./ventes";

const AUCUN_TAUX: TauxActuels = { formules: {}, options: {}, bubble: null };

function ligne(p: Partial<LigneFigee> & Pick<LigneFigee, "totalCents">): LigneFigee {
  return {
    nature: "formule",
    ref: "kick-off",
    designation: "Anniversaire — formule Kick-Off",
    quantite: 1,
    puCents: p.totalCents,
    tvaPourcent: 6,
    ...p,
  };
}

function paiement(p: Partial<PaiementVente> & Pick<PaiementVente, "montantCents">): PaiementVente {
  return {
    formuleId: "kick-off",
    optionsIds: [],
    paiementId: `p-${p.reference ?? "1"}`,
    reference: "OW-AAAA0001",
    typeActivite: "anniversaire",
    statutReservation: "confirmee",
    jourActivite: "2026-10-11",
    jourPaiement: "2026-09-27",
    methode: "bancontact",
    lignes: [ligne({ totalCents: p.montantCents })],
    ...p,
  } as PaiementVente;
}

describe("TVA extraite d'un montant TVAC", () => {
  it("190 € à 6 % : 179,25 € HTVA et 10,75 € de TVA", () => {
    expect(ventilerTva(19000, 6)).toEqual({ htCents: 17925, tvaCents: 1075 });
  });

  it("25 € à 21 % : 20,66 € HTVA et 4,34 € de TVA", () => {
    expect(ventilerTva(2500, 21)).toEqual({ htCents: 2066, tvaCents: 434 });
  });

  it("HTVA + TVA redonnent toujours le TVAC, au centime", () => {
    for (const taux of [0, 6, 12, 21]) {
      for (let ttc = 1; ttc <= 50_000; ttc += 97) {
        const { htCents, tvaCents } = ventilerTva(ttc, taux);
        expect(htCents! + tvaCents!).toBe(ttc);
      }
    }
  });

  it("un remboursement porte exactement la TVA opposée de la vente", () => {
    // `Math.round(-2.5)` vaut −2 en JavaScript : sans précaution, la vente et
    // son remboursement n'auraient pas la même TVA au centime près.
    for (let ttc = 1; ttc <= 20_000; ttc += 53) {
      const v = ventilerTva(ttc, 6);
      const r = ventilerTva(-ttc, 6);
      expect(r).toEqual({ htCents: -v.htCents!, tvaCents: -v.tvaCents! });
    }
  });

  it("0 % est un vrai taux : exonéré, TVA nulle", () => {
    expect(ventilerTva(19000, 0)).toEqual({ htCents: 19000, tvaCents: 0 });
  });

  it("sans taux, on ne calcule rien plutôt que de deviner", () => {
    expect(ventilerTva(19000, null)).toEqual({ htCents: null, tvaCents: null });
  });
});

describe("répartition d'un montant sans perte", () => {
  it("100 centimes en trois parts égales : 34, 33, 33", () => {
    expect(repartir(100, [1, 1, 1])).toEqual([34, 33, 33]);
  });

  it("la somme des parts vaut toujours le montant, négatif compris", () => {
    for (const montant of [1, 7, 9999, 19000, -9500, -1]) {
      for (const poids of [[18000, 1000, 2500], [1, 2], [5], [3, 3, 3, 1]]) {
        const parts = repartir(montant, poids);
        expect(parts.reduce((s, x) => s + x, 0)).toBe(montant);
        expect(parts).toHaveLength(poids.length);
      }
    }
  });

  it("au prorata : 50 % d'une vente rembourse 50 % de chaque ligne", () => {
    expect(repartir(10750, [18000, 1000, 2500])).toEqual([9000, 500, 1250]);
  });

  it("sans poids, tout va à la première ligne", () => {
    expect(repartir(500, [0, 0])).toEqual([500, 0]);
    expect(repartir(500, [])).toEqual([]);
  });
});

describe("lecture du détail figé", () => {
  it("lit le JSON de la base", () => {
    const l = lignesFigeesDepuisJson([
      {
        nature: "option",
        ref: "gateau",
        designation: "Option — Gâteau",
        quantite: 1,
        pu_cents: 2500,
        total_cents: 2500,
        tva_pourcent: 21,
      },
    ]);
    expect(l).toEqual([
      {
        nature: "option",
        ref: "gateau",
        designation: "Option — Gâteau",
        quantite: 1,
        puCents: 2500,
        totalCents: 2500,
        tvaPourcent: 21,
      },
    ]);
  });

  it("un taux absent reste absent, il ne devient pas zéro", () => {
    const l = lignesFigeesDepuisJson([{ total_cents: 19000, tva_pourcent: null }]);
    expect(l?.[0].tvaPourcent).toBeNull();
  });

  it("refuse un détail vide ou malformé plutôt que de fausser une somme", () => {
    expect(lignesFigeesDepuisJson(null)).toBeNull();
    expect(lignesFigeesDepuisJson([])).toBeNull();
    expect(lignesFigeesDepuisJson([{ total_cents: "190" }])).toBeNull();
    expect(lignesFigeesDepuisJson([{ total_cents: 190.5 }])).toBeNull();
  });
});

describe("taux d'une ligne", () => {
  const actuels: TauxActuels = { formules: { "kick-off": 6 }, options: { gateau: 21 }, bubble: null };

  it("le taux figé à la vente l'emporte", () => {
    expect(tauxDeLaLigne(ligne({ totalCents: 1, tvaPourcent: 12 }), actuels)).toEqual({
      taux: 12,
      origine: "vente",
    });
  });

  it("sans taux figé, le taux réglé aujourd'hui, signalé comme tel", () => {
    expect(tauxDeLaLigne(ligne({ totalCents: 1, tvaPourcent: null }), actuels)).toEqual({
      taux: 6,
      origine: "actuel",
    });
    expect(
      tauxDeLaLigne(ligne({ totalCents: 1, tvaPourcent: null, nature: "option", ref: "gateau" }), actuels)
    ).toEqual({ taux: 21, origine: "actuel" });
  });

  it("ni l'un ni l'autre : inconnu", () => {
    expect(tauxDeLaLigne(ligne({ totalCents: 1, tvaPourcent: null }), AUCUN_TAUX)).toEqual({
      taux: null,
      origine: "inconnu",
    });
  });
});

describe("le rapport", () => {
  // 215 € : forfait 180 € et participant en plus 10 € à 6 %, gâteau 25 € à 21 %.
  const vente = paiement({
    montantCents: 21500,
    lignes: [
      ligne({ totalCents: 18000 }),
      ligne({
        nature: "participant_sup",
        designation: "Participant supplémentaire — formule Kick-Off",
        quantite: 1,
        puCents: 1000,
        totalCents: 1000,
      }),
      ligne({ nature: "option", ref: "gateau", designation: "Option — Gâteau", totalCents: 2500, tvaPourcent: 21 }),
    ],
  });

  it("ventile une vente par taux, et les totaux retombent sur le montant payé", () => {
    const r = construireRapport({ du: "2026-09-01", au: "2026-09-30", paiements: [vente], remboursements: [], actuels: AUCUN_TAUX });
    expect(r.ventes).toHaveLength(3);
    expect(r.ventesTtcCents).toBe(21500);
    expect(r.parTaux.map((t) => [t.tauxPourcent, t.netTtcCents])).toEqual([
      [6, 19000],
      [21, 2500],
    ]);
    // HTVA par ligne : 16981 + 943 (6 %) et 2066 (21 %).
    expect(r.parTaux[0].netHtCents).toBe(16981 + 943);
    expect(r.netHtCents + r.netTvaCents).toBe(21500);
    expect(r.avertissements).toEqual([]);
  });

  it("un remboursement de 50 % se répartit sur chaque taux, en négatif", () => {
    const r = construireRapport({
      du: "2026-10-01",
      au: "2026-10-31",
      paiements: [],
      remboursements: [{ id: 1, jour: "2026-10-05", montantCents: 10750, rembourseAvantCents: 0, repris: false, paiement: vente }],
      actuels: AUCUN_TAUX,
    });
    expect(r.remboursements.map((l) => l.ttcCents)).toEqual([-9000, -500, -1250]);
    expect(r.remboursementsTtcCents).toBe(-10750);
    expect(r.netTtcCents).toBe(-10750);
    expect(r.remboursements[0].designation).toBe("Remboursement — Anniversaire — formule Kick-Off");
    expect(r.remboursements[0].jourVente).toBe("2026-09-27");
    expect(r.parMois).toEqual([
      expect.objectContaining({ mois: "2026-10", remboursementsTtcCents: -10750, ventesTtcCents: 0 }),
    ]);
  });

  it("une vente et son remboursement total dans la même période s'annulent exactement", () => {
    const r = construireRapport({
      du: "2026-09-01",
      au: "2026-09-30",
      paiements: [vente],
      remboursements: [{ id: 1, jour: "2026-09-28", montantCents: 21500, rembourseAvantCents: 0, repris: false, paiement: vente }],
      actuels: AUCUN_TAUX,
    });
    expect(r.netTtcCents).toBe(0);
    expect(r.netHtCents).toBe(0);
    expect(r.netTvaCents).toBe(0);
    for (const t of r.parTaux) expect(t.netTtcCents).toBe(0);
  });

  it("un remboursement annulé par Stripe redevient une recette", () => {
    const r = construireRapport({
      du: "2026-10-01",
      au: "2026-10-31",
      paiements: [],
      remboursements: [{ id: 2, jour: "2026-10-06", montantCents: -2150, rembourseAvantCents: 0, repris: false, paiement: vente }],
      actuels: AUCUN_TAUX,
    });
    expect(r.remboursementsTtcCents).toBe(2150);
    expect(r.remboursements[0].designation).toMatch(/^Remboursement annulé — /);
  });

  it("sans taux, le TVAC est compté et l'avertissement le dit", () => {
    const sansTaux = paiement({ montantCents: 19000, lignes: [ligne({ totalCents: 19000, tvaPourcent: null })] });
    const r = construireRapport({ du: "2026-09-01", au: "2026-09-30", paiements: [sansTaux], remboursements: [], actuels: AUCUN_TAUX });
    expect(r.ventesTtcCents).toBe(19000);
    expect(r.ttcSansTauxCents).toBe(19000);
    expect(r.netHtCents).toBe(0);
    expect(r.parTaux).toEqual([expect.objectContaining({ tauxPourcent: null, netHtCents: null })]);
    expect(r.avertissements[0]).toMatch(/Taux de TVA non renseigné/);
  });

  it("une vente d'avant le réglage prend le taux actuel, et c'est signalé", () => {
    const ancienne = paiement({ montantCents: 19000, lignes: [ligne({ totalCents: 19000, tvaPourcent: null })] });
    const r = construireRapport({
      du: "2026-09-01",
      au: "2026-09-30",
      paiements: [ancienne],
      remboursements: [],
      actuels: { formules: { "kick-off": 6 }, options: {}, bubble: null },
    });
    expect(r.ventes[0].origineTaux).toBe("actuel");
    expect(r.netTvaCents).toBe(1075);
    expect(r.avertissements[0]).toMatch(/avant que leur taux soit renseigné/);
  });

  it("sans détail enregistré, une ligne unique au montant payé", () => {
    const r = construireRapport({
      du: "2026-09-01",
      au: "2026-09-30",
      paiements: [paiement({ montantCents: 19000, lignes: null })],
      remboursements: [],
      actuels: AUCUN_TAUX,
    });
    expect(r.ventes).toEqual([expect.objectContaining({ designation: "Anniversaire", ttcCents: 19000 })]);
    expect(r.avertissements.some((a) => a.startsWith("Détail non enregistré"))).toBe(true);
  });

  it("si le montant payé diffère du détail, le montant payé fait foi", () => {
    const r = construireRapport({
      du: "2026-09-01",
      au: "2026-09-30",
      paiements: [{ ...vente, montantCents: 21000 }],
      remboursements: [],
      actuels: AUCUN_TAUX,
    });
    expect(r.ventesTtcCents).toBe(21000);
    expect(r.avertissements.some((a) => a.startsWith("Montant payé différent"))).toBe(true);
  });

  it("totalise par mois et par moyen de paiement", () => {
    const r = construireRapport({
      du: "2026-09-01",
      au: "2026-10-31",
      paiements: [
        vente,
        paiement({ reference: "OW-BBBB0002", jourPaiement: "2026-10-02", montantCents: 19000, methode: "card" }),
      ],
      remboursements: [],
      actuels: AUCUN_TAUX,
    });
    expect(r.parMois.map((m) => [m.mois, m.ventesTtcCents])).toEqual([
      ["2026-09", 21500],
      ["2026-10", 19000],
    ]);
    expect(r.parMoyen).toEqual([
      expect.objectContaining({ methode: "Bancontact", ventesTtcCents: 21500, nombreVentes: 1 }),
      expect.objectContaining({ methode: "Carte", ventesTtcCents: 19000, nombreVentes: 1 }),
    ]);
    expect(r.nombreVentes).toBe(2);
  });

  it("une période sans vente rend des totaux à zéro, sans avertissement", () => {
    const r = construireRapport({ du: "2026-11-01", au: "2026-11-30", paiements: [], remboursements: [], actuels: AUCUN_TAUX });
    expect(r.ventesTtcCents).toBe(0);
    expect(r.parTaux).toEqual([]);
    expect(r.avertissements).toEqual([]);
  });
});

describe("base pas encore à jour", () => {
  it("reconnaît une colonne ou une table inconnue, et rien d'autre", async () => {
    const { schemaSansMigrationVentes } = await import("./db/migration-ventes");
    for (const code of ["42703", "42P01", "PGRST200", "PGRST204", "PGRST205"]) {
      expect(schemaSansMigrationVentes({ code })).toBe(true);
    }
    // Une vraie panne reste une panne : elle ne doit pas se déguiser en attente.
    expect(schemaSansMigrationVentes({ code: "57014" })).toBe(false);
    expect(schemaSansMigrationVentes({ code: null })).toBe(false);
    expect(schemaSansMigrationVentes(null)).toBe(false);
  });
});

describe("corrections de la relecture du 16 octobre 2026", () => {
  // 200,50 € : 180 € à 6 % et 20,50 € à 21 %.
  const mixte = paiement({
    montantCents: 20050,
    lignes: [
      ligne({ totalCents: 18000 }),
      ligne({ nature: "option", ref: "boissons", designation: "Option — Boissons", totalCents: 2050, tvaPourcent: 21 }),
    ],
  });

  it("une vente rendue en trois fois redonne exactement sa TVA, au centime", () => {
    const etapes = [3333, 3333, 13384];
    let avant = 0;
    const mouvements = etapes.map((montantCents, i) => {
      const m = { id: i + 1, jour: "2026-10-0" + (i + 2), montantCents, rembourseAvantCents: avant, repris: false, paiement: mixte };
      avant += montantCents;
      return m;
    });
    const r = construireRapport({
      du: "2026-09-01",
      au: "2026-10-31",
      paiements: [{ ...mixte, jourPaiement: "2026-09-27" }],
      remboursements: mouvements,
      actuels: AUCUN_TAUX,
    });
    expect(r.netTtcCents).toBe(0);
    for (const t of r.parTaux) {
      expect([t.tauxPourcent, t.netTtcCents, t.netHtCents, t.netTvaCents]).toEqual([t.tauxPourcent, 0, 0, 0]);
    }
  });

  it("un remboursement partiel suivant d'un autre mois tient compte de ce qui avait déjà été rendu", () => {
    // 100,25 € déjà rendus en septembre ; octobre ne voit que le solde.
    const r = construireRapport({
      du: "2026-10-01",
      au: "2026-10-31",
      paiements: [],
      remboursements: [{ id: 2, jour: "2026-10-04", montantCents: 10025, rembourseAvantCents: 10025, repris: false, paiement: mixte }],
      actuels: AUCUN_TAUX,
    });
    expect(r.remboursementsTtcCents).toBe(-10025);
    // Les deux moitiés réunies redonnent la vente entière : 180 € et 20,50 €.
    const septembre = construireRapport({
      du: "2026-09-01",
      au: "2026-09-30",
      paiements: [],
      remboursements: [{ id: 1, jour: "2026-09-29", montantCents: 10025, rembourseAvantCents: 0, repris: false, paiement: mixte }],
      actuels: AUCUN_TAUX,
    });
    const parLigne = (rr: typeof r) => rr.remboursements.map((l) => l.ttcCents);
    expect(parLigne(septembre).map((x, i) => x + parLigne(r)[i])).toEqual([-18000, -2050]);
  });

  it("une ligne unique prend le taux commun de sa formule et de ses options, s'il est le même", () => {
    const unique = paiement({ montantCents: 20500, lignes: null, optionsIds: ["gateau"] });
    const commun = construireRapport({
      du: "2026-09-01",
      au: "2026-09-30",
      paiements: [unique],
      remboursements: [],
      actuels: { formules: { "kick-off": 6 }, options: { gateau: 6 }, bubble: null },
    });
    expect(commun.ventes[0]).toMatchObject({ tauxPourcent: 6, origineTaux: "actuel" });
    const melange = construireRapport({
      du: "2026-09-01",
      au: "2026-09-30",
      paiements: [unique],
      remboursements: [],
      actuels: { formules: { "kick-off": 6 }, options: { gateau: 21 }, bubble: null },
    });
    expect(melange.ventes[0]).toMatchObject({ tauxPourcent: null, origineTaux: "inconnu" });
  });

  it("le Bubble Foot prend le taux réglé dans le code", () => {
    const bubble = paiement({
      montantCents: 18400,
      typeActivite: "bubble",
      formuleId: null,
      lignes: [ligne({ nature: "bubble", ref: null, designation: "Bubble Foot — par personne", quantite: 8, puCents: 2300, totalCents: 18400, tvaPourcent: null })],
    });
    const r = construireRapport({
      du: "2026-09-01",
      au: "2026-09-30",
      paiements: [bubble],
      remboursements: [],
      actuels: { formules: {}, options: {}, bubble: 21 },
    });
    expect(r.ventes[0]).toMatchObject({ tauxPourcent: 21, origineTaux: "actuel" });
  });
});
