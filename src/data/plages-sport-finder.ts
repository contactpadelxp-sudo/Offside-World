/**
 * Les heures où le complexe est vendu par Sport-Finder, et non par ce site.
 *
 * POURQUOI CE FICHIER EXISTE.
 *
 * Le complexe n'a que DEUX espaces physiques, les Fun zones 1 et 2. Les mêmes
 * servent aux anniversaires, au Bubble Foot et à la location de terrain. Le
 * site vend les premiers ; Sport-Finder, un outil tiers, vend les deux autres.
 * Les deux systèmes ne se voient pas et aucune intégration n'est prévue : le
 * SEUL garde-fou contre la double vente d'un même sol est que leurs plages
 * horaires ne se touchent jamais.
 *
 * Jusqu'ici ce garde-fou ne vivait que dans un paragraphe de `MISE-EN-LIGNE.md`
 * et dans la fonction de génération, qui ne produit des créneaux qu'aux heures
 * sûres. Mais le back-office permet de créer un créneau à la main, et d'en
 * rouvrir un fermé — deux gestes qui ne consultaient rien. Un anniversaire
 * ouvert un samedi à 21h partait à la vente pendant qu'un joueur louait le même
 * terrain, et rien nulle part ne le signalait.
 *
 * DES CONSTANTES, ET PAS UNE TABLE. Une table serait modifiable sans
 * redéploiement — mais elle demanderait un écran pour l'éditer, et le dépôt
 * porte déjà le contre-exemple : `horaires_bubble` a été créée le 19 septembre
 * 2026 précisément pour sortir des heures du code, n'a jamais reçu d'écran, et
 * compte zéro ligne à ce jour. Une table sans écran reste vide, et vide elle ne
 * protège de rien tout en donnant l'impression du contraire.
 *
 * ELLES DOIVENT SUIVRE SPORT-FINDER, ET RIEN NE LE VÉRIFIE. C'est la limite
 * honnête de ce fichier : personne ici ne peut lire les horaires réellement
 * configurés chez le tiers. Le jour où Brahim les change, il faut changer ces
 * lignes. Voir `MISE-EN-LIGNE.md`, section « fermer la porte de Sport-Finder ».
 */

/** Une plage d'un jour donné, en heure locale de Bruxelles. */
export interface PlageReservee {
  /** ISO : 1 = lundi … 7 = dimanche. */
  jour: number;
  /** « 14:00 ». Bornes incluses côté début. */
  debut: string;
  /**
   * « 25:00 » pour une heure de fermeture après minuit.
   *
   * Le complexe ferme à 1 h du matin : écrire « 01:00 » ferait une plage vide
   * — de 20 h à 1 h « avant » dans la même journée —, et le contrôle laisserait
   * passer toute la soirée. On compte donc les heures au-delà de 24, comme le
   * fait couramment un planning d'exploitation.
   */
  fin: string;
  /** Ce que Sport-Finder vend sur ce créneau, pour l'écrire dans le refus. */
  libelle: string;
}

