import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { base, baseConfiguree } from "@/lib/supabase/server";
import { COOKIE_SESSION, DUREE_SESSION_MS, signer, verifier } from "@/lib/admin/jeton";

/**
 * Sessions du back-office.
 *
 * Le proxy fait un contrôle rapide de la signature du cookie ; c'est ici que se
 * fait le vrai contrôle, contre la base. La documentation de Next est explicite
 * sur ce point : le proxy sert à rediriger tôt, pas à autoriser. Toute page et
 * toute Server Action du back-office rappelle donc `exigerSession()`, sans
 * jamais supposer que le proxy est passé par là.
 */

export const CHEMIN_CONNEXION = "/admin/connexion";

export interface Session {
  id: string;
  acteur: string;
}

/** Identité de l'appelant, pour la limitation de débit et le journal. */
export async function adresseAppelant(): Promise<string | null> {
  const entetes = await headers();
  const chaine = entetes.get("x-forwarded-for") ?? "";
  const ip = chaine.split(",")[0]?.trim();
  // La colonne est de type `inet` : une chaîne vide serait rejetée par Postgres.
  return ip || null;
}

async function agentAppelant(): Promise<string | null> {
  const entetes = await headers();
  return (entetes.get("user-agent") ?? "").slice(0, 300) || null;
}

/** Le back-office est-il configurable ? Sans identifiants, il n'existe pas. */
export function backOfficeConfigure(): boolean {
  return Boolean(process.env.ADMIN_USER && process.env.ADMIN_PASSWORD && baseConfiguree());
}

/**
 * Session en cours, ou `null`. Vérifie la signature du cookie PUIS l'état réel
 * de la session en base : expiration et révocation comprises.
 */
export async function sessionCourante(): Promise<Session | null> {
  if (!backOfficeConfigure()) return null;

  const jeton = (await cookies()).get(COOKIE_SESSION)?.value;
  const id = await verifier(jeton);
  if (!id) return null;

  const { data, error } = await base()
    .from("admin_sessions")
    .select("id, acteur, expire_le, revoquee_le")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  if (data.revoquee_le) return null;
  if (new Date(data.expire_le) <= new Date()) return null;

  return { id: data.id, acteur: data.acteur };
}

/** Session en cours, ou redirection vers la page de connexion. */
export async function exigerSession(): Promise<Session> {
  const session = await sessionCourante();
  if (!session) redirect(CHEMIN_CONNEXION);
  return session;
}

/** Crée une session et pose le cookie. À n'appeler qu'après authentification. */
export async function ouvrirSession(acteur: string): Promise<void> {
  const expire = new Date(Date.now() + DUREE_SESSION_MS);

  const { data, error } = await base()
    .from("admin_sessions")
    .insert({
      acteur,
      expire_le: expire.toISOString(),
      ip: await adresseAppelant(),
      agent: await agentAppelant(),
    })
    .select("id")
    .single();

  if (error || !data) throw new Error("Session impossible à ouvrir.");

  const jeton = await signer(data.id);
  if (!jeton) throw new Error("Signature de session impossible.");

  (await cookies()).set(COOKIE_SESSION, jeton, {
    httpOnly: true,          // inaccessible au JavaScript de la page
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",         // pas envoyé sur une requête POST venue d'un autre site
    path: "/admin",          // jamais transmis avec les pages publiques
    expires: expire,
  });
}

/** Révoque la session en base et retire le cookie. */
export async function fermerSession(): Promise<void> {
  const magasin = await cookies();
  const id = await verifier(magasin.get(COOKIE_SESSION)?.value);

  if (id && baseConfiguree()) {
    // Révoquer en base, et pas seulement effacer le cookie : un cookie copié
    // ailleurs continuerait sinon de fonctionner jusqu'à son échéance.
    await base()
      .from("admin_sessions")
      .update({ revoquee_le: new Date().toISOString() })
      .eq("id", id)
      .is("revoquee_le", null);
  }

  magasin.delete({ name: COOKIE_SESSION, path: "/admin" });
}

/**
 * Écrit une action dans le journal. Sans valeur de retour : un journal qui
 * échoue ne doit pas faire échouer l'action, mais il doit laisser une trace
 * dans les logs du serveur.
 */
export async function journaliser(
  session: Session,
  action: string,
  cible: string | null,
  detail?: Record<string, string | number | boolean | null>
): Promise<void> {
  const { error } = await base().from("journal_admin").insert({
    acteur: session.acteur,
    action,
    cible,
    detail: detail ?? null,
    ip: await adresseAppelant(),
  });
  if (error) console.error("Journal back-office :", error.message);
}
