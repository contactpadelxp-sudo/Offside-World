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

/**
 * Durée de vie d'une session Stripe, en minutes.
 *
 * SOURCE UNIQUE. `paiement/session.ts` la pose sur `expires_at`, le back-office
 * s'en sert pour savoir si une ligne « en_cours » décrit encore un client
 * devant son écran, et `paiementVivantSur` pour refuser une action pendant ce
 * temps. Les trois doivent bouger ensemble : allonger la session sans allonger
 * la borne rouvrirait « Confirmer » et « Annuler » pendant qu'un paiement
 * court encore.
 *
 * Trente minutes est le minimum accepté par Stripe. Ce module ne dépend pas du
 * SDK Stripe, ce qui permet au back-office de lire la constante sans l'embarquer.
 */
export const VIE_SESSION_STRIPE_MINUTES = 30;

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

/**
 * Un paiement est-il EN TRAIN de se jouer sur cette réservation ?
 *
 * Le back-office cache « Confirmer » et « Annuler » pendant ce temps, mais un
 * onglet ouvert avant l'ouverture de la session, lui, les affiche encore : la
 * page n'est rendue qu'une fois. La garde doit donc exister côté serveur, où
 * elle est la seule à valoir.
 *
 * Ce que chacune des deux actions casserait :
 * — confirmer fait sortir la réservation de « en_attente », et `confirmerPaiement`
 *   conditionne son écriture à ce statut ; le webhook ne trouve plus rien à
 *   confirmer, l'e-mail au client ne part jamais, l'argent est encaissé sans
 *   trace pour lui ;
 * — annuler rend le créneau à la vente à la seconde où quelqu'un le paie.
 *
 * ON NE LÈVE PAS, ON RÉPOND `false`. Une lecture qui échoue ne doit pas bloquer
 * le back-office : le pire cas est celui d'avant cette garde, et il reste rare.
 */
export async function paiementVivantSur(reservationId: string): Promise<boolean> {
  return (await sessionPaiementVivante(reservationId)) !== null;
}

/**
 * L'identifiant de la session Stripe encore ouverte sur cette réservation.
 *
 * `null` si aucune, si la dernière a plus de trente minutes — la page de
 * paiement est alors morte — ou si la lecture échoue. Sert à `paiementVivantSur`
 * et à la route d'abandon, qui a besoin de l'identifiant lui-même pour fermer
 * la session chez Stripe.
 *
 * `stripe_payment_intent` porte l'identifiant de SESSION tant que le paiement
 * n'a pas abouti : c'est ce qu'y écrit `ouvrirPaiement`, et c'est par lui que
 * le webhook retrouve la ligne. Le vrai `pi_…` ne le remplace qu'à la
 * confirmation.
 *
 * La plus récente d'abord : un client qui rouvre le tunnel laisse plusieurs
 * lignes, et seule la dernière décrit ce qui se joue maintenant.
 */
export async function sessionPaiementVivante(reservationId: string): Promise<string | null> {
  if (!baseConfiguree()) return null;
  const depuis = new Date(Date.now() - VIE_SESSION_STRIPE_MINUTES * 60 * 1000).toISOString();
  const { data, error } = await base()
    .from("paiements")
    .select("stripe_payment_intent")
    .eq("reservation_id", reservationId)
    .eq("statut", "en_cours")
    .gte("created_at", depuis)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("Vérification d'un paiement en cours impossible :", error.message);
    return null;
  }
  return data?.stripe_payment_intent ?? null;
}

export interface ResultatConfirmation {
  /** `false` si l'événement avait déjà été traité — ce n'est pas une erreur. */
  nouveau: boolean;
  reference: string | null;
  reservationId: string | null;
  /**
   * Statut réel de la réservation quand la confirmation n'a rien changé.
   *
   * `null` quand elle vient d'être confirmée. Sinon : « confirmee » pour une
   * simple relivraison de Stripe, ce qui est normal — mais « expiree » ou
   * « annulee » signifie qu'on vient d'encaisser sur une réservation qui
   * n'existe plus, et cela demande une alerte.
   */
  statutReservation?: string | null;
  /**
   * Référence lisible de la réservation quand la confirmation n'a rien changé.
   *
   * Distincte de `reference`, qui n'est renseignée qu'en cas de bascule réelle
   * et déclenche l'e-mail au client. Celle-ci ne sert qu'aux avis internes :
   * c'est par la référence que l'exploitant retrouve une réservation.
   */
  referenceConnue?: string | null;
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
  /*
    ON LÈVE, ON NE REND PAS UN SILENCE.

    Cette ligne rendait `{ nouveau: false }`, c'est-à-dire exactement ce que
    rend une relivraison normale de Stripe : « rien de neuf, tout va bien ». Le
    webhook répondait donc 200 sur un paiement encaissé qu'aucune base n'avait
    enregistré, et Stripe ne le renvoyait jamais.

    Sans base, on ne peut ni confirmer, ni constater, ni alerter. La seule
    réponse honnête est l'échec : il fait relivrer Stripe pendant trois jours,
    ce qui laisse le temps de rétablir la connexion et rattrape le paiement.
  */
  if (!baseConfiguree()) {
    throw new Error(
      "Base non configurée : impossible de confirmer un paiement encaissé. " +
        "On échoue pour que Stripe relivre plutôt que de perdre l'événement."
    );
  }

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

