/**
 * La période d'un récapitulatif des ventes, lue dans l'adresse.
 *
 * DES RACCOURCIS COMPTABLES, PAS SEULEMENT « LES 30 DERNIERS JOURS ». Une
 * déclaration de TVA belge porte sur un mois ou sur un trimestre CIVIL : le
 * comptable demandera « septembre » ou « le troisième trimestre », jamais
 * « du 16 septembre au 15 octobre ». Les raccourcis donnent donc des mois et
 * des trimestres entiers ; les deux champs de date restent là pour le reste.
 *
 * UNE ADRESSE INCOHÉRENTE EST REMISE D'APLOMB, PAS REFUSÉE — dates inversées,
 * période de plus de deux ans. Deux ans et non un : le premier exercice d'une
 * société peut durer jusqu'à vingt-quatre mois.
 *
 * Fonction pure, sans horloge cachée : « aujourd'hui » est un paramètre, ce qui
 * la rend testable.
 */

export type Raccourci =
  | "mois"
  | "mois-dernier"
  | "trimestre"
  | "trimestre-dernier"
  | "annee"
  | "annee-derniere";

export const RACCOURCIS: { valeur: Raccourci; label: string }[] = [
  { valeur: "mois", label: "Ce mois-ci" },
  { valeur: "mois-dernier", label: "Mois dernier" },
  { valeur: "trimestre", label: "Ce trimestre" },
  { valeur: "trimestre-dernier", label: "Trimestre dernier" },
  { valeur: "annee", label: "Cette année" },
  { valeur: "annee-derniere", label: "Année dernière" },
];

export const JOURS_MAX = 731;

const FORMAT_JOUR = /^\d{4}-\d{2}-\d{2}$/;

function iso(a: number, m: number, j: number): string {
  return `${a}-${String(m).padStart(2, "0")}-${String(j).padStart(2, "0")}`;
}

/** Dernier jour du mois `m` (1 à 12). */
function finDeMois(a: number, m: number): number {
  return new Date(Date.UTC(a, m, 0)).getUTCDate();
}

function valide(jour: string | undefined): jour is string {
  if (!jour || !FORMAT_JOUR.test(jour)) return false;
  const [a, m, j] = jour.split("-").map(Number);
  return m >= 1 && m <= 12 && j >= 1 && j <= finDeMois(a, m);
}

function decaler(jour: string, jours: number): string {
  const d = new Date(new Date(`${jour}T12:00:00Z`).getTime() + jours * 86_400_000);
  return d.toISOString().slice(0, 10);
}

function ecart(du: string, au: string): number {
  return Math.round(
    (new Date(`${au}T12:00:00Z`).getTime() - new Date(`${du}T12:00:00Z`).getTime()) / 86_400_000
  );
}

/** Les bornes d'un raccourci, vues depuis `aujourdhui` (« 2026-10-16 »). */
export function bornesDuRaccourci(r: Raccourci, aujourdhui: string): { du: string; au: string } {
  const [a, m] = aujourdhui.split("-").map(Number);
  const trimestre = Math.floor((m - 1) / 3); // 0 à 3
  switch (r) {
    case "mois":
      return { du: iso(a, m, 1), au: aujourdhui };
    case "mois-dernier": {
      const [ap, mp] = m === 1 ? [a - 1, 12] : [a, m - 1];
      return { du: iso(ap, mp, 1), au: iso(ap, mp, finDeMois(ap, mp)) };
    }
    case "trimestre":
      return { du: iso(a, trimestre * 3 + 1, 1), au: aujourdhui };
    case "trimestre-dernier": {
      const [ap, tp] = trimestre === 0 ? [a - 1, 3] : [a, trimestre - 1];
      const fin = tp * 3 + 3;
      return { du: iso(ap, tp * 3 + 1, 1), au: iso(ap, fin, finDeMois(ap, fin)) };
    }
    case "annee":
      return { du: iso(a, 1, 1), au: aujourdhui };
    case "annee-derniere":
      return { du: iso(a - 1, 1, 1), au: iso(a - 1, 12, 31) };
  }
}

export interface PeriodeVentes {
  du: string;
  au: string;
  /** Le raccourci qui correspond exactement à la période, s'il y en a un. */
  raccourci: Raccourci | null;
}

export function lirePeriodeVentes(
  params: { du?: string; au?: string; periode?: string },
  aujourdhui: string
): PeriodeVentes {
  let du: string;
  let au: string;

  if (valide(params.du) && valide(params.au)) {
    [du, au] = params.du <= params.au ? [params.du, params.au] : [params.au, params.du];
    if (ecart(du, au) >= JOURS_MAX) du = decaler(au, -(JOURS_MAX - 1));
  } else {
    const demande = RACCOURCIS.find((r) => r.valeur === params.periode)?.valeur ?? "mois";
    ({ du, au } = bornesDuRaccourci(demande, aujourdhui));
  }

  const raccourci =
    RACCOURCIS.find((r) => {
      const b = bornesDuRaccourci(r.valeur, aujourdhui);
      return b.du === du && b.au === au;
    })?.valeur ?? null;

  return { du, au, raccourci };
}
