import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Accès à la base, côté serveur uniquement.
 *
 * RLS est activé et forcé sur toutes les tables SANS aucune politique : les
 * clés publiques ne peuvent donc rien lire ni écrire. Tout passe par ce
 * module, qui utilise la clé de service — la seule qui contourne RLS.
 *
 * Conséquence directe : cette clé donne un accès administrateur complet à la
 * base. Elle ne doit jamais quitter le serveur.
 *   - `import "server-only"` fait échouer la compilation si un composant client
 *     importe ce fichier, même indirectement.
 *   - Le préfixe NEXT_PUBLIC_ est refusé explicitement plus bas : Next inline
 *     toute variable ainsi préfixée dans le bundle envoyé au navigateur, ce qui
 *     publierait la clé.
 *
 * Variables attendues (Vercel → Settings → Environment Variables) :
 *   SUPABASE_URL                 type « Config »
 *   SUPABASE_SERVICE_ROLE_KEY    type « Sensitive »
 */

export type BaseClient = SupabaseClient<Database>;

let instance: BaseClient | null = null;

function url(): string | undefined {
  // NEXT_PUBLIC_SUPABASE_URL n'est pas un secret (elle figure déjà dans les
  // en-têtes des requêtes) : on l'accepte en repli si l'intégration Vercel a
  // nommé la variable ainsi.
  return process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function cle(): string | undefined {
  if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY est définie. Next publie toute " +
        "variable NEXT_PUBLIC_ dans le bundle navigateur : cette clé donnerait " +
        "à n'importe qui un accès administrateur à la base. Supprimez-la et " +
        "utilisez SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

/** La base est-elle joignable ? Permet aux pages de se replier proprement. */
export function baseConfiguree(): boolean {
  return Boolean(url() && cle());
}

/** Client d'administration. Lève si l'environnement n'est pas configuré. */
export function base(): BaseClient {
  if (instance) return instance;

  const u = url();
  const k = cle();
  if (!u || !k) {
    throw new Error(
      "Base non configurée : renseignez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  instance = createClient<Database>(u, k, {
    // Aucune session : ce client n'authentifie pas d'utilisateur, il agit au
    // nom du serveur. Persister ou rafraîchir un jeton n'aurait aucun sens et
    // écrirait dans un stockage partagé entre requêtes.
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { "X-Client-Info": "offside-foot-indoor" } },
  });
  return instance;
}
