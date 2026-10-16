/**
 * La migration 0040 est-elle appliquée ?
 *
 * POURQUOI LA QUESTION SE POSE. Le code du récapitulatif des ventes a été
 * poussé le 16 octobre 2026, alors que la migration qu'il lit ne pouvait pas
 * encore être appliquée — l'accès à la base de production manquait ce jour-là.
 * Plutôt que de faire dépendre le déploiement de l'ordre des deux gestes, le
 * code reconnaît une base pas encore à jour et le DIT : « Tarifs » fonctionne
 * comme avant, sans le champ TVA ; « Ventes » explique ce qui manque. Dès que
 * la migration est passée, tout s'active, sans redéploiement.
 *
 * Les codes reconnus sont ceux que PostgreSQL et PostgREST renvoient pour une
 * colonne ou une table inconnue. Toute autre erreur reste une panne, et
 * remonte comme telle.
 */

const CODES_SCHEMA_ANCIEN = new Set([
  "42703", // colonne inconnue (PostgreSQL)
  "42P01", // table inconnue (PostgreSQL)
  "PGRST200", // relation introuvable dans le cache de PostgREST
  "PGRST204", // colonne introuvable dans le cache de PostgREST
  "PGRST205", // table introuvable dans le cache de PostgREST
]);

export function schemaSansMigrationVentes(erreur: { code?: string | null } | null | undefined): boolean {
  return Boolean(erreur?.code && CODES_SCHEMA_ANCIEN.has(erreur.code));
}

/** Levée quand la base n'a pas encore reçu la migration 0040. */
export class MigrationVentesManquante extends Error {
  constructor() {
    super(
      "La base de données n'a pas encore reçu la mise à jour du récapitulatif des ventes " +
        "(migration 0040_comptabilite_des_ventes)."
    );
    this.name = "MigrationVentesManquante";
  }
}