    /*
      (a) — LA LIGNE DE PAIEMENT EST DÉJÀ « RÉUSSIE », MAIS ON NE SORT PLUS ICI.

      C'était un `return`, et il rendait le rejeu de Stripe inopérant dans le
      seul cas où il sert vraiment.

      `confirmerPaiement` écrit en DEUX fois, sans transaction : la ligne de
      paiement, puis la réservation. Si la seconde échoue — coupure du pooler,
      délai dépassé —, le webhook répond 500 et Stripe relivre. Mais à la
      relivraison, la première mise à jour ne trouve plus rien (le statut n'est
      plus « en_cours »), on arrivait ici, et le `return` sortait AVANT d'avoir
      retenté la confirmation. Argent encaissé, réservation jamais confirmée,
      aucun e-mail, et plus aucune relivraison ne pouvait le rattraper.

      On ne recrée simplement pas la ligne de paiement — elle existe — et on
      laisse la suite retenter la confirmation. Elle est idempotente : l'update
      est filtré sur `statut = 'en_attente'`, donc une relivraison sur une
      réservation déjà confirmée ne touche rien et ne renvoie pas de référence,
      ce qui empêche le second e-mail.
    */
    if (!dejaReussi) {
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
  }

  const { data: reservation, error: e2 } = await base()
    .from("reservations")
    .update({ statut: "confirmee" })
    .eq("id", reservationId)
    .eq("statut", "en_attente")
    .select("reference")
    .maybeSingle();

  if (e2) throw e2;

  /*
    QUAND LA CONFIRMATION NE PREND PAS, IL FAUT SAVOIR POURQUOI.

    L'update ci-dessus est filtré sur `statut = 'en_attente'`. Sans référence en
    retour, deux situations se cachaient derrière le même silence :

      — la réservation est DÉJÀ « confirmee » : c'est une relivraison de Stripe,
        tout va bien, et il ne faut surtout pas renvoyer d'e-mail ;
      — elle est « expiree » ou « annulee » : l'argent vient d'être encaissé sur
        une réservation qui n'existe plus. Personne n'était prévenu, ni le
        client ni l'exploitant, et la seule trace était une ligne de paiement
        réussie sans réservation confirmée, à remarquer au back-office.

    On relit donc le statut pour que l'appelant puisse alerter sur le second cas
    seulement. Une lecture de plus, sur le chemin où quelque chose a déjà mal
    tourné — jamais sur le chemin nominal.
  */
  let statutReservation: string | null = null;
  let referenceConnue: string | null = null;
  if (!reservation) {
    // La RÉFÉRENCE avec le statut, dans la même lecture : c'est par elle que
    // l'exploitant retrouve une réservation au back-office, jamais par
    // l'identifiant technique. Un avis sans référence ne mène nulle part.
    const { data: etat } = await base()
      .from("reservations")
      .select("statut, reference")
      .eq("id", reservationId)
      .maybeSingle();
    statutReservation = etat?.statut ?? null;
    referenceConnue = etat?.reference ?? null;
  }

  return {
    nouveau: true,
    /*
      `reference` reste ce qu'elle a toujours été : renseignée SEULEMENT quand
      la réservation vient de basculer. C'est elle qui déclenche l'e-mail au
      client, et la remplir dans les autres cas en enverrait un à tort.

      La référence lue ci-dessus voyage à part, pour l'avis interne.
    */
    reference: reservation?.reference ?? null,
    reservationId,
    statutReservation,
    referenceConnue,
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
/**
 * La référence de la réservation qu'un paiement Stripe couvre.
 *
 * POURQUOI ELLE EXISTE. Les événements `charge.*` — remboursement fait à la
 * main, contestation bancaire — ne portent que l'imputation et l'intention de
 * paiement. Jamais la session Checkout, donc jamais ses métadonnées. L'avis de
 * contestation annonçait ainsi un montant, un motif et une date limite sans
 * jamais dire DE QUI il s'agissait — alors qu'y répondre demande précisément
 * de produire le nom du client, la date de l'activité et l'e-mail qu'il a reçu.
 *
 * ON LIT NOTRE PROPRE BASE, PAS STRIPE. La table `paiements` porte déjà le lien
 * entre l'intention et la réservation : un aller-retour réseau de plus, dans le
 * traitement d'un webhook que Stripe réessaie s'il tarde, n'apprendrait rien de
 * plus.
 *
 * `null` plutôt qu'une exception : ne pas retrouver la référence ne doit pas
 * empêcher l'avis de partir. Un avis de contestation sans référence reste mille
 * fois préférable à pas d'avis du tout — il y a une date limite au bout.
 */
export async function referencePourIntention(paymentIntent: string): Promise<string | null> {
  if (!baseConfiguree()) return null;
  const { data, error } = await base()
    .from("paiements")
    .select("reservations(reference)")
    .eq("stripe_payment_intent", paymentIntent)
    .maybeSingle();
  if (error) {
    console.error("Référence introuvable pour l'intention Stripe :", error.message);
    return null;
  }
  const liee = data?.reservations as { reference: string } | null | undefined;
  return liee?.reference ?? null;
}

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
