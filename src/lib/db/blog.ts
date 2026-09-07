import "server-only";
import { base, baseConfiguree } from "@/lib/supabase/server";
import { nettoyerCorps, enTexte } from "@/lib/blog/nettoyage";

/**
 * Articles du blog.
 *
 * Deux publics, deux fonctions : le site public ne voit que les articles
 * publiés, le back-office voit tout. La distinction est faite ICI et non dans
 * les pages — un oubli de filtre dans un composant publierait un brouillon.
 *
 * Le corps est renettoyé à chaque lecture publique. Voir `blog/nettoyage.ts`
 * pour la raison : l'affichage ne fait pas confiance à la base.
 */

export interface ArticleListe {
  id: string;
  slug: string;
  titre: string;
  chapo: string;
  image: string | null;
  publie: boolean;
  publieLe: string | null;
  modifieLe: string;
}

export interface ArticleComplet extends ArticleListe {
  corps: string;
}

interface LigneArticle {
  id: string;
  slug: string;
  titre: string;
  chapo: string | null;
  corps: string;
  image: string | null;
  publie: boolean;
  publie_le: string | null;
  modifie_le: string;
}

const CHAMPS = "id, slug, titre, chapo, corps, image, publie, publie_le, modifie_le";

/** Le chapô saisi, ou à défaut le début du corps — jamais rien. */
function chapoDe(l: LigneArticle): string {
  const saisi = l.chapo?.trim();
  return saisi || enTexte(l.corps, 180);
}

function versListe(l: LigneArticle): ArticleListe {
  return {
    id: l.id,
    slug: l.slug,
    titre: l.titre,
    chapo: chapoDe(l),
    image: l.image,
    publie: l.publie,
    publieLe: l.publie_le,
    modifieLe: l.modifie_le,
  };
}

// ---------------------------------------------------------------------------
// Site public
// ---------------------------------------------------------------------------

/** Les articles publiés, du plus récent au plus ancien. */
export async function lireArticlesPublies(limite = 50): Promise<ArticleListe[]> {
  if (!baseConfiguree()) return [];
  const { data, error } = await base()
    .from("articles")
    .select(CHAMPS)
    .eq("publie", true)
    .order("publie_le", { ascending: false })
    .limit(limite);
  if (error || !data) return [];
  return (data as LigneArticle[]).map(versListe);
}

/** Un article publié, par son adresse. `null` si absent ou en brouillon. */
export async function lireArticlePublie(slug: string): Promise<ArticleComplet | null> {
  if (!baseConfiguree()) return null;
  const { data, error } = await base()
    .from("articles")
    .select(CHAMPS)
    .eq("slug", slug)
    .eq("publie", true)
    .maybeSingle();
  if (error || !data) return null;
  const l = data as LigneArticle;
  return { ...versListe(l), corps: nettoyerCorps(l.corps) };
}

// ---------------------------------------------------------------------------
// Back-office
// ---------------------------------------------------------------------------

/** Tous les articles, brouillons compris. Brouillons d'abord : ce sont eux
 *  qui attendent une action. */
export async function lireTousLesArticles(): Promise<ArticleListe[]> {
  if (!baseConfiguree()) return [];
  const { data, error } = await base()
    .from("articles")
    .select(CHAMPS)
    .order("publie", { ascending: true })
    .order("modifie_le", { ascending: false });
  if (error || !data) return [];
  return (data as LigneArticle[]).map(versListe);
}

/** Un article par son identifiant, publié ou non. */
export async function lireArticle(id: string): Promise<ArticleComplet | null> {
  if (!baseConfiguree()) return null;
  const { data, error } = await base()
    .from("articles")
    .select(CHAMPS)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const l = data as LigneArticle;
  // Le corps n'est PAS nettoyé ici : l'éditeur doit récupérer exactement ce
  // qui est stocké, sans quoi une simple ouverture-fermeture modifierait
  // l'article. Le nettoyage a lieu à l'enregistrement et à l'affichage public.
  return { ...versListe(l), corps: l.corps };
}

/** Le slug est-il déjà pris par un AUTRE article ? */
export async function slugPris(slug: string, saufId?: string): Promise<boolean> {
  if (!baseConfiguree()) return false;
  let q = base().from("articles").select("id").eq("slug", slug);
  if (saufId) q = q.neq("id", saufId);
  const { data } = await q.limit(1);
  return Boolean(data && data.length > 0);
}

/**
 * Rend un slug unique en lui ajoutant un suffixe numérique.
 * Deux articles peuvent légitimement porter le même titre — « Tournoi de
 * Noël » revient chaque année — et l'un ne doit pas empêcher l'autre.
 */
export async function slugLibre(souhaite: string, saufId?: string): Promise<string> {
  if (!(await slugPris(souhaite, saufId))) return souhaite;
  for (let n = 2; n < 100; n++) {
    const essai = `${souhaite.slice(0, 115)}-${n}`;
    if (!(await slugPris(essai, saufId))) return essai;
  }
  return `${souhaite.slice(0, 110)}-${Date.now().toString(36)}`;
}
