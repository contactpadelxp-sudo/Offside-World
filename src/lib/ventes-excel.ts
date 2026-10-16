import "server-only";
import ExcelJS from "exceljs";
import {
  ADRESSE_LIGNE,
  BCE,
  NOM_COMMERCIAL,
  RAISON_SOCIALE,
  TVA,
} from "@/data/entreprise";
import {
  LIBELLE_ORIGINE,
  LIBELLE_STATUT,
  methodeLisible,
  moisLong,
  periodeLisible,
  tauxLisible,
  type LigneRapport,
  type RapportVentes,
} from "@/lib/ventes";

/**
 * Le récapitulatif en Excel — le fichier que Brahim envoie à son comptable.
 *
 * TROIS ONGLETS, DANS L'ORDRE OÙ UN COMPTABLE LES LIT.
 *
 *   1. « Récapitulatif » : qui, quelle période, les totaux par taux de TVA, par
 *      mois et par moyen de paiement, puis ce qu'il faut savoir avant de
 *      s'en servir — périmètre, méthode, et tout point à vérifier.
 *   2. « Ventes » : une ligne par élément vendu, datée de son encaissement.
 *   3. « Remboursements » : une ligne par élément remboursé, datée du
 *      remboursement, avec la date de la vente d'origine.
 *
 * DE VRAIS NOMBRES ET DE VRAIES DATES, PAS DU TEXTE. Un montant écrit
 * « 179,25 € » en texte ne s'additionne pas ; ici chaque montant est un nombre
 * au format monétaire et chaque date une date, que le comptable peut trier,
 * filtrer et totaliser. Les totaux des onglets de détail sont des formules
 * SOUS.TOTAL — ils ne comptent que les lignes visibles, et suivent donc un
 * filtre —, accompagnées de leur valeur calculée pour s'afficher même dans un
 * aperçu qui ne recalcule rien.
 *
 * LES CHIFFRES VIENNENT TOUS DE `construireRapport`. Ce fichier ne fait que les
 * poser : l'écran du back-office, le CSV et cet Excel affichent donc les mêmes
 * montants, au centime.
 */

const FORMAT_EUROS = '#,##0.00 "€";-#,##0.00 "€"';
const FORMAT_DATE = "dd/mm/yyyy";
const FORMAT_TAUX = '0" %"';

const GRIS_ENTETE = "FFEDEDED";
const JAUNE_ALERTE = "FFFFF4D6";

function euros(cents: number | null): number | null {
  return cents === null ? null : cents / 100;
}

/** « 2026-10-16 » → une date Excel, sans décalage de fuseau. */
function dateExcel(jour: string): Date {
  const [a, m, j] = jour.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, j));
}

function entete(ligne: ExcelJS.Row) {
  ligne.font = { bold: true };
  ligne.alignment = { vertical: "middle", wrapText: true };
  ligne.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRIS_ENTETE } };
    c.border = { bottom: { style: "thin" } };
  });
}

function totalEnGras(ligne: ExcelJS.Row) {
  ligne.font = { bold: true };
  ligne.eachCell((c) => {
    c.border = { top: { style: "thin" } };
  });
}

/** Un titre de section du récapitulatif. */
function titreSection(feuille: ExcelJS.Worksheet, texte: string) {
  feuille.addRow([]);
  const l = feuille.addRow([texte]);
  l.font = { bold: true, size: 12 };
}

