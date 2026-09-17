import { jourISO, jourLisibleCap } from "@/lib/temps";
import {
  TEAM_BUILDING_APRES_MIDI,
  TEAM_BUILDING_JOURS,
  TEAM_BUILDING_JOURS_APRES_MIDI,
  TEAM_BUILDING_MATIN,
} from "@/data/bubble-team";

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
 * Les prochaines demi-journées où un team building est possible.
 *
 * LES JOURS SONT CEUX DU COMPLEXE, PLUS « TOUS LES JOURS OUVRABLES ».
 *
 * On proposait lundi à vendredi, matin et après-midi — une hypothèse posée
 * faute de mieux. Brahim a donné les vrais jours le 17 septembre 2026 : lundi,
 * mardi et jeudi en entier ; vendredi le matin seulement. Ni le mercredi ni le
 * week-end, qui sont pris par les anniversaires.
 *
 * Proposer une demi-journée impossible n'est pas neutre : l'entreprise choisit
 * une date, reçoit un devis, et découvre ensuite qu'il faut tout redécaler.
 *
 * `nbJours` compte des JOURS RETENUS, pas des jours de calendrier ; la boucle
 * est bornée pour ne pas tourner indéfiniment si la liste des jours venait à se
 * vider.
 */
export function prochainesDemiJournees(nbJours = 10, depuis = new Date()): DemiJourneeVue[] {
  const sortie: DemiJourneeVue[] = [];
  const curseur = new Date(depuis);
  let jourRetenus = 0;
  let gardeFou = 0;

  while (jourRetenus < nbJours && gardeFou++ < 400) {
    curseur.setDate(curseur.getDate() + 1);
    // `getDay()` : 0 = dimanche. La norme ISO employée côté SQL met lundi à 1
    // et dimanche à 7 — on convertit pour que les deux parlent la même langue.
    const iso = curseur.getDay() === 0 ? 7 : curseur.getDay();
    if (!TEAM_BUILDING_JOURS.includes(iso as (typeof TEAM_BUILDING_JOURS)[number])) continue;
    jourRetenus++;

    const jour = jourISO(curseur);
    const label = jourLisibleCap(curseur);
    const apresMidiPossible = TEAM_BUILDING_JOURS_APRES_MIDI.includes(
      iso as (typeof TEAM_BUILDING_JOURS_APRES_MIDI)[number]
    );
    sortie.push({
      id: `${jour}-matin`,
      jour,
      jourLabel: label,
      periode: "matin",
      periodeLabel: "Matin",
      debut: TEAM_BUILDING_MATIN.debut,
      fin: TEAM_BUILDING_MATIN.fin,
    });

    // Le vendredi s'arrête à midi : on ne propose pas l'après-midi ce jour-là.
    if (apresMidiPossible) {
      sortie.push({
        id: `${jour}-apres-midi`,
        jour,
        jourLabel: label,
        periode: "apres-midi",
        periodeLabel: "Après-midi",
        debut: TEAM_BUILDING_APRES_MIDI.debut,
        fin: TEAM_BUILDING_APRES_MIDI.fin,
      });
    }
  }

  return sortie;
}
