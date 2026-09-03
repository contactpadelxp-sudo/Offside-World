import fs from "node:fs";
import path from "node:path";

/**
 * Résout le logo au build (côté serveur) : on accepte plusieurs extensions
 * pour ne pas dépendre du format d'export choisi. Retourne `null` si aucun
 * fichier n'est présent — l'en-tête retombe alors sur le lettrage texte.
 *
 * Attendu : `public/images/logo.{png,webp,svg,jpg,jpeg,avif}`
 */
const EXTENSIONS = ["png", "webp", "svg", "jpg", "jpeg", "avif"] as const;

export function resolveLogoSrc(): string | null {
  for (const ext of EXTENSIONS) {
    const rel = `/images/logo.${ext}`;
    if (fs.existsSync(path.join(process.cwd(), "public", rel))) return rel;
  }
  return null;
}
