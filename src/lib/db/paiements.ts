import "server-only";
import { base, baseConfiguree } from "@/lib/supabase/server";

/**
 * Suivi des paiements.
 *
 * UNE LIGNE PAR TENTATIVE, jamais écrasée. Un client qui échoue en Bancontact
 * puis réussit en carte laisse deux lignes, et c'est voulu : le jour où il
 * conteste, savoir qu'il a essayé deux fois vaut mieux qu'un statut final sans
 * histoire.
 *
 * LA CONFIRMATION EST IDEMPOTENTE. Stripe réessaie ses webhooks jusqu'à ce
 * qu'il reçoive un accusé, et peut donc livrer deux fois le même événement.
 * Confirmer une réservation déjà confirmée ne doit rien casser ni envoyer un
 * second e-mail au client.
 */

export type StatutPaiement =
  | "cree"
  | "en_cours"
  | "reussi"
  | "echoue"
  | "rembourse"
  | "partiellement_rembourse";

/** Ouvre une ligne de paiement au moment où la session Stripe est créée. */
export async function ouvrirPaiement(
  reservationId: string,
  montantCents: number,
  sessionId: string
): Promise<void> {
  if (!baseConfiguree()) return;
  await base().from("paiements").insert({
    reservation_id: reservationId,
    stripe_payment_intent: sessionId,
    montant_cents: montantCents,
    statut: "en_cours",
  });
}

export interface ResultatConfirmation {
  /** `false` si l'événement avait déjà été traité — ce n'est pas une erreur. */
  nouveau: boolean;
  reference: string | null;
  reservationId: string | null;
}

/**
 * Marque un paiement réussi et confirme la réservation qu'il couvre.
 *
 * Les deux écritures sont conditionnées à l'état de départ (`eq` sur le
 * statut) : deux livraisons du même webhook, ou deux instances traitant
 * l'événement en même temps, ne peuvent pas confirmer deux fois. La seconde
 * ne trouve simplement plus rien à mettre à jour, et repart avec
 * `nouveau: false`.
 */
export async function confirmerPaiement(
  sessionId: string,
  paymentIntent: string | null,
  methode: string | null
): Promise<ResultatConfirmation> {
  if (!baseConfiguree()) return { nouveau: false, reference: null, reservationId: null };

  const { data: paiement, error } = await base()
    .from("paiements")
    .update({
      statut: "reussi",
      methode,
      // On garde l'identifiant de l'intention de paiement s'il est fourni :
      // c'est lui qui sert à rembourser, pas l'identifiant de session.
      ...(paymentIntent ? { stripe_payment_intent: paymentIntent } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_payment_intent", sessionId)
    .eq("statut", "en_cours")
    .select("reservation_id")
    .maybeSingle();

  if (error) throw error;
  // Déjà traité : le webhook a été livré deux fois, ce qui est normal.
  if (!paiement) return { nouveau: false, reference: null, reservationId: null };

  const { data: reservation, error: e2 } = await base()
    .from("reservations")
    .update({ statut: "confirmee" })
    .eq("id", paiement.reservation_id)
    .eq("statut", "en_attente")
    .select("reference")
    .maybeSingle();

  if (e2) throw e2;

  return {
    nouveau: true,
    reference: reservation?.reference ?? null,
    reservationId: paiement.reservation_id,
  };
}

/**
 * Marque un paiement échoué ou abandonné.
 *
 * La réservation N'EST PAS annulée ici : elle reste « en attente » et sera
 * libérée par l'expiration si le client ne revient pas. Un échec de carte
 * suivi d'un second essai réussi est un cas courant, et annuler au premier
 * refus ferait perdre le créneau à quelqu'un qui allait payer.
 */
export async function echouerPaiement(sessionId: string, raison: string | null): Promise<void> {
  if (!baseConfiguree()) return;
  await base()
    .from("paiements")
    .update({
      statut: "echoue",
      erreur: raison?.slice(0, 500) ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_payment_intent", sessionId)
    .eq("statut", "en_cours");
}
