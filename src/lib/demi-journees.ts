import { jourISO, jourLisible } from "@/lib/temps";
import { TEAM_BUILDING_MATIN, TEAM_BUILDING_APRES_MIDI } from "@/data/bubble-team";

/**
 * Demi-journées proposées pour le team building.
 *
 * Le team building se vend sur devis : ce n'est pas une réservation ferme et
 * cela n'occupe donc aucun créneau en base (voir le commentaire de la table
 * `demandes_devis`). Ces demi-journées ne sont pas des disponibilités — ce
 * sont des préférences que l'entreprise indique et que le complexe confirme.
 *
 * C'est aussi pourquoi aucune n'est affichée « complet » : rien ne pourrait
 * l'établir, et l'afficher quand même serait inventer une information.
 */

export interface DemiJourneeVue {
  id: string;
  /** « 2026-09-14 » */
  jour: string;
  /** « lundi 14 septembre » */
  jourLabel: string;
  periode: "matin" | "apres-midi";
  periodeLabel: "Matin" | "Après-midi";
  debut: string;
  fin: string;
}

/**
 * Les `nbJours` prochains jours ouvrables, en deux demi-journées chacun.
 * Le premier jour proposé est le lendemain : une demande de devis pour
 * le jour même n'a pas de sens.
 */
export function prochainesDemiJournees(nbJours = 10, depuis = new Date()): DemiJourneeVue[] {
  const sortie: DemiJourneeVue[] = [];
  const curseur = new Date(depuis);

  while (sortie.length < nbJours * 2) {
    curseur.setDate(curseur.getDate() + 1);
    const semaine = curseur.getDay(); // 0 = dimanche
    if (semaine === 0 || semaine === 6) continue;

    const jour = jourISO(curseur);
    const label = jourLisible(curseur);
    sortie.push(
      {
        id: `${jour}-matin`,
        jour,
        jourLabel: label,
        periode: "matin",
        periodeLabel: "Matin",
        debut: TEAM_BUILDING_MATIN.debut,
        fin: TEAM_BUILDING_MATIN.fin,
      },
      {
        id: `${jour}-apres-midi`,
        jour,
        jourLabel: label,
        periode: "apres-midi",
        periodeLabel: "Après-midi",
        debut: TEAM_BUILDING_APRES_MIDI.debut,
        fin: TEAM_BUILDING_APRES_MIDI.fin,
      }
    );
  }

  return sortie;
}