/**
 * Les horaires RÉELLEMENT configurés chez Sport-Finder, relevés le 24 septembre
 * 2026, jour de la mise en ligne, sur la fiche « Location de terrain Offside » :
 * lundi–vendredi 18h00 → 00h00, samedi–dimanche 17h00 → 00h00.
 *
 * Le Bubble Foot suit les heures du foot (Brahim, 20 septembre 2026) : c'est
 * pourquoi chaque plage le nomme aussi.
 *
 * ELLES REMPLACENT UNE CIBLE QUI N'A JAMAIS ÉTÉ APPLIQUÉE. Ce fichier portait
 * les horaires envoyés par Brahim le 21 septembre — 14 h–01 h les lundi, mardi
 * et jeudi, 20 h–01 h les autres jours —, encodés d'avance en attendant qu'il
 * les configure. Il a finalement réglé Sport-Finder autrement, le jour même où
 * le dernier anniversaire du week-end était retiré (migration 0034). Le code
 * gardait la cible, et se trompait dans les deux sens :
 *
 *   - TROP STRICT les lundi, mardi et jeudi. Chaque après-midi de team
 *     building (14h–18h) était signalé comme « aussi vendu sur Sport-Finder »,
 *     et Brahim était prié de fermer une plage qui n'existe pas.
 *   - TROP LÂCHE les autres jours. Un créneau ouvert à la main un samedi de
 *     17h à 19h passait sans un mot, alors que le foot y est en vente.
 *
 * TOUT CE QUE LE SITE VEND S'ARRÊTE PILE À L'OUVERTURE DU FOOT : anniversaires
 * à 18h le mercredi et le vendredi, à 17h le samedi et le dimanche ; team
 * building à 13h ou 18h. Bord à bord, sans chevauchement — voir la convention
 * des intervalles plus bas.
 *
 * La fermeture est écrite « 24:00 », et non « 25:00 » comme avant : c'est
 * minuit que Sport-Finder affiche, et ce fichier suit ce qui est vendu, pas
 * l'heure où la porte se ferme.
 */
export const PLAGES_SPORT_FINDER: readonly PlageReservee[] = [
  { jour: 1, debut: "18:00", fin: "24:00", libelle: "location de terrain et Bubble Foot" },
  { jour: 2, debut: "18:00", fin: "24:00", libelle: "location de terrain et Bubble Foot" },
  { jour: 3, debut: "18:00", fin: "24:00", libelle: "location de terrain et Bubble Foot" },
  { jour: 4, debut: "18:00", fin: "24:00", libelle: "location de terrain et Bubble Foot" },
  { jour: 5, debut: "18:00", fin: "24:00", libelle: "location de terrain et Bubble Foot" },
  { jour: 6, debut: "17:00", fin: "24:00", libelle: "location de terrain et Bubble Foot" },
  { jour: 7, debut: "17:00", fin: "24:00", libelle: "location de terrain et Bubble Foot" },
];

/** « 20:30 » → 1230. Accepte les heures au-delà de 24 (voir `PlageReservee.fin`). */
function enMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return Number(h) * 60 + Number(m);
}

export interface ConflitSportFinder {
  /** La plage heurtée, telle qu'on l'écrit à l'exploitant : « 17:00 – 00:00 ». */
  plage: string;
  libelle: string;
}

/**
 * Ce créneau mord-il sur une plage vendue par Sport-Finder ?
 *
 * `null` s'il est sûr. Les deux dates sont des instants ; on les ramène à
 * l'heure locale de Bruxelles, seule heure que l'exploitant et Sport-Finder
 * partagent.
 *
 * UN CRÉNEAU QUI FRANCHIT MINUIT EST TRAITÉ SUR SON JOUR DE DÉBUT. C'est le
 * bon repère : un anniversaire de 23 h à 1 h appartient à la soirée où il
 * commence, et c'est cette soirée-là qui est vendue ailleurs. Une plage peut
 * d'ailleurs finir au-delà de « 24:00 » précisément pour que la comparaison
 * reste possible sans changer de jour.
 *
 * ON COMPARE DES INTERVALLES OUVERTS À DROITE. Un créneau qui finit exactement
 * à l'heure d'ouverture du foot ne mord pas dessus : l'anniversaire du
 * mercredi, 16 h–18 h, contre une ouverture à 18 h, est une succession, pas un
 * chevauchement. Tout ce que le site vend repose sur cette règle depuis le
 * 24 septembre 2026. C'est la même convention que la
 * contrainte d'exclusion de la base, qui compare des `tstzrange` bornés à
 * droite exclus.
 */
