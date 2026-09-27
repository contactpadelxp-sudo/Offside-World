import { conflitSurHeureLocale, jourISODeLaDate, PLAGES_SPORT_FINDER } from "@/data/plages-sport-finder";
import type { CreneauAdmin, ReservationAdmin } from "@/lib/vues";

/**
 * L'agenda d'une journée : ce que le back-office dessine, calculé à part.
 *
 * Demandé par Mathis le 27 septembre 2026 : voir les réservations d'une
 * journée sur une grille horaire, une colonne par Fun zone, plutôt qu'en
 * liste. Le calcul vit ici, sans React, pour être testé : c'est lui qui
 * décide où tombe chaque bloc, et une erreur d'une demi-heure s'y verrait
 * aussi mal qu'elle coûterait cher.
 *
 * CE QUI APPARAÎT, ET POURQUOI.
 *
 *   - Les RÉSERVATIONS actives, en attente ou confirmées.
 *   - Les créneaux TENUS PAR UNE DEMANDE DE DEVIS (team building) : sans eux,
 *     on lirait libre une matinée qu'une entreprise attend.
 *   - Les créneaux FERMÉS — c'est ainsi que Brahim bloque les anniversaires
 *     pris par téléphone, et ils doivent se voir à côté des autres.
 *   - Les créneaux LIBRES, en discret : c'est ce qui reste à vendre.
 *   - La plage de SPORT-FINDER, sur toute la largeur : les terrains y sont
 *     loués ailleurs, et la journée ne s'arrête pas à 18h.
 *
 * CE QUI N'APPARAÎT PAS : les créneaux d'un espace hors service qui ne portent
 * rien (la Fun zone 3), et les créneaux fermés qui tombent dans les heures de
 * Sport-Finder. Ceux-là ne sont pas des blocages : ce sont les anciens
 * vendredis 18h30 fermés par la migration 0028, qu'on ne peut plus rouvrir.
 * Les dessiner ferait croire à un anniversaire chaque vendredi soir.
 */

export type BlocAgenda =
  | { genre: "reservation"; debut: number; fin: number; reservation: ReservationAdmin }
  | { genre: "devis"; debut: number; fin: number; id: string; reference: string }
  | { genre: "ferme"; debut: number; fin: number; creneauId: string }
  | { genre: "libre"; debut: number; fin: number; creneauId: string };

/** Un bloc placé : sa voie et le nombre de voies de son groupe, s'il en chevauche d'autres. */
export type BlocPlace = BlocAgenda & { voie: number; voies: number };

export interface ColonneAgenda {
  espace: string;
  blocs: BlocPlace[];
}

export interface Agenda {
  /** Minutes depuis minuit, heure de Bruxelles. */
  debut: number;
  fin: number;
  colonnes: ColonneAgenda[];
  sportFinder: { debut: number; fin: number; libelle: string } | null;
}

/** La grille commence à 9h, l'heure du premier team building. */
export const DEBUT_JOURNEE = 9 * 60;
/** Et finit à minuit, avec la location de terrain. */
export const FIN_JOURNEE = 24 * 60;

/** « 15:30 » → 930. */
export function enMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return Number(h) * 60 + Number(m);
}

/** Une fin à « 00:00 » après un début de soirée est minuit, pas le matin. */
function finEnMinutes(debut: number, hhmm: string): number {
  const fin = enMinutes(hhmm);
  return fin <= debut ? fin + 24 * 60 : fin;
}

/**
 * Range les blocs d'une colonne en voies, pour que deux blocs qui se
 * chevauchent s'affichent côte à côte au lieu de se recouvrir.
 */
function placer(blocs: BlocAgenda[]): BlocPlace[] {
  const tries = [...blocs].sort((a, b) => a.debut - b.debut || b.fin - a.fin);
  const places: BlocPlace[] = [];
  let groupe: BlocPlace[] = [];
  let finGroupe = -1;
  let finsDesVoies: number[] = [];

  const clore = () => {
    const voies = finsDesVoies.length;
    for (const b of groupe) b.voies = voies;
    places.push(...groupe);
    groupe = [];
    finsDesVoies = [];
  };

  for (const b of tries) {
    if (groupe.length > 0 && b.debut >= finGroupe) clore();
    let voie = finsDesVoies.findIndex((f) => f <= b.debut);
    if (voie === -1) {
      voie = finsDesVoies.length;
      finsDesVoies.push(b.fin);
    } else {
      finsDesVoies[voie] = b.fin;
    }
    groupe.push({ ...b, voie, voies: 1 });
    finGroupe = Math.max(finGroupe, b.fin);
  }
  if (groupe.length > 0) clore();
  return places;
}

export function construireAgenda({
  jour,
  creneaux,
  reservations,
  espaces,
}: {
  jour: string;
  creneaux: CreneauAdmin[];
  reservations: ReservationAdmin[];
  /** Les espaces en service : ils ont leur colonne même un jour vide. */
  espaces: string[];
}): Agenda {
  const jourSemaine = jourISODeLaDate(jour);
  const parEspace = new Map<string, BlocAgenda[]>();
  const ajouter = (espace: string, bloc: BlocAgenda) => {
    const liste = parEspace.get(espace) ?? [];
    liste.push(bloc);
    parEspace.set(espace, liste);
  };
  for (const e of espaces) parEspace.set(e, []);

  for (const r of reservations) {
    if (r.jour !== jour) continue;
    const debut = enMinutes(r.debut);
    ajouter(r.espaceNom ?? "Sans espace", {
      genre: "reservation",
      debut,
      fin: finEnMinutes(debut, r.fin),
      reservation: r,
    });
  }

  for (const c of creneaux) {
    if (c.jour !== jour) continue;
    // Une réservation se dessine depuis la réservation elle-même, avec son
    // client : le créneau n'ajouterait qu'un doublon.
    if (c.reservePar) continue;
    const debut = enMinutes(c.debut);
    const fin = finEnMinutes(debut, c.fin);

    if (c.tenuParDevis) {
      ajouter(c.espaceNom, { genre: "devis", debut, fin, ...c.tenuParDevis });
      continue;
    }
    if (!c.espaceActif) continue;
    if (!c.ouvert) {
      if (conflitSurHeureLocale(jourSemaine, debut, fin - debut)) continue;
      ajouter(c.espaceNom, { genre: "ferme", debut, fin, creneauId: c.id });
      continue;
    }
    ajouter(c.espaceNom, { genre: "libre", debut, fin, creneauId: c.id });
  }

  const tous = [...parEspace.values()].flat();
  const plage = PLAGES_SPORT_FINDER.find((p) => p.jour === jourSemaine);

  return {
    debut: Math.min(DEBUT_JOURNEE, ...tous.map((b) => Math.floor(b.debut / 60) * 60)),
    fin: Math.max(FIN_JOURNEE, ...tous.map((b) => Math.ceil(b.fin / 60) * 60)),
    colonnes: [...parEspace.entries()]
      .sort(([a], [b]) => a.localeCompare(b, "fr"))
      .map(([espace, blocs]) => ({ espace, blocs: placer(blocs) })),
    sportFinder: plage
      ? { debut: enMinutes(plage.debut), fin: enMinutes(plage.fin), libelle: plage.libelle }
      : null,
  };
}
