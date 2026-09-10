/**
 * Les trois activités réservables, et le chemin qui mène à chacune.
 *
 * POURQUOI CE FICHIER EXISTE. L'identifiant d'une activité était écrit à la
 * main à douze endroits — en-tête, pied de page, section « activités » de
 * l'accueil, deux boutons de la page d'accueil, le tunnel lui-même. Chacun
 * fabriquait son URL par concaténation, et rien ne reliait ces chaînes à la
 * liste des valeurs que le tunnel accepte réellement. Une faute de frappe dans
 * `?activite=grouppes` ne casse rien de visible : elle ouvre simplement le
 * tunnel sur le choix d'activité, comme si le lien n'avait pas été cliqué.
 * C'est le pire genre de bug — silencieux, et il coûte une réservation.
 *
 * Ce fichier ne contient PAS les textes ni les photos des activités : ceux-là
 * dépendent de la base et du système d'emplacements photo, donc d'un hook.
 * Voir `useActivites()`. Ici, seulement ce qui peut être une constante.
 */

export const ACTIVITES = ["anniversaire", "foot", "groupes"] as const;

export type ActiviteId = (typeof ACTIVITES)[number];

/** Vrai si la chaîne est un identifiant d'activité connu. */
export function estActivite(v: string | null | undefined): v is ActiviteId {
  return typeof v === "string" && (ACTIVITES as readonly string[]).includes(v);
}

/**
 * Lien profond vers le tunnel, ouvert directement sur l'activité demandée.
 *
 * Le paramètre est encodé alors qu'aucun identifiant n'en a besoin
 * aujourd'hui : le jour où l'un d'eux contiendra autre chose que des lettres,
 * l'URL restera valable sans qu'on ait à y repenser.
 */
export function hrefActivite(id: ActiviteId): string {
  return `/reservation?activite=${encodeURIComponent(id)}`;
}
