import { NextResponse, type NextRequest } from "next/server";

/**
 * Protection du back-office.
 *
 * `/admin` affiche des réservations : noms, téléphones, prénoms et âges
 * d'enfants, allergies. Sans authentification, cette page est publique et
 * indexable. Tant qu'il n'y a pas de véritable système de comptes, on la ferme
 * par une authentification HTTP Basic — sommaire, mais efficace parce qu'elle
 * s'applique AVANT le rendu de la page, y compris sur une version mise en cache
 * par le CDN.
 *
 * FERMÉ PAR DÉFAUT : si les identifiants ne sont pas configurés, la page répond
 * 404. Une variable d'environnement oubliée ne peut donc pas rouvrir l'accès.
 * On répond 404 et non 403 pour ne pas confirmer l'existence du back-office.
 *
 * Identifiants attendus dans l'environnement (Vercel → Settings → Environment
 * Variables, type « Sensitive » pour le mot de passe) :
 *   ADMIN_USER      nom d'utilisateur
 *   ADMIN_PASSWORD  mot de passe
 *
 * Limite assumée : HTTP Basic transmet les identifiants à chaque requête. C'est
 * acceptable ici parce que tout passe en HTTPS (HSTS est actif) et que la page
 * est en lecture seule. À remplacer par de vrais comptes le jour où le
 * back-office permettra de modifier des réservations.
 */

const REALM = 'Basic realm="Offside back-office", charset="UTF-8"';

/** En-têtes communs : jamais de mise en cache, jamais d'indexation. */
const PRIVE = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

/**
 * Comparaison à temps constant.
 *
 * On compare les empreintes SHA-256 plutôt que les chaînes : la durée ne dépend
 * alors ni du contenu ni de la LONGUEUR du secret, que comparer les chaînes
 * brutes divulguerait. `crypto.subtle` est disponible dans les deux runtimes.
 */
async function memeSecret(a: string, b: string): Promise<boolean> {
  const encodeur = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", encodeur.encode(a)),
    crypto.subtle.digest("SHA-256", encodeur.encode(b)),
  ]);
  const va = new Uint8Array(ha);
  const vb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

/** Décode « Basic <base64> » en couple identifiant / mot de passe. */
function lireBasic(entete: string | null): { user: string; password: string } | null {
  if (!entete?.startsWith("Basic ")) return null;
  let decode: string;
  try {
    decode = atob(entete.slice(6).trim());
  } catch {
    return null;
  }
  // Le mot de passe peut contenir « : », pas l'identifiant : on coupe au premier.
  const sep = decode.indexOf(":");
  if (sep < 0) return null;
  return { user: decode.slice(0, sep), password: decode.slice(sep + 1) };
}

export async function proxy(request: NextRequest) {
  const attenduUser = process.env.ADMIN_USER;
  const attenduPassword = process.env.ADMIN_PASSWORD;

  // Identifiants absents : le back-office n'existe pas.
  if (!attenduUser || !attenduPassword) {
    return new NextResponse(null, { status: 404, headers: PRIVE });
  }

  const fourni = lireBasic(request.headers.get("authorization"));
  const ok =
    fourni !== null &&
    // Les deux comparaisons sont toujours évaluées : pas de court-circuit,
    // donc pas de différence de temps entre « bon nom, mauvais mot de passe »
    // et « mauvais nom ».
    (await Promise.all([
      memeSecret(fourni.user, attenduUser),
      memeSecret(fourni.password, attenduPassword),
    ])).every(Boolean);

  if (!ok) {
    return new NextResponse("Authentification requise.", {
      status: 401,
      headers: { ...PRIVE, "WWW-Authenticate": REALM, "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const reponse = NextResponse.next();
  for (const [cle, valeur] of Object.entries(PRIVE)) reponse.headers.set(cle, valeur);
  return reponse;
}

export const config = {
  // `/admin` et tout ce qui pourrait s'y ajouter. Le reste du site n'est pas
  // traversé : le proxy ne coûte rien sur les pages publiques.
  matcher: ["/admin", "/admin/:path*"],
};
