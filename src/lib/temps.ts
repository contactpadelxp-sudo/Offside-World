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

export function heure(instant: Date): string {
  return HEURE.format(instant);
}
