import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Les tests couvrent la logique PURE : calcul des montants, barème
 * d'annulation, validation des saisies, nettoyage du HTML, fuseau horaire.
 *
 * Ils ne touchent pas la base. Ce qui dépend de PostgreSQL — la contrainte
 * anti-chevauchement, l'index d'unicité sur les créneaux — est vérifié par la
 * base elle-même, et un test qui les simulerait vérifierait la simulation.
 */
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Voir l'en-tête de ce fichier : `server-only` lève hors du serveur Next.
      "server-only": fileURLToPath(new URL("./src/test/server-only.ts", import.meta.url)),
    },
  },
});
