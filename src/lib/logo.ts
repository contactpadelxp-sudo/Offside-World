import fs from "node:fs";
import path from "node:path";

/**
 * Résout le logo au build (côté serveur).
 *
 * On accepte n'importe quel nom de fichier contenant « logo » dans
 * `public/images/` — majuscules, accents et espaces compris (ex.
 * « Logo Offside Foot Indoor.png ») — pour ne pas imposer de renommage.
 * Priorité : `logo.<ext>` exact, puis le premier nom contenant « logo »
 * par ordre alphabétique (build reproductible).
 *
 * Retourne `null` si aucun fichier ne correspond : l'en-tête retombe alors
 * sur le lettrage texte.
 */
const EXTENSIONS = ["svg", "png", "webp", "avif", "jpg", "jpeg"];
const IMAGES_DIR = ["public", "images"];

export function resolveLogoSrc(): string | null {
  const dir = path.join(process.cwd(), ...IMAGES_DIR);

  let entries: string[];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return null;
  }

  const candidates = entries
    .filter((name) => {
      const ext = path.extname(name).slice(1).toLowerCase();
      if (!EXTENSIONS.includes(ext)) return false;
      return path.basename(name, path.extname(name)).toLowerCase().includes("logo");
    })
    .sort((a, b) => {
      // `logo.<ext>` d'abord, puis ordre alphabétique
      const exact = (n: string) =>
        path.basename(n, path.extname(n)).toLowerCase() === "logo" ? 0 : 1;
      return exact(a) - exact(b) || a.localeCompare(b);
    });

  const found = candidates[0];
  // Les espaces et accents doivent être encodés pour servir d'URL
  return found ? `/images/${encodeURIComponent(found)}` : null;
}