function recapitulatif(classeur: ExcelJS.Workbook, r: RapportVentes, genereLe: string) {
  const f = classeur.addWorksheet("Récapitulatif", {
    pageSetup: { orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 },
  });
  f.columns = [
    { width: 34 },
    { width: 18 },
    { width: 22 },
    { width: 18 },
    { width: 18 },
    { width: 16 },
    { width: 20 },
  ];

  const titre = f.addRow(["Récapitulatif des ventes en ligne"]);
  titre.font = { bold: true, size: 16 };
  f.addRow([`${RAISON_SOCIALE ?? NOM_COMMERCIAL} — ${NOM_COMMERCIAL}`]).font = { bold: true };
  f.addRow([`N° d'entreprise ${BCE ?? "—"} · TVA BE ${TVA ?? "—"}`]);
  f.addRow([ADRESSE_LIGNE]);
  f.addRow([]);
  f.addRow([`Période : ${periodeLisible(r.du, r.au)}`]).font = { bold: true };
  f.addRow([`Généré le ${genereLe}, depuis le back-office du site.`]);

  // ── À lire d'abord, s'il y a lieu ──
  if (r.avertissements.length > 0) {
    titreSection(f, "À vérifier avant d'utiliser ces chiffres");
    for (const a of r.avertissements) {
      const l = f.addRow([a]);
      f.mergeCells(l.number, 1, l.number, 7);
      l.alignment = { wrapText: true, vertical: "top" };
      l.height = 32;
      l.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: JAUNE_ALERTE } };
    }
  }

  // ── Par taux ──
  titreSection(f, "Totaux par taux de TVA");
  entete(f.addRow(["Taux de TVA", "Ventes TVAC", "Remboursements TVAC", "Net TVAC", "Net HTVA", "TVA nette"]));
  for (const t of r.parTaux) {
    const l = f.addRow([
      tauxLisible(t.tauxPourcent),
      euros(t.ventesTtcCents),
      euros(t.remboursementsTtcCents),
      euros(t.netTtcCents),
      euros(t.netHtCents),
      euros(t.netTvaCents),
    ]);
    for (const c of [2, 3, 4, 5, 6]) l.getCell(c).numFmt = FORMAT_EUROS;
  }
  if (r.parTaux.length === 0) f.addRow(["Aucune vente ni aucun remboursement sur la période."]);
  const total = f.addRow([
    "Total",
    euros(r.ventesTtcCents),
    euros(r.remboursementsTtcCents),
    euros(r.netTtcCents),
    r.ttcSansTauxCents === 0 ? euros(r.netHtCents) : null,
    r.ttcSansTauxCents === 0 ? euros(r.netTvaCents) : null,
  ]);
  for (const c of [2, 3, 4, 5, 6]) total.getCell(c).numFmt = FORMAT_EUROS;
  totalEnGras(total);
  if (r.ttcSansTauxCents !== 0) {
    // Un total HTVA qui additionnerait des lignes sans taux serait faux : on
    // le laisse vide et on dit pourquoi, plutôt que de l'afficher incomplet.
    f.addRow([
      "HTVA et TVA totaux non calculés : une partie des ventes n'a pas de taux renseigné.",
    ]).font = { italic: true };
  }

  // ── Par mois ──
  if (r.parMois.length > 1) {
    titreSection(f, "Totaux par mois");
    entete(f.addRow(["Mois", "Ventes TVAC", "Remboursements TVAC", "Net TVAC", "Net HTVA", "TVA nette", "dont TVAC sans taux"]));
    for (const m of r.parMois) {
      const l = f.addRow([
        moisLong(m.mois),
        euros(m.ventesTtcCents),
        euros(m.remboursementsTtcCents),
        euros(m.netTtcCents),
        euros(m.netHtCents),
        euros(m.netTvaCents),
        euros(m.ttcSansTauxCents),
      ]);
      for (const c of [2, 3, 4, 5, 6, 7]) l.getCell(c).numFmt = FORMAT_EUROS;
    }
  }

  // ── Par moyen de paiement ──
  if (r.parMoyen.length > 0) {
    titreSection(f, "Par moyen de paiement");
    entete(f.addRow(["Moyen de paiement", "Nombre de ventes", "Ventes TVAC", "Remboursements TVAC"]));
    for (const m of r.parMoyen) {
      const l = f.addRow([m.methode, m.nombreVentes, euros(m.ventesTtcCents), euros(m.remboursementsTtcCents)]);
      for (const c of [3, 4]) l.getCell(c).numFmt = FORMAT_EUROS;
    }
  }

  titreSection(f, "En chiffres");
  f.addRow(["Ventes encaissées", r.nombreVentes]);
  f.addRow(["Remboursements effectués", r.nombreRemboursements]);

  // ── Périmètre et méthode ──
  titreSection(f, "Périmètre et méthode");
  const notes = [
    "Ce document recense les paiements reçus en ligne sur le site, par Stripe (Bancontact ou carte). " +
      "Il ne contient pas : la location de terrain et le Bubble Foot vendus sur Sport-Finder, les " +
      "ventes au bar, les paiements reçus sur place, ni les factures de team building, établies à part.",
    "Les montants sont ceux payés par les clients, TVA comprise. La TVA en est extraite au taux de " +
      "chaque ligne : HTVA = TVAC ÷ (1 + taux), arrondi au centime par ligne ; TVA = TVAC − HTVA.",
    "Une vente est datée du jour de son paiement ; un remboursement, du jour où il a été effectué. " +
      "La date de l'activité figure dans l'onglet « Ventes ».",
    "Les frais Stripe ne sont pas déduits : ils figurent sur les relevés et les factures de Stripe.",
    "Le détail de chaque vente (formule, participants supplémentaires, options) et son taux de TVA " +
      "sont enregistrés au moment de la réservation : un tarif modifié ensuite ne change pas une " +
      "vente passée.",
  ];
  for (const n of notes) {
    const l = f.addRow([n]);
    f.mergeCells(l.number, 1, l.number, 7);
    l.alignment = { wrapText: true, vertical: "top" };
    l.height = 32;
  }
}

