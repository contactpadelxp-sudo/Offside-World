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

/**
 * Ouvre une ligne de paiement au moment où la session Stripe est créée.
 *
 * ELLE LÈVE SI L'ÉCRITURE ÉCHOUE, ET CE N'EST PAS UN DÉTAIL.
 *
 * Le résultat de l'insertion n'était ni lu ni testé. Une écriture refusée
 * passait donc inaperçue, et l'appelant remettait quand même au client
 * l'adresse de paiement Stripe. La suite était silencieuse de bout en bout :
 * le client payait, le webhook ne retrouvait aucune ligne à confirmer,
 * répondait 200, n'envoyait aucun e-mail — et la réservation, restée « en
 * attente », expirait quarante-cinq minutes plus tard.
 *
 * Argent encaissé, créneau rendu à la vente, personne prévenue. C'est le pire
 * enchaînement possible, et il ne laissait aucune trace.
 */
export async function ouvrirPaiement(
  reservationId: string,
  montantCents: number,
  sessionId: string
): Promise<void> {
  if (!baseConfiguree()) throw new Error("Base non configurée : ligne de paiement impossible.");
  const { error } = await base().from("paiements").insert({
    reservation_id: reservationId,
    stripe_payment_intent: sessionId,
    montant_cents: montantCents,
    statut: "en_cours",
  });
  if (error) throw error;
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
  methode: string | null,
  /**
   * De quoi RECONSTRUIRE la ligne si elle manque. Vient des métadonnées de la
   * session Stripe, donc de ce que le serveur y a écrit — jamais d'une donnée
   * que le client pourrait influencer.
   */
  secours?: { reservationId: string; montantCents: number }
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

  /*
    AUCUNE LIGNE MISE À JOUR : DEUX CAS QU'IL FAUT SÉPARER.

    Ils se confondaient, et le second était traité comme le premier.

    a) LE WEBHOOK A DÉJÀ ÉTÉ TRAITÉ. Stripe relivre jusqu'à recevoir un accusé,
       c'est normal, il n'y a rien à faire. On le reconnaît à l'existence d'une
       ligne « réussie » pour cette réservation.

    b) IL N'Y A AUCUNE LIGNE DU TOUT. L'écriture d'ouverture a échoué alors que
       le client a payé. Ne rien faire revient à garder l'argent sans confirmer
       la réservation, qui expirera ensuite toute seule.

    Dans le cas (b) on RECONSTRUIT la ligne à partir des métadonnées de la
    session, puis on confirme. Le paiement a eu lieu : la réservation doit
    exister, et l'écart doit se voir dans le journal plutôt que se taire.
  */
  const reservationId = paiement?.reservation_id ?? secours?.reservationId;

  // Sans ligne NI métadonnées, il n'y a rien à rattacher : on ne peut ni
  // confirmer ni reconstruire, et inventer un identifiant serait pire.
  if (!reservationId) return { nouveau: false, reference: null, reservationId: null };

  if (!paiement) {
    if (!secours) return { nouveau: false, reference: null, reservationId: null };

    const { data: dejaReussi } = await base()
      .from("paiements")
      .select("id")
      .eq("reservation_id", secours.reservationId)
      .in("statut", ["reussi", "rembourse", "partiellement_rembourse"])
      .limit(1)
      .maybeSingle();

    // (a) — rien à faire, et surtout pas de second e-mail au client.
    if (dejaReussi) return { nouveau: false, reference: null, reservationId: null };

    // (b) — l'argent est arrivé sans trace : on la crée.
    console.error(
      `Paiement sans ligne d'ouverture pour la réservation ${secours.reservationId} : ligne reconstruite depuis le webhook.`
    );
    const { error: eSecours } = await base().from("paiements").insert({
      reservation_id: secours.reservationId,
      stripe_payment_intent: paymentIntent ?? sessionId,
      montant_cents: secours.montantCents,
      methode,
      statut: "reussi",
    });
    if (eSecours) throw eSecours;
  }

  const { data: reservation, error: e2 } = await base()
    .from("reservations")
    .update({ statut: "confirmee" })
    .eq("id", reservationId)
    .eq("statut", "en_attente")
    .select("reference")
    .maybeSingle();

  if (e2) throw e2;

  return {
    nouveau: true,
    reference: reservation?.reference ?? null,
    reservationId,
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
  // Le résultat était ignoré. Un échec d'écriture laissait la ligne en
  // « en cours » indéfiniment : moins grave qu'un paiement perdu, mais c'est
  // la même cécité. On trace sans lever — le webhook doit répondre 200, sans
  // quoi Stripe reboucle sur un événement qu'on ne saura pas mieux traiter.
  const { error } = await base()
    .from("paiements")
    .update({
      statut: "echoue",
      erreur: raison?.slice(0, 500) ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_payment_intent", sessionId)
    .eq("statut", "en_cours");
  if (error) console.error("Échec de paiement non enregistré :", error.message);
}

/**
 * Rapatrie un remboursement fait AILLEURS qu'ici — typiquement à la main dans
 * le tableau de bord Stripe.
 *
 * POURQUOI C'EST INDISPENSABLE, ET PAS UN CONFORT.
 *
 * Rien n'écoutait les événements de remboursement. `montant_rembourse_cents`
 * n'était donc écrit que par notre propre bouton. Or le code envoie lui-même
 * l'exploitant rembourser dans Stripe quand l'appel échoue — « À effectuer à la
 * main depuis Stripe », dit le message. Ce remboursement-là ne revenait jamais.
 *
 * Deux conséquences, toutes deux fausses au détriment du complexe :
 *   - le solde restant à rendre était surévalué, donc un second remboursement
 *     pouvait repartir sur un montant déjà rendu en partie ;
 *   - le chiffre d'affaires du tableau de bord, calculé en soustrayant les
 *     remboursements, restait trop haut.
 *
 * ON ÉCRIT LE CUMUL DE STRIPE, ON NE L'INCRÉMENTE PAS. `amount_refunded` est le
 * total remboursé sur cette imputation, tel que Stripe le connaît. L'ajouter à
 * ce qu'on a déjà compté doublerait nos propres remboursements, qui déclenchent
 * eux aussi cet événement. Stripe fait autorité, on recopie.
 */
export async function synchroniserRemboursement(
  paymentIntent: string,
  cumulRembourseCents: number
): Promise<void> {
  if (!baseConfiguree()) return;

  const { data: paiement, error } = await base()
    .from("paiements")
    .select("id, montant_cents, montant_rembourse_cents")
    .eq("stripe_payment_intent", paymentIntent)
    .maybeSingle();

  if (error) {
    console.error("Remboursement Stripe non rapatrié :", error.message);
    return;
  }
  if (!paiement) {
    console.error(
      `Remboursement Stripe sur une imputation inconnue (${paymentIntent}) : rien à mettre à jour.`
    );
    return;
  }

  // Rien de neuf : c'est notre propre remboursement qui nous revient, ou une
  // relivraison. On évite une écriture pour rien.
  if (paiement.montant_rembourse_cents === cumulRembourseCents) return;

  const { error: e2 } = await base()
    .from("paiements")
    .update({
      montant_rembourse_cents: cumulRembourseCents,
      statut: cumulRembourseCents >= paiement.montant_cents ? "rembourse" : "partiellement_rembourse",
      updated_at: new Date().toISOString(),
    })
    .eq("id", paiement.id);

  if (e2) console.error("Remboursement Stripe non rapatrié :", e2.message);
}
