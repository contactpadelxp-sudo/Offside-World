import ExcelJS from "exceljs";
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { champCsv, montantCsv, rapportEnCsv } from "./ventes-csv";
import { rapportEnExcel } from "./ventes-excel";
import { construireRapport, type LigneFigee, type PaiementVente } from "./ventes";

/**
 * Les deux fichiers que Brahim envoie à son comptable, relus comme le
 * comptable les lira : le CSV comme un texte, l'Excel en le rouvrant.
 */

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

const vente: PaiementVente = {
  formuleId: "kick-off",
  optionsIds: ["gateau"],
  paiementId: "p1",
  reference: "OW-CQCRX6LT",
  typeActivite: "anniversaire",
  statutReservation: "confirmee",
  jourActivite: "2026-10-11",
  jourPaiement: "2026-09-27",
  montantCents: 21500,
  methode: "bancontact",
  lignes: [
    ligne({ totalCents: 18000 }),
    ligne({
      nature: "participant_sup",
      designation: "Participant supplémentaire — formule Kick-Off",
      puCents: 1000,
      totalCents: 1000,
    }),
    ligne({ nature: "option", ref: "gateau", designation: "Option — Gâteau; « maison »", totalCents: 2500, tvaPourcent: 21 }),
  ],
};

const rapport = construireRapport({
  du: "2026-09-01",
  au: "2026-10-31",
  paiements: [vente],
  remboursements: [{ id: 1, jour: "2026-10-05", montantCents: 10750, rembourseAvantCents: 0, repris: false, paiement: vente }],
  actuels: { formules: {}, options: {}, bubble: null },
});

describe("le CSV", () => {
  const csv = rapportEnCsv(rapport);
  const lignes = csv.replace(/^﻿/, "").trimEnd().split("\r\n");

  it("commence par la marque UTF-8 qu'Excel attend", () => {
    expect(csv.startsWith("﻿")).toBe(true);
  });

  it("une ligne d'en-tête, puis une ligne par élément vendu ou remboursé", () => {
    expect(lignes[0].split(";")[0]).toBe("Type");
    expect(lignes).toHaveLength(1 + 3 + 3);
  });

  it("montants à la virgule, dates belges, remboursements en négatif", () => {
    const premiere = lignes[1].split(";");
    expect(premiere.slice(0, 3)).toEqual(["Vente", "27/09/2026", "OW-CQCRX6LT"]);
    expect(premiere[8]).toBe("180,00");
    expect(premiere[9]).toBe("6");
    expect(premiere[10]).toBe("169,81");
    expect(premiere[11]).toBe("10,19");
    const remb = lignes[4].split(";");
    expect(remb[0]).toBe("Remboursement");
    expect(remb[8]).toBe("-90,00");
  });

  it("un point-virgule dans une désignation ne décale aucune colonne", () => {
    const gateau = lignes.find((l) => l.includes("Gâteau"))!;
    expect(gateau).toContain('"Option — Gâteau; « maison »"');
  });

  it("aucun champ ne peut devenir une formule", () => {
    expect(champCsv("=SOMME(A1)")).toBe("'=SOMME(A1)");
    expect(champCsv("+32 470")).toBe("'+32 470");
    // Des guillemets dans un champ : le champ est encadré, les guillemets doublés.
    expect(champCsv('dit "bonjour"')).toBe('"dit ""bonjour"""');
    expect(champCsv('a;"b"')).toBe('"a;""b"""');
  });

  it("montants : centimes justes, signe gardé", () => {
    expect(montantCsv(17925)).toBe("179,25");
    expect(montantCsv(-5)).toBe("-0,05");
    expect(montantCsv(0)).toBe("0,00");
    expect(montantCsv(null)).toBe("");
  });
});

describe("le fichier Excel", () => {
  it("s'ouvre, et porte les mêmes chiffres que le rapport", async () => {
    const octets = await rapportEnExcel(rapport, "16 octobre 2026 à 14:32");
    if (process.env.EXEMPLE_VENTES_XLSX) fs.writeFileSync(process.env.EXEMPLE_VENTES_XLSX, octets);

    const classeur = new ExcelJS.Workbook();
    await classeur.xlsx.load(Buffer.from(octets) as unknown as ArrayBuffer);
    expect(classeur.worksheets.map((f) => f.name)).toEqual(["Récapitulatif", "Ventes", "Remboursements"]);

    // Récapitulatif : la période en toutes lettres, le total net.
    const recap = classeur.getWorksheet("Récapitulatif")!;
    const textes: string[] = [];
    recap.eachRow((r) => r.eachCell((c) => textes.push(String(c.value))));
    expect(textes).toContain("Période : du 1er septembre 2026 au 31 octobre 2026");
    let ligneTotal: ExcelJS.Row | undefined;
    recap.eachRow((r) => {
      if (r.getCell(1).value === "Total") ligneTotal = r;
    });
    expect(ligneTotal?.getCell(4).value).toBeCloseTo(107.5, 2);

    // Ventes : de vrais nombres et de vraies dates, un total en formule.
    const ventes = classeur.getWorksheet("Ventes")!;
    expect(ventes.rowCount).toBe(1 + 3 + 1);
    expect(ventes.getCell("A2").value).toEqual(new Date(Date.UTC(2026, 8, 27)));
    expect(ventes.getCell("G2").value).toBe(180);
    expect(ventes.getCell("G2").numFmt).toContain("€");
    expect(ventes.getCell("H4").value).toBe(21);
    const total = ventes.getCell("G5").value as { formula: string; result: number };
    // SOUS.TOTAL : le total suit un filtre posé par le comptable.
    expect(total.formula).toBe("SUBTOTAL(109,G2:G4)");
    expect(total.result).toBeCloseTo(215, 2);

    // Remboursements : négatifs, avec la date de la vente d'origine.
    const remb = classeur.getWorksheet("Remboursements")!;
    expect(remb.getCell("F2").value).toBe(-90);
    expect(remb.getCell("C2").value).toEqual(new Date(Date.UTC(2026, 8, 27)));
  });
});