/**
 * Une ligne de total sous un tableau de détail : une formule, avec sa valeur.
 *
 * SOUS.TOTAL(109 ; …) et non SOMME : il ignore les lignes masquées par un
 * filtre. Le comptable qui filtre « Taux TVA = 6 » lit donc le total du 6 %,
 * et non celui de tout le tableau.
 *
 * Les lignes sans taux n'entrent pas dans les totaux HTVA et TVA — elles n'en
 * ont pas. On l'écrit alors sous le total, au lieu de laisser croire que
 * HTVA + TVA y redonnent le TVAC.
 */
function ligneDeTotal(
  f: ExcelJS.Worksheet,
  libelleColonne: number,
  colonnes: { col: number; valeur: number }[],
  premiere: number,
  derniere: number,
  lignesSansTaux: number
) {
  const l = f.addRow([]);
  l.getCell(libelleColonne).value = "Total";
  for (const { col, valeur } of colonnes) {
    const lettre = f.getColumn(col).letter;
    l.getCell(col).value =
      derniere >= premiere
        ? { formula: `SUBTOTAL(109,${lettre}${premiere}:${lettre}${derniere})`, result: valeur }
        : 0;
    l.getCell(col).numFmt = FORMAT_EUROS;
  }
  totalEnGras(l);
  if (lignesSansTaux > 0) {
    const note = f.addRow([]);
    note.getCell(libelleColonne).value =
      `${lignesSansTaux} ligne${lignesSansTaux > 1 ? "s" : ""} sans taux de TVA : comptée${lignesSansTaux > 1 ? "s" : ""} dans le TVAC, pas dans les totaux HTVA et TVA.`;
    note.font = { italic: true };
  }
}

function somme(lignes: LigneRapport[], champ: "ttcCents" | "htCents" | "tvaCents"): number {
  return lignes.reduce((s, l) => s + (l[champ] ?? 0), 0) / 100;
}

