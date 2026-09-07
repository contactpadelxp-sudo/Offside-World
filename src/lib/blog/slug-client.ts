/**
 * Fabrication de l'adresse d'un article à partir de son titre.
 *
 * Ce fichier n'est PAS `server-only`, contrairement au reste du dossier :
 * l'éditeur affiche l'adresse pendant la frappe, donc le navigateur en a
 * besoin. Et le serveur la recalcule à l'enregistrement, car ce qui vient du
 * navigateur ne fait jamais foi.
 *
 * La règle est donc écrite une seule fois, ici, et importée des deux côtés —
 * la dupliquer garantirait qu'un jour les deux divergent, et l'article
 * atterrirait à une adresse différente de celle annoncée à l'auteur.
 */
export function versSlugClient(titre: string): string {
  return titre
    .normalize("NFD")
    // Retire les signes diacritiques laissés par la décomposition, sans quoi
    // « Réservé » donnerait « rserv » : le « é » deviendrait « e » + accent,
    // et l'accent seul ne survivrait pas au filtre alphanumérique.
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
}
