import {
  LIBELLE_ORIGINE,
  LIBELLE_STATUT,
  jourCourt,
  methodeLisible,
  type LigneRapport,
  type RapportVentes,
} from "@/lib/ventes";

/**
 * Le récapitulatif en CSV — pour un logiciel comptable qui l'importe.
 *
 * Le fichier Excel est fait pour être lu ; celui-ci, pour être importé. Une
 * ligne par ligne de vente ou de remboursement, une colonne « Type » pour les
 * distinguer, et aucun total : un import additionne lui-même, et une ligne de
 * total au milieu des données serait importée comme une vente de plus.
 *
 * LES CONVENTIONS D'UN EXCEL BELGE, PAS CELLES D'UN TABLEUR AMÉRICAIN :
 *
 *   - le POINT-VIRGULE sépare les colonnes, parce que la virgule est le
 *     séparateur décimal ;
 *   - les montants s'écrivent « 179,25 », sans séparateur de milliers ni
 *     symbole, pour rester des nombres une fois importés ;
 *   - les dates s'écrivent « 16/10/2026 » ;
 *   - le fichier commence par une marque d'ordre des octets UTF-8 : sans elle,
 *     Excel l'ouvre en Windows-1252 et « Désignation » devient « DÃ©signation ».
 *
 * AUCUN CHAMP NE PEUT DEVENIR UNE FORMULE. Une désignation qui commencerait par
 * « = », « + », « - » ou « @ » serait exécutée par le tableur à l'ouverture.
 * Les désignations viennent des tarifs, saisis au back-office : on les
 * neutralise quand même, c'est le geste standard et il ne coûte rien.
 */

/** Centimes → « 179,25 » / « -95,00 ». */
export function montantCsv(cents: number | null): string {
  if (cents === null) return "";
  const negatif = cents < 0;
  const absolu = Math.abs(cents);
  return `${negatif ? "-" : ""}${Math.floor(absolu / 100)},${String(absolu % 100).padStart(2, "0")}`;
}

/** Un champ texte prêt pour le CSV : guillemets doublés, formule neutralisée. */
export function champCsv(valeur: string): string {
  const neutralise = /^[=+\-@\t\r]/.test(valeur) ? `'${valeur}` : valeur;
  return /[;"\r\n]/.test(neutralise) ? `"${neutralise.replace(/"/g, '""')}"` : neutralise;
}

const ENTETES = [
  "Type",
  "Date",
  "Référence",
  "Date de la vente",
  "Date de l'activité",
  "Désignation",
  "Quantité",
  "Prix unitaire TVAC",
  "Montant TVAC",
  "Taux TVA (%)",
  "Montant HTVA",
  "TVA",
  "Moyen de paiement",
  "Statut de la réservation",
  "Origine du taux",
];

function ligneCsv(l: LigneRapport): string {
  return [
    champCsv(l.genre === "vente" ? "Vente" : "Remboursement"),
    jourCourt(l.jour),
    champCsv(l.reference),
    jourCourt(l.jourVente),
    l.jourActivite ? jourCourt(l.jourActivite) : "",
    champCsv(l.designation),
    l.quantite === null ? "" : String(l.quantite),
    montantCsv(l.puCents),
    montantCsv(l.ttcCents),
    l.tauxPourcent === null ? "" : String(l.tauxPourcent).replace(".", ","),
    montantCsv(l.htCents),
    montantCsv(l.tvaCents),
    champCsv(methodeLisible(l.methode)),
    champCsv(LIBELLE_STATUT[l.statutReservation]),
    champCsv(LIBELLE_ORIGINE[l.origineTaux]),
  ].join(";");
}

export function rapportEnCsv(rapport: RapportVentes): string {
  const lignes = [ENTETES.map(champCsv).join(";")];
  for (const l of [...rapport.ventes, ...rapport.remboursements].sort(
    (a, b) => a.jour.localeCompare(b.jour) || (a.genre === b.genre ? 0 : a.genre === "vente" ? -1 : 1)
  )) {
    lignes.push(ligneCsv(l));
  }
  // CRLF : la fin de ligne qu'attend Excel sous Windows, et que tous les
  // logiciels comptables acceptent.
  return "﻿" + lignes.join("\r\n") + "\r\n";
}
