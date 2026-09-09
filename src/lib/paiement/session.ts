import "server-only";
import { stripe, paiementConfigure } from "./stripe";
import { ouvrirPaiement } from "@/lib/db/paiements";
import { URL_SITE } from "@/lib/site";

/**
 * Création de la session de paiement.
 *
 * DURÉE DE VIE : 30 MINUTES. C'est le minimum accepté par Stripe, et c'est
 * volontairement court. Tant que la session est ouverte, le créneau est tenu
 * par une réservation « en attente » : le laisser bloqué des heures pour
 * quelqu'un qui a fermé l'onglet ferait perdre de vraies réservations un
 * samedi après-midi. Le délai d'expiration des réservations est aligné dessus.
 *
 * BANCONTACT EN PREMIER. C'est le moyen de paiement dominant en Belgique, très
 * loin devant la carte pour ce type d'achat. L'ordre de la liste est celui
 * dans lequel Stripe les propose.
 */

/** Ce que le client verra sur sa page de paiement et sur son relevé. */
export interface LignePaiement {
  libelle: string;
  description: string;
  montantCents: number;
}

export interface SessionCreee {
  url: string;
  id: string;
}

export async function creerSessionPaiement(opts: {
  reservationId: string;
  reference: string;
  clientEmail: string;
  ligne: LignePaiement;
}): Promise<SessionCreee | null> {
  if (!paiementConfigure()) return null;

  const session = await stripe().checkout.sessions.create(
    {
      mode: "payment",
      // Bancontact d'abord : c'est ce que paient les Belges.
      payment_method_types: ["bancontact", "card"],
      locale: "fr",
      customer_email: opts.clientEmail,
      client_reference_id: opts.reference,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: opts.ligne.montantCents,
            product_data: {
              name: opts.ligne.libelle,
              description: opts.ligne.description,
            },
          },
        },
      ],
      // Ce que le webhook retrouvera : l'identifiant interne, jamais reconstruit
      // depuis une donnée que le client pourrait influencer.
      metadata: {
        reservation_id: opts.reservationId,
        reference: opts.reference,
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${URL_SITE}/confirmation?ref=${encodeURIComponent(opts.reference)}&paiement=ok`,
      // L'annulation ramène sur la page de réservation : le créneau est encore
      // tenu quelques minutes, le client peut réessayer sans tout ressaisir.
      cancel_url: `${URL_SITE}/reservation?paiement=annule`,
    },
    {
      // Deux clics sur « Payer » ne doivent pas créer deux sessions, donc deux
      // paiements possibles pour une seule réservation.
      idempotencyKey: `reservation-${opts.reservationId}`,
    }
  );

  if (!session.url) return null;

  await ouvrirPaiement(opts.reservationId, opts.ligne.montantCents, session.id);
  return { url: session.url, id: session.id };
}
