"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { base } from "@/lib/supabase/server";
import { journaliser, sessionCourante, type Session } from "@/lib/admin/session";
import { SaisieInvalide, texte, texteFacultatif, uuid } from "@/lib/saisie";
import { nettoyerCorps, versSlug } from "@/lib/blog/nettoyage";
import { slugLibre } from "@/lib/db/blog";

/**
 * Écriture des articles du blog.
 *
 * Mêmes règles que les autres actions du back-office : la session est
 * revérifiée à chaque appel — une Server Action reste une URL publique,
 * appelable sans passer par la page — et chaque modification laisse une trace
 * dans le journal.
 *
 * Une règle en plus, propre au blog : LE CORPS EST NETTOYÉ ICI, avant
 * d'atteindre la base. L'éditeur tourne dans le navigateur ; ce qu'il envoie
 * est une intention, pas une garantie.
 */

export interface Resultat {
  ok: boolean;
  message?: string;
}

const REFUS_SESSION: Resultat = {
  ok: false,
  message: "Session expirée. Reconnectez-vous.",
};

async function garde(): Promise<Session | null> {
  return sessionCourante();
}

function echec(e: unknown): Resultat {
  if (e instanceof SaisieInvalide) return { ok: false, message: e.message };
  console.error("Blog :", e);
  return { ok: false, message: "L'opération a échoué. Réessayez." };
}

function rafraichir(slug?: string): void {
  revalidatePath("/admin", "layout");
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
}

export interface SaisieArticle {
  titre: string;
  slug: string;
  chapo: string;
  corps: string;
  image: string;
  publie: boolean;
  publieLe: string;
}

/**
 * Crée un article vide et ouvre son éditeur.
 *
 * Vide et non « à remplir dans une boîte de dialogue » : demander un titre
 * avant d'avoir écrit quoi que ce soit est le meilleur moyen de ne jamais
 * commencer. Le titre se corrige ensuite, l'adresse suit.
 */
export async function creerArticle(): Promise<Resultat> {
  const session = await garde();
  if (!session) return REFUS_SESSION;

  let id: string;
  try {
    const slug = await slugLibre("nouvel-article");
    const { data, error } = await base()
      .from("articles")
      .insert({ titre: "Nouvel article", slug, corps: "", publie: false })
      .select("id")
      .single();
    if (error) throw error;
    id = data.id;
    await journaliser(session, "article.cree", slug);
    rafraichir();
  } catch (e) {
    return echec(e);
  }

  // `redirect` lève une exception que Next intercepte : elle doit être hors
  // du `try`, sinon le `catch` la prendrait pour une erreur.
  redirect(`/admin/blog/${id}`);
}

export async function enregistrerArticle(
  id: string,
  saisie: SaisieArticle
): Promise<Resultat> {
  const session = await garde();
  if (!session) return REFUS_SESSION;

  try {
    const cible = uuid(id, "Article");
    const titre = texte(saisie.titre, "Titre", { min: 3, max: 160 });

    // Une adresse vide se déduit du titre ; une adresse saisie est normalisée
    // pour respecter la contrainte de la base plutôt que de lui être refusée.
    const souhaite = versSlug(saisie.slug?.trim() || titre);
    if (souhaite.length < 3) {
      return {
        ok: false,
        message:
          "L'adresse de l'article ne peut pas être déduite de ce titre. Saisissez-la à la main.",
      };
    }
    const slug = await slugLibre(souhaite, cible);

    const publie = Boolean(saisie.publie);
    const corps = nettoyerCorps(saisie.corps ?? "");

    if (publie && !corps.trim()) {
      return { ok: false, message: "Un article vide ne peut pas être publié." };
    }

    // Publier sans date choisie date l'article de maintenant : la contrainte
    // `publie_date` l'exige, et la liste publique est triée là-dessus.
    const dateSaisie = saisie.publieLe?.trim();
    const publieLe = publie ? (dateSaisie ? new Date(dateSaisie).toISOString() : new Date().toISOString()) : dateSaisie ? new Date(dateSaisie).toISOString() : null;

    if (publieLe && Number.isNaN(Date.parse(publieLe))) {
      return { ok: false, message: "La date de publication n'est pas valable." };
    }

    const { error } = await base()
      .from("articles")
      .update({
        titre,
        slug,
        chapo: texteFacultatif(saisie.chapo, "Chapô", { max: 400 }),
        corps,
        image: texteFacultatif(saisie.image, "Image", { max: 400 }),
        publie,
        publie_le: publieLe,
      })
      .eq("id", cible);
    if (error) throw error;

    await journaliser(session, publie ? "article.publie" : "article.enregistre", slug);
    rafraichir(slug);

    return {
      ok: true,
      message: publie ? `Publié : ${slug}` : "Brouillon enregistré.",
    };
  } catch (e) {
    return echec(e);
  }
}

