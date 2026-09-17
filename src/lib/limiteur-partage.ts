import "server-only";
import { base, baseConfiguree } from "@/lib/supabase/server";
import { autoriser } from "@/lib/limiteur";

/**
 * Limitation de débit PARTAGÉE entre toutes les instances.
 *
 * POURQUOI CELLE-CI EXISTE EN PLUS DE `limiteur.ts`.
 *
 * Le compteur en mémoire vit dans l'instance qui traite la requête. Sur Vercel,
 * plusieurs instances coexistent et sont recyclées : cinq tentatives autorisées
 * par instance font cinq × N tentatives réelles, et personne ne sait combien
 * vaut N. Le fichier `limiteur.ts` le disait déjà en toutes lettres, en
 * précisant quand y remédier — « en même temps que le paiement, quand un abus
 * coûtera de l'argent ». Le paiement est branché : la condition est remplie.
 *
 * Le compteur vit donc en base, qui est le seul état partagé du projet. Une
 * table et une fonction atomique suffisent — pas de service tiers à provisionner
 * ni à payer.
 *
 * DEUX RIDEAUX PLUTÔT QU'UN. Le compteur mémoire reste en première ligne : il
 * ne coûte rien et arrête les rafales évidentes sans aller-retour en base. Le
 * compteur partagé ne tranche que ce qui l'a franchi.
 *
 * AUCUNE ADRESSE IP N'EST ÉCRITE. La clé est passée au SHA-256 avant d'être
 * stockée : le compteur n'a besoin que de distinguer deux appelants, pas de
 * savoir qui ils sont. Une table de quotas n'est pas un registre de connexions.
 *
 * FERMÉ EN CAS D'ÉCHEC. Si la base ne répond pas, on refuse. C'est sans
 * conséquence pratique : connexion, réservation et devis exigent tous la base
 * pour aboutir de toute façon. Laisser passer en cas de panne transformerait
 * une indisponibilité en fenêtre ouverte.
 */

const encodeur = new TextEncoder();

async function empreinte(cle: string): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", encodeur.encode(`quota-v1:${cle}`));
  return Array.from(new Uint8Array(h), (o) => o.toString(16).padStart(2, "0")).join("");
}

/**
 * @param cle        identifiant de l'appelant, jamais stocké tel quel
 * @param max        appels autorisés dans la fenêtre
 * @param fenetreMs  durée de la fenêtre
 * @returns `true` si l'appel est autorisé
 */
export async function autoriserPartage(
  cle: string,
  max: number,
  fenetreMs: number
): Promise<boolean> {
  // Premier rideau, gratuit. Un plafond plus large que le partagé : il n'est
  // là que pour absorber les rafales, pas pour décider.
  if (!autoriser(cle, max * 4, fenetreMs)) return false;

  if (!baseConfiguree()) return false;

  try {
    const { data, error } = await base().rpc("consommer_quota", {
      p_cle: await empreinte(cle),
      p_max: max,
      p_fenetre: `${Math.round(fenetreMs / 1000)} seconds`,
    });
    if (error) {
      console.error("Quota partagé indisponible :", error.message);
      return false;
    }
    return data === true;
  } catch (e) {
    console.error("Quota partagé indisponible :", e);
    return false;
  }
}
