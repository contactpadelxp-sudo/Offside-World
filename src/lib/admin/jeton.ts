/**
 * Signature du cookie de session — partie purement cryptographique.
 *
 * Isolée dans son propre module parce qu'elle est utilisée à deux endroits qui
 * n'ont pas les mêmes moyens :
 *   - `src/proxy.ts`, qui s'exécute avant le rendu et ne doit pas interroger la
 *     base : il se contente de vérifier la signature pour rediriger tout de
 *     suite les visiteurs sans session ;
 *   - le back-office lui-même, qui refait cette vérification PUIS relit la
 *     session en base.
 *
 * La signature seule ne prouve donc rien d'autre que « ce cookie a été émis par
 * ce serveur ». C'est la base qui décide si la session est encore valable —
 * c'est ce qui rend une déconnexion réellement effective.
 */

export const COOKIE_SESSION = "ow_admin";

/** Durée de vie d'une session. Au-delà, il faut se reconnecter. */
export const DUREE_SESSION_MS = 12 * 60 * 60 * 1000;

/**
 * Clé de signature.
 *
 * `ADMIN_SESSION_SECRET` si elle est définie ; sinon dérivée du mot de passe du
 * back-office, pour n'avoir qu'une variable de moins à configurer. Conséquence
 * assumée et souhaitable : changer le mot de passe invalide toutes les sessions
 * en cours.
 */
function materielCle(): string | null {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || null;
}

const encodeur = new TextEncoder();

async function cle(): Promise<CryptoKey | null> {
  const materiel = materielCle();
  if (!materiel) return null;
  return crypto.subtle.importKey(
    "raw",
    encodeur.encode(`offside-admin-session-v1:${materiel}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function base64url(octets: ArrayBuffer): string {
  let binaire = "";
  for (const o of new Uint8Array(octets)) binaire += String.fromCharCode(o);
  return btoa(binaire).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Assemble le jeton de cookie : « identifiant.signature ». */
export async function signer(id: string): Promise<string | null> {
  const k = await cle();
  if (!k) return null;
  const signature = await crypto.subtle.sign("HMAC", k, encodeur.encode(id));
  return `${id}.${base64url(signature)}`;
}

/**
 * Retourne l'identifiant de session si la signature est valide, `null` sinon.
 * La comparaison est à temps constant : elle parcourt toute la chaîne.
 */
export async function verifier(jeton: string | undefined | null): Promise<string | null> {
  if (!jeton) return null;
  const separateur = jeton.lastIndexOf(".");
  if (separateur <= 0) return null;

  const id = jeton.slice(0, separateur);
  const fournie = jeton.slice(separateur + 1);

  const attendu = await signer(id);
  if (!attendu) return null;
  const attendue = attendu.slice(attendu.lastIndexOf(".") + 1);

  if (fournie.length !== attendue.length) return null;
  let diff = 0;
  for (let i = 0; i < attendue.length; i++) diff |= fournie.charCodeAt(i) ^ attendue.charCodeAt(i);
  return diff === 0 ? id : null;
}