export async function supprimerArticle(id: string): Promise<Resultat> {
  const session = await garde();
  if (!session) return REFUS_SESSION;

  try {
    const cible = uuid(id, "Article");
    const { data, error } = await base()
      .from("articles")
      .delete()
      .eq("id", cible)
      .select("slug")
      .maybeSingle();
    if (error) throw error;
    if (!data) return { ok: false, message: "Cet article n'existe plus." };

    await journaliser(session, "article.supprime", data.slug);
    rafraichir(data.slug);
    return { ok: true, message: "Article supprimé." };
  } catch (e) {
    return echec(e);
  }
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

/** Ce que le seau de stockage accepte. Répété ici : on ne compte pas sur lui. */
const TYPES_IMAGE = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);
const TAILLE_MAX = 5 * 1024 * 1024;

export interface ResultatImage {
  ok: boolean;
  url?: string;
  message?: string;
}

/**
 * Reçoit une image depuis l'éditeur et renvoie son adresse publique.
 *
 * SANS CETTE FONCTION, LE BLOG NE TIENT PAS SA PROMESSE. Brahim devrait sinon
 * saisir le chemin d'un fichier déjà présent dans le dépôt — donc demander à
 * un développeur, et attendre un redéploiement, pour chaque photo. Un article
 * de complexe sportif sans photo n'a pas d'intérêt.
 *
 * Le nom du fichier envoyé n'est JAMAIS réutilisé : on le remplace par un
 * identifiant tiré au hasard. Un nom d'origine peut contenir des séparateurs
 * de chemin, des caractères qui changent de sens selon le système, ou tout
 * simplement le nom d'un client.
 */
export async function televerserImage(donnees: FormData): Promise<ResultatImage> {
  const session = await garde();
  if (!session) return { ok: false, message: REFUS_SESSION.message };

  try {
    const fichier = donnees.get("fichier");
    if (!(fichier instanceof File) || fichier.size === 0) {
      return { ok: false, message: "Aucun fichier reçu." };
    }
    if (!TYPES_IMAGE.has(fichier.type)) {
      return {
        ok: false,
        message: "Format non accepté. Utilisez une image JPEG, PNG, WebP, AVIF ou GIF.",
      };
    }
    if (fichier.size > TAILLE_MAX) {
      return { ok: false, message: "Image trop lourde : 5 Mo maximum." };
    }

    const extension = (fichier.type.split("/")[1] ?? "jpg").replace("jpeg", "jpg");
    const chemin = `${new Date().getFullYear()}/${crypto.randomUUID()}.${extension}`;

    const { error } = await base()
      .storage.from("blog")
      .upload(chemin, fichier, { contentType: fichier.type, upsert: false });
    if (error) throw error;

    const { data } = base().storage.from("blog").getPublicUrl(chemin);
    await journaliser(session, "article.image", chemin);

    return { ok: true, url: data.publicUrl };
  } catch (e) {
    console.error("Blog — téléversement :", e);
    return { ok: false, message: "L'envoi de l'image a échoué. Réessayez." };
  }
}
