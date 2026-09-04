import "server-only";
import { base } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

/**
 * Écriture des réservations et des demandes de devis.
 *
 * Le montant écrit ici vient TOUJOURS d'un calcul serveur (voir
 * `src/app/reservation/actions.ts`). Aucune valeur de prix envoyée par le
 * navigateur n'atteint ce module.
 */

type InsertReservation = Database["public"]["Tables"]["reservations"]["Insert"];
type InsertDevis = Database["public"]["Tables"]["demandes_devis"]["Insert"];

/**
 * Alphabet sans I, O, 0 ni 1 : une référence se lit au téléphone et se recopie
 * à la main. 32 symboles, donc `octet % 32` reste uniforme sur 0-255 — pas de
 * biais modulo.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function reference(prefixe: string, longueur = 8): string {
  const octets = new Uint8Array(longueur);
  crypto.getRandomValues(octets);
  let suite = "";
  for (const o of octets) suite += ALPHABET[o % ALPHABET.length];
  return `${prefixe}-${suite}`;
}

/** Codes PostgreSQL renvoyés par PostgREST dans `error.code`. */
const VIOLATION_UNICITE = "23505";
const VIOLATION_EXCLUSION = "23P01";

/** Le créneau vient d'être pris par quelqu'un d'autre. */
export class CreneauDejaPris extends Error {
  constructor() {
    super("Ce créneau vient d'être réservé.");
    this.name = "CreneauDejaPris";
  }
}

/**
 * Libère les créneaux tenus par des réservations jamais confirmées.
 * Sans effet si aucune n'a expiré ; l'échec n'est pas bloquant.
 */
export async function expirerReservationsAbandonnees(): Promise<void> {
  const { error } = await base().rpc("expirer_reservations_en_attente", {});
  if (error) console.error("Expiration des réservations impossible :", error.message);
}

/**
 * Insère une réservation. La référence est retirée au sort ; en cas de collision
 * (extrêmement improbable) on retente, sans jamais confondre cette collision
 * avec un créneau déjà pris — les deux remontent le même code SQL, seul le nom
 * de l'index les distingue.
 */
export async function enregistrerReservation(
  donnees: Omit<InsertReservation, "reference">
): Promise<{ reference: string }> {
  for (let essai = 0; essai < 4; essai++) {
    const ref = reference("OW");
    const { error } = await base()
      .from("reservations")
      .insert({ ...donnees, reference: ref });

    if (!error) return { reference: ref };

    const surCreneau =
      error.code === VIOLATION_EXCLUSION ||
      (error.code === VIOLATION_UNICITE && !error.message.includes("reference"));
    if (surCreneau) throw new CreneauDejaPris();

    if (error.code === VIOLATION_UNICITE) continue; // collision de référence
    throw new Error(`Écriture de la réservation impossible : ${error.message}`);
  }
  throw new Error("Impossible de générer une référence unique.");
}

export async function enregistrerDemandeDevis(
  donnees: Omit<InsertDevis, "reference">
): Promise<{ reference: string }> {
  for (let essai = 0; essai < 4; essai++) {
    const ref = reference("TB");
    const { error } = await base()
      .from("demandes_devis")
      .insert({ ...donnees, reference: ref });

    if (!error) return { reference: ref };
    if (error.code === VIOLATION_UNICITE) continue;
    throw new Error(`Enregistrement de la demande impossible : ${error.message}`);
  }
  throw new Error("Impossible de générer une référence unique.");
}
