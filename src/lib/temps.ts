/**
 * Dates et heures, toujours en heure de Bruxelles.
 *
 * Le navigateur d'un client peut être réglé sur n'importe quel fuseau. Si on
 * laissait `new Date(...).toLocaleString()` choisir, un visiteur à Londres
 * verrait un créneau de 15 h affiché à 14 h — et réserverait la mauvaise heure.
 * Tout le formatage est donc figé sur Europe/Bruxelles et fait côté serveur,
 * ce qui supprime au passage tout risque d'écart entre le rendu serveur et
 * l'hydratation.
 */

export const FUSEAU = "Europe/Brussels";

/** « 2026-09-05 » — identifiant de journée, stable et triable. */
const JOUR_ISO = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSEAU,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** « samedi 5 septembre » — libellé affiché. */
const JOUR_LISIBLE = new Intl.DateTimeFormat("fr-BE", {
  timeZone: FUSEAU,
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** « 15:00 » */
const HEURE = new Intl.DateTimeFormat("fr-BE", {
  timeZone: FUSEAU,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function jourISO(instant: Date): string {
  return JOUR_ISO.format(instant);
}

export function jourLisible(instant: Date): string {
  return JOUR_LISIBLE.format(instant);
}

/**
 * « samedi 5 septembre » -> « Samedi 5 septembre ».
 *
 * Fait en JavaScript et non avec `capitalize` de Tailwind, qui met une
 * majuscule à CHAQUE mot et produirait « Samedi 5 Septembre » — les noms de
 * mois ne prennent pas de majuscule en français. `first-letter:uppercase`
 * n'irait pas non plus : la pseudo-classe ne s'applique pas aux éléments en
 * ligne, où la plupart de ces dates sont affichées.
 */
export function capitaliser(v: string): string {
  return v.charAt(0).toUpperCase() + v.slice(1);
}

/** Libellé de journée prêt à être affiché seul. */
export function jourLisibleCap(instant: Date): string {
  return capitaliser(jourLisible(instant));
}

/**
 * « Mer. 2 sept. » — pour les bandes de jours, où « Mercredi 2 septembre »
 * ne laisse tenir que deux dates sur un écran de téléphone.
 */
const JOUR_COMPACT = new Intl.DateTimeFormat("fr-BE", {
  timeZone: FUSEAU,
  weekday: "short",
  day: "numeric",
  month: "short",
});

export function jourCompact(instant: Date): string {
  return capitaliser(JOUR_COMPACT.format(instant));
}

/**
 * Les trois morceaux d'une puce de date : « Dim. », « 20 », « sept. ».
 *
 * POURQUOI DÉCOUPÉ PLUTÔT QU'EN UNE CHAÎNE. Une bande de dates défilante a
 * besoin de puces de LARGEUR IDENTIQUE, sinon elle se lit comme une suite
 * d'accidents : « Mer. 2 sept. » et « Dimanche 20 septembre » n'occupent pas la
 * même place, et une rangée de tailles inégales est exactement ce qui donnait
 * l'impression que les dates étaient posées au hasard. Sur trois lignes de
 * largeur fixe, le jour du mois devient l'ancre visuelle et le reste se range
 * autour.
 *
 * L'ENTRÉE EST UN JOUR ISO, PAS UN INSTANT, et ce n'est pas indifférent. Les
 * créneaux portent déjà `jour` — « 2026-09-20 » — calculé côté serveur en heure
 * de Bruxelles. Repartir de l'instant ici referait ce calcul dans le navigateur
 * du visiteur, avec son fuseau à lui : un client à Londres verrait la veille
 * sur la puce et le bon jour dans le récapitulatif.
 *
 * Midi UTC pour reconstruire la date : Bruxelles est à UTC+1 ou +2, donc 13 h
 * ou 14 h locales — le même jour calendaire dans les deux cas, changement
 * d'heure compris. Minuit aurait basculé au jour précédent.
 */
const PUCE_SEMAINE = new Intl.DateTimeFormat("fr-BE", { timeZone: FUSEAU, weekday: "short" });
const PUCE_JOUR = new Intl.DateTimeFormat("fr-BE", { timeZone: FUSEAU, day: "numeric" });
const PUCE_MOIS = new Intl.DateTimeFormat("fr-BE", { timeZone: FUSEAU, month: "short" });
/** « septembre 2026 » — séparateur de mois dans la bande. */
const MOIS_LONG = new Intl.DateTimeFormat("fr-BE", { timeZone: FUSEAU, month: "long", year: "numeric" });

function instantDepuisJourISO(jour: string): Date {
  return new Date(`${jour}T12:00:00Z`);
}

export function partiesDuJour(jour: string): { semaine: string; numero: string; mois: string } {
  const d = instantDepuisJourISO(jour);
  return {
    semaine: capitaliser(PUCE_SEMAINE.format(d)).replace(/\.$/, ""),
    numero: PUCE_JOUR.format(d),
    mois: PUCE_MOIS.format(d).replace(/\.$/, ""),
  };
}

/** « Septembre 2026 » — pour séparer les mois dans une bande de dates. */
export function moisDuJour(jour: string): string {
  return capitaliser(MOIS_LONG.format(instantDepuisJourISO(jour)));
}

export function heure(instant: Date): string {
  return HEURE.format(instant);
}

/**
 * Combien d'heures séparent `maintenant` du début de l'activité.
 *
 * POURQUOI CETTE FONCTION EXISTE SÉPARÉMENT.
 *
 * C'est le nombre que le barème d'annulation consomme pour décider si le
 * client est remboursé en entier, à moitié, ou pas du tout. Il vivait sous
 * forme d'expression en ligne dans l'action d'annulation :
 *
 *     (new Date(avant.debut).getTime() - Date.now()) / 3_600_000
 *
 * Le barème et sa conversion en euros étaient couverts par vingt-huit tests ;
 * cette ligne-là, par aucun. Or c'est exactement l'endroit où se logent les
 * deux erreurs qui coûtent de l'argent sans se voir : une unité fausse — des
 * minutes ou des jours au lieu d'heures, et tout le monde bascule d'un palier —
 * et un décalage de fuseau, qui se déclenche une nuit de changement d'heure.
 *
 * ELLE NE FAIT AUCUNE CONVERSION DE FUSEAU, ET C'EST VOULU. Un `timestamptz`
 * de PostgreSQL et l'horloge du serveur désignent tous deux un INSTANT absolu ;
 * leur différence est la même quel que soit le fuseau dans lequel on les
 * regarde. Convertir vers Europe/Bruxelles avant de soustraire n'ajouterait
 * rien et introduirait un bug au changement d'heure.
 *
 * `maintenant` est un paramètre plutôt qu'un `Date.now()` caché : c'est ce qui
 * rend la fonction testable sans figer l'horloge.
 *
 * Renvoie un nombre NÉGATIF si l'activité est déjà passée — le barème sait quoi
 * en faire, et le lui cacher serait pire.
 */
export function heuresAvant(debut: string | Date, maintenant: Date = new Date()): number {
  const instant = debut instanceof Date ? debut : new Date(debut);
  if (Number.isNaN(instant.getTime())) {
    throw new Error(`Date de créneau illisible : ${String(debut)}`);
  }
  return (instant.getTime() - maintenant.getTime()) / 3_600_000;
}