function detailVentes(classeur: ExcelJS.Workbook, r: RapportVentes) {
  const f = classeur.addWorksheet("Ventes", {
    views: [{ state: "frozen", ySplit: 1 }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 },
  });
  f.columns = [
    { header: "Date de paiement", width: 14 },
    { header: "Référence", width: 15 },
    { header: "Date de l'activité", width: 14 },
    { header: "Désignation", width: 44 },
    { header: "Quantité", width: 10 },
    { header: "Prix unitaire TVAC", width: 14 },
    { header: "Montant TVAC", width: 14 },
    { header: "Taux TVA", width: 10 },
    { header: "Montant HTVA", width: 14 },
    { header: "TVA", width: 12 },
    { header: "Moyen de paiement", width: 16 },
    { header: "Statut de la réservation", width: 16 },
    { header: "Origine du taux", width: 20 },
  ];
  entete(f.getRow(1));

  for (const l of r.ventes) {
    const ligne = f.addRow([
      dateExcel(l.jour),
      l.reference,
      l.jourActivite ? dateExcel(l.jourActivite) : null,
      l.designation,
      l.quantite,
      euros(l.puCents),
      euros(l.ttcCents),
      l.tauxPourcent,
      euros(l.htCents),
      euros(l.tvaCents),
      methodeLisible(l.methode),
      LIBELLE_STATUT[l.statutReservation],
      LIBELLE_ORIGINE[l.origineTaux],
    ]);
    ligne.getCell(1).numFmt = FORMAT_DATE;
    ligne.getCell(3).numFmt = FORMAT_DATE;
    for (const c of [6, 7, 9, 10]) ligne.getCell(c).numFmt = FORMAT_EUROS;
    ligne.getCell(8).numFmt = FORMAT_TAUX;
  }

  if (r.ventes.length > 0) {
    f.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1 + r.ventes.length, column: 13 } };
  } else {
    f.addRow(["Aucune vente encaissée sur la période."]);
  }
  ligneDeTotal(
    f,
    4,
    [
      { col: 7, valeur: somme(r.ventes, "ttcCents") },
      { col: 9, valeur: somme(r.ventes, "htCents") },
      { col: 10, valeur: somme(r.ventes, "tvaCents") },
    ],
    2,
    1 + r.ventes.length,
    r.ventes.filter((l) => l.tauxPourcent === null).length
  );
}

function detailRemboursements(classeur: ExcelJS.Workbook, r: RapportVentes) {
  const f = classeur.addWorksheet("Remboursements", {
    views: [{ state: "frozen", ySplit: 1 }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 },
  });
  f.columns = [
    { header: "Date du remboursement", width: 16 },
    { header: "Référence", width: 15 },
    { header: "Date de la vente", width: 14 },
    { header: "Date de l'activité", width: 14 },
    { header: "Désignation", width: 50 },
    { header: "Montant TVAC", width: 14 },
    { header: "Taux TVA", width: 10 },
    { header: "Montant HTVA", width: 14 },
    { header: "TVA", width: 12 },
    { header: "Moyen de paiement", width: 16 },
    { header: "Origine du taux", width: 20 },
  ];
  entete(f.getRow(1));

  for (const l of r.remboursements) {
    const ligne = f.addRow([
      dateExcel(l.jour),
      l.reference,
      dateExcel(l.jourVente),
      l.jourActivite ? dateExcel(l.jourActivite) : null,
      l.designation,
      euros(l.ttcCents),
      l.tauxPourcent,
      euros(l.htCents),
      euros(l.tvaCents),
      methodeLisible(l.methode),
      LIBELLE_ORIGINE[l.origineTaux],
    ]);
    for (const c of [1, 3, 4]) ligne.getCell(c).numFmt = FORMAT_DATE;
    for (const c of [6, 8, 9]) ligne.getCell(c).numFmt = FORMAT_EUROS;
    ligne.getCell(7).numFmt = FORMAT_TAUX;
  }

  if (r.remboursements.length > 0) {
    f.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1 + r.remboursements.length, column: 11 } };
  } else {
    f.addRow(["Aucun remboursement sur la période."]);
  }
  ligneDeTotal(
    f,
    5,
    [
      { col: 6, valeur: somme(r.remboursements, "ttcCents") },
      { col: 8, valeur: somme(r.remboursements, "htCents") },
      { col: 9, valeur: somme(r.remboursements, "tvaCents") },
    ],
    2,
    1 + r.remboursements.length,
    r.remboursements.filter((l) => l.tauxPourcent === null).length
  );
}

export async function rapportEnExcel(r: RapportVentes, genereLe: string): Promise<Uint8Array> {
  const classeur = new ExcelJS.Workbook();
  classeur.creator = NOM_COMMERCIAL;
  classeur.title = `Ventes en ligne ${periodeLisible(r.du, r.au)}`;
  classeur.created = new Date();

  recapitulatif(classeur, r, genereLe);
  detailVentes(classeur, r);
  detailRemboursements(classeur, r);

  const tampon = await classeur.xlsx.writeBuffer();
  return new Uint8Array(tampon as ArrayBuffer);
}
