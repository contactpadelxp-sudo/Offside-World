import { TEAM_BUILDING_APRES_MIDI, TEAM_BUILDING_MATIN } from "@/data/bubble-team";
import type { CreneauVue } from "@/lib/vues";

/**
 * Ce que le tunnel propose pour le team building : matin, après-midi, journée.
 *
 * CE NE SONT PLUS DES PRÉFÉRENCES, CE SONT DES DISPONIBILITÉS.
 *
 * Jusqu'au 24 septembre 2026, ce module fabriquait des demi-journées à partir
 * d'un calendrier — « les dix prochains lundis, mardis, jeudis et vendredis ».
 * Rien ne les rattachait à la base : deux entreprises pouvaient demander le
 * même lundi matin, et aucune n'était jamais affichée « complet », faute de
 * pouvoir l'établir.
 *
 * Depuis la migration 0036, le team building a de vrais créneaux, générés en
 * base et tenus par les demandes de devis. Ce module ne fait plus que les
 * REGROUPER en ce que l'entreprise choisit réellement :
 *
 *   - le MATIN est libre s'il reste au moins un créneau de 09h00 libre ce
 *     jour-là, dans n'importe quelle Fun zone ;
 *   - l'APRÈS-MIDI, de même pour 14h00 ;
 *   - la JOURNÉE ENTIÈRE existe quand le jour a les deux, et elle est libre
 *     quand les deux le sont.
 *
 * Le choix de la Fun zone n'est pas demandé à l'entreprise : elle n'a aucune
 * raison de préférer l'une ou l'autre. C'est le serveur qui en attribue une au
 * moment d'enregistrer — et qui, pour une journée entière, garde le même
 * terrain matin et après-midi quand il le peut. Voir `demanderDevis`.
 *
 * Un jour dont Brahim a fermé tous les créneaux n'apparaît simplement pas :
 * la vue `creneaux_disponibles` ne montre que les créneaux ouverts.
 */

export type PeriodeTeamBuilding = "matin" | "apres-midi" | "journee";

export interface DemiJourneeVue {
  /** « 2026-10-05-matin » — unique dans la liste. */
  id: string;
  /** « 2026-10-05 » */
  jour: string;
  /** « Lundi 5 octobre » */
  jourLabel: string;
  periode: PeriodeTeamBuilding;
  periodeLabel: "Matin" | "Après-midi" | "Journée entière";
  /** « 09:00 » */
  debut: string;
  /** « 13:00 » */
  fin: string;
  /** Faux quand toutes les Fun zones sont déjà demandées ou réservées. */
  libre: boolean;
}

/** Les libellés et les heures de chaque période, au même endroit. */
export const PERIODES: Record<
  PeriodeTeamBuilding,
  { label: DemiJourneeVue["periodeLabel"]; debut: string; fin: string }
> = {
  matin: { label: "Matin", debut: TEAM_BUILDING_MATIN.debut, fin: TEAM_BUILDING_MATIN.fin },
  "apres-midi": {
    label: "Après-midi",
    debut: TEAM_BUILDING_APRES_MIDI.debut,
    fin: TEAM_BUILDING_APRES_MIDI.fin,
  },
  journee: {
    label: "Journée entière",
    debut: TEAM_BUILDING_MATIN.debut,
    fin: TEAM_BUILDING_APRES_MIDI.fin,
  },
};

/**
 * Regroupe les créneaux de team building en demi-journées et journées.
 *
 * L'ordre d'entrée est conservé : `lireCreneaux` les rend triés par début, les
 * jours sortent donc dans l'ordre du calendrier, et dans chaque jour le matin
 * précède l'après-midi, puis la journée entière.
 */
export function demiJourneesDepuisCreneaux(creneaux: CreneauVue[]): DemiJourneeVue[] {
  const parJour = new Map<string, { label: string; matin: CreneauVue[]; apresMidi: CreneauVue[] }>();

  for (const c of creneaux) {
    let jour = parJour.get(c.jour);
    if (!jour) {
      jour = { label: c.jourLabel, matin: [], apresMidi: [] };
      parJour.set(c.jour, jour);
    }
    // On range par HEURE DE DÉBUT, pas par position dans la journée : un
    // créneau ajouté à la main à une autre heure ne se fait pas passer pour
    // un matin ou un après-midi qu'il n'est pas.
    if (c.debut === PERIODES.matin.debut) jour.matin.push(c);
    else if (c.debut === PERIODES["apres-midi"].debut) jour.apresMidi.push(c);
  }

  const sortie: DemiJourneeVue[] = [];
  for (const [jour, { label, matin, apresMidi }] of parJour) {
    const matinLibre = matin.some((c) => c.libre);
    const apresMidiLibre = apresMidi.some((c) => c.libre);

    const ajouter = (periode: PeriodeTeamBuilding, libre: boolean) =>
      sortie.push({
        id: `${jour}-${periode}`,
        jour,
        jourLabel: label,
        periode,
        periodeLabel: PERIODES[periode].label,
        debut: PERIODES[periode].debut,
        fin: PERIODES[periode].fin,
        libre,
      });

    if (matin.length > 0) ajouter("matin", matinLibre);
    if (apresMidi.length > 0) ajouter("apres-midi", apresMidiLibre);
    // La journée n'existe que si le jour porte les deux moitiés : le vendredi,
    // qui n'a que le matin, n'en propose donc pas.
    if (matin.length > 0 && apresMidi.length > 0) {
      ajouter("journee", matinLibre && apresMidiLibre);
    }
  }
  return sortie;
}
