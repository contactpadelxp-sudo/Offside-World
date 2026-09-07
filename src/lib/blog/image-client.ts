/**
 * Préparation d'une image avant envoi, dans le navigateur.
 *
 * POURQUOI NE PAS ENVOYER LE FICHIER TEL QUEL. Une photo prise au téléphone
 * pèse 4 à 8 Mo pour 4000 px de large. Envoyée telle quelle, elle serait
 * refusée par la limite de 5 Mo une fois sur deux, prendrait une minute à
 * téléverser sur un réseau mobile, et surtout : chaque visiteur de l'article
 * la téléchargerait entière pour l'afficher dans une colonne de 700 px.
 *
 * On la redimensionne donc ici. Le gain est triple — l'envoi passe, il est
 * rapide, et la page publique reste légère — pour une perte de qualité
 * invisible à l'écran.
 *
 * Tout se fait dans le navigateur : aucune bibliothèque de traitement d'image
 * côté serveur, donc rien à installer et rien à maintenir.
 */

/** Au-delà, on ne gagne plus rien de visible sur un écran d'article. */
const LARGEUR_MAX = 1600;
const QUALITE = 0.85;

/** Le navigateur sait-il produire du WebP ? Sinon on retombe sur du JPEG. */
function typeDeSortie(): "image/webp" | "image/jpeg" {
  try {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    return c.toDataURL("image/webp").startsWith("data:image/webp")
      ? "image/webp"
      : "image/jpeg";
  } catch {
    return "image/jpeg";
  }
}

/**
 * Redimensionne si nécessaire et renvoie le fichier à envoyer.
 *
 * En cas d'échec — format exotique, navigateur récalcitrant, mémoire — on
 * renvoie le fichier d'origine plutôt que rien : le serveur le refusera
 * peut-être, mais avec un message clair, ce qui vaut mieux qu'un bouton qui
 * ne fait rien.
 */
export async function preparerImage(fichier: File): Promise<File> {
  // Un GIF peut être animé : le passer dans un canvas n'en garderait que la
  // première image. On le laisse tel quel.
  if (fichier.type === "image/gif") return fichier;

  try {
    // `imageOrientation: "from-image"` applique la rotation inscrite dans les
    // métadonnées EXIF. Sans ça, une photo prise à la verticale arriverait
    // couchée — c'est le défaut le plus courant, et le plus visible.
    const bitmap = await createImageBitmap(fichier, { imageOrientation: "from-image" });

    if (bitmap.width <= LARGEUR_MAX && fichier.size <= 1_500_000) {
      bitmap.close();
      return fichier;
    }

    const ratio = Math.min(1, LARGEUR_MAX / bitmap.width);
    const largeur = Math.round(bitmap.width * ratio);
    const hauteur = Math.round(bitmap.height * ratio);

    const toile = document.createElement("canvas");
    toile.width = largeur;
    toile.height = hauteur;
    const ctx = toile.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return fichier;
    }
    ctx.drawImage(bitmap, 0, 0, largeur, hauteur);
    bitmap.close();

    const type = typeDeSortie();
    const blob = await new Promise<Blob | null>((resoudre) =>
      toile.toBlob(resoudre, type, QUALITE)
    );
    if (!blob) return fichier;

    // Si le redimensionnement n'a rien gagné, on garde l'original.
    if (blob.size >= fichier.size) return fichier;

    const nom = fichier.name.replace(/\.[^.]+$/, "") || "image";
    const ext = type === "image/webp" ? "webp" : "jpg";
    return new File([blob], `${nom}.${ext}`, { type });
  } catch {
    return fichier;
  }
}
