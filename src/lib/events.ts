/**
 * Événements applicatifs échangés via `window`, pour relier deux composants
 * qui ne partagent pas de parent commun (la barre de navigation et le tunnel
 * de réservation, par exemple).
 */

/**
 * Émis au clic sur « Réserver » dans la barre de navigation.
 *
 * Le lien pointe vers /reservation ; lorsque l'utilisateur est déjà sur cette
 * page dans un parcours, Next considère qu'il n'y a pas de navigation à faire
 * et le tunnel resterait affiché. Le tunnel écoute donc cet événement pour
 * revenir au choix des trois activités.
 */
export const RESERVER_RESET_EVENT = "ow-reserver-reset";
