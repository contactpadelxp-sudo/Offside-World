/**
 * Louer un terrain.
 *
 * Les réservations de terrain sont gérées par SportFinder : le planning, les
 * disponibilités et le paiement se font chez eux. Le site ne fait qu'orienter
 * vers le compte du complexe.
 */

/**
 * Page de réservation des terrains sur Sport-Finder (URL publique, sans jeton :
 * elle ne donne accès qu'au calendrier, pas au compte du complexe).
 *
 * Lien direct vers la location de terrain. Le « 107 » est l'identifiant du
 * produit chez Sport-Finder : si le catalogue est réorganisé, c'est la seule
 * valeur à mettre à jour ici.
 */
export const SPORTFINDER_URL =
  "https://www.sport-finder.com/fr/center/offside-foot-indoor/booking/field_rental/107/book?sport=1";

/** Page publique du complexe, toutes activités confondues. */
export const SPORTFINDER_CENTRE_URL =
  "https://www.sport-finder.com/fr/center/offside-foot-indoor";

export const FOOT_INCLUS = [
  "Éclairage du terrain",
  "Ballon fourni",
  "Accès aux vestiaires",
  "Chasubles à disposition",
];