export function conflitSportFinder(debut: Date, fin: Date): ConflitSportFinder | null {
  /*
    ON RELIT L'HEURE DE BRUXELLES, ON NE LA RECALCULE PAS.

    Les instants viennent de `creneaux.debut`, un `timestamptz`, et le serveur
    tourne en UTC : lire `getHours()` donnerait l'heure de Greenwich, décalée
    d'une ou deux heures selon la saison. `Intl` avec `timeZone` est la seule
    conversion qui suit les changements d'heure sans table à maintenir, et
    `weekday: "short"` évite de redériver un jour de semaine après le décalage —
    un créneau du samedi 00h30 est un vendredi en UTC.
  */
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Brussels",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const parties = fmt.formatToParts(debut);
  const jourCourt = parties.find((p) => p.type === "weekday")?.value ?? "";
  const heure = Number(parties.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parties.find((p) => p.type === "minute")?.value ?? "0");

  const ISO: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  const jourISO = ISO[jourCourt];
  if (!jourISO) return null;

  // La durée réelle, mesurée sur les instants : elle traverse proprement un
  // minuit comme une nuit de changement d'heure.
  const dureeMin = Math.round((fin.getTime() - debut.getTime()) / 60000);
  return conflitSurHeureLocale(jourISO, heure * 60 + minute, dureeMin);
}

/**
 * La même question, posée depuis une heure DÉJÀ locale.
 *
 * `creerCreneau` reçoit « 2026-10-03 » et « 21:00 », qui sont par définition
 * l'heure du complexe : les convertir en instant pour les reconvertir aussitôt
 * ferait passer par le fuseau du serveur — UTC en production — et déplacerait
 * le créneau d'une ou deux heures. On compare donc directement.
 *
 * `jourISO` se déduit de la date sans aucun fuseau : c'est une question de
 * calendrier, pas d'horloge.
 */
export function conflitSurHeureLocale(
  jourISO: number,
  debutMinutes: number,
  dureeMinutes: number
): ConflitSportFinder | null {
  const finMinutes = debutMinutes + dureeMinutes;
  for (const p of PLAGES_SPORT_FINDER) {
    if (p.jour !== jourISO) continue;
    const pDebut = enMinutes(p.debut);
    const pFin = enMinutes(p.fin);
    if (debutMinutes < pFin && finMinutes > pDebut) {
      return { plage: `${p.debut} – ${finLisible(p.fin)}`, libelle: p.libelle };
    }
  }
  return null;
}

/**
 * Le jour ISO d'une date « 2026-10-03 », sans jamais toucher à un fuseau.
 *
 * Midi UTC : n'importe quelle heure loin des bords ferait l'affaire, mais midi
 * garantit que le décalage d'un fuseau ne fait pas changer de jour, y compris
 * aux antipodes. `getUTCDay()` rend 0 pour dimanche, que l'ISO numérote 7.
 */
export function jourISODeLaDate(jour: string): number {
  const d = new Date(`${jour}T12:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
}

/** « 25:00 » → « 01:00 ». L'exploitant lit une heure, pas une arithmétique. */
function finLisible(hhmm: string): string {
  const minutes = enMinutes(hhmm);
  if (minutes < 24 * 60) return hhmm;
  const reste = minutes - 24 * 60;
  return `${String(Math.floor(reste / 60)).padStart(2, "0")}:${String(reste % 60).padStart(2, "0")}`;
}

/**
 * Le refus, rédigé une fois pour les deux appelants.
 *
 * Il NOMME la plage et ce qui s'y vend, parce qu'un refus qui ne dit pas
 * pourquoi pousse à chercher le moyen de le contourner. Et il dit la seule
 * porte de sortie honnête : fermer d'abord la plage chez Sport-Finder.
 */
export function messageConflit(c: ConflitSportFinder): string {
  return (
    `Ce créneau tombe entre ${c.plage}, quand Sport-Finder vend ${c.libelle} sur ces mêmes ` +
    "terrains. Les deux systèmes ne se voient pas : deux clients pourraient acheter le même " +
    "sol. Fermez d'abord la plage sur Sport-Finder, puis cochez la confirmation ci-dessous " +
    "pour l'ouvrir ici."
  );
}
