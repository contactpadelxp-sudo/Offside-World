import "server-only";

/**
 * Vérification des identifiants du back-office.
 *
 * Les identifiants vivent dans l'environnement (`ADMIN_USER`,
 * `ADMIN_PASSWORD`), pas en base : il n'y a qu'un compte, et cela évite un
 * problème d'amorçage — créer le premier compte demanderait déjà d'être
 * connecté. Le jour où plusieurs personnes devront avoir leur propre accès,
 * seule cette fonction est à remplacer : tout le reste du back-office passe par
 * `Session.acteur` et ne sait rien de la façon dont l'identité a été établie.
 */

const encodeur = new TextEncoder();

/**
 * Comparaison à temps constant.
 *
 * On compare les empreintes SHA-256 plutôt que les chaînes : la durée ne dépend
 * alors ni du contenu ni de la LONGUEUR du secret, que comparer les chaînes
 * brutes divulguerait.
 */
async function memeSecret(a: string, b: string): Promise<boolean> {
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

/**
 * Retourne le nom de l'acteur si les identifiants sont bons, `null` sinon.
 * Les deux comparaisons sont toujours évaluées, sans court-circuit : un mauvais
 * nom d'utilisateur ne se distingue pas d'un mauvais mot de passe, ni par la
 * réponse ni par le temps de réponse.
 */
export async function verifierIdentifiants(
  utilisateur: string,
  motDePasse: string
): Promise<string | null> {
  const attenduUser = process.env.ADMIN_USER;
  const attenduPassword = process.env.ADMIN_PASSWORD;
  if (!attenduUser || !attenduPassword) return null;

  const controles = await Promise.all([
    memeSecret(utilisateur, attenduUser),
    memeSecret(motDePasse, attenduPassword),
  ]);

  return controles.every(Boolean) ? attenduUser : null;
}
