import fs from "node:fs";
import path from "node:path";

/**
 * Résolution des photos au build (côté serveur).
 *
 * Chaque « emplacement » du site (une carte, un cadre) porte un nom logique.
 * On cherche le fichier correspondant dans `public/images/` en comparant des
 * noms normalisés : majuscules, accents, espaces, tirets et underscores sont
 * ignorés. « Bubble Portrait.JPG », « bubble-portrait.jpeg » ou
 * « bubbleportrait.webp » conviennent donc indifféremment.
 *
 * Un emplacement sans fichier correspondant vaut `null` : le composant affiche
 * alors son état « Photo à venir » au lieu d'une image cassée.
 */

const EXTENSIONS = ["avif", "webp", "jpg", "jpeg", "png"];

/** Emplacements du site et noms de fichiers acceptés pour chacun. */
const SLOTS = {
  "terrain-vide": ["terrainsvide", "terrainvide"],
  "terrain-vide-2": ["terrainvide2"],
  "bubble-portrait": ["bubbleportrait"],
  "ballon-terrain": ["ballonterrain"],
  "entree-double-ballon": ["entreedoubleballon"],
  "joueur-ballon": ["joueurballontete", "joueurballon"],
  "anniversaire-carte": ["anniversairecarte", "anniv"],
} as const;

export type PhotoSlot = keyof typeof SLOTS;
export type PhotoMap = Record<PhotoSlot, string | null>;

/** minuscules, sans accents ni séparateurs */
function normalise(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function resolvePhotos(): PhotoMap {
  const dir = path.join(process.cwd(), "public", "images");

  let entries: string[];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    entries = [];
  }

  // nom normalisé (sans extension) -> nom de fichier réel
  const index = new Map<string, string>();
  for (const name of entries) {
    const ext = path.extname(name).slice(1).toLowerCase();
    if (!EXTENSIONS.includes(ext)) continue;
    const key = normalise(path.basename(name, path.extname(name)));
    // À égalité, on garde le premier par ordre alphabétique (build reproductible).
    const existing = index.get(key);
    if (!existing || name.localeCompare(existing) < 0) index.set(key, name);
  }

  const out = {} as PhotoMap;
  for (const [slot, candidates] of Object.entries(SLOTS) as [PhotoSlot, readonly string[]][]) {
    const found = candidates.map((c) => index.get(normalise(c))).find(Boolean);
    out[slot] = found ? `/images/${encodeURIComponent(found)}` : null;
  }
  return out;
}
