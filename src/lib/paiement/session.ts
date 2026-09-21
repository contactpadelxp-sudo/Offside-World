import "server-only";
import { stripe, paiementConfigure } from "./stripe";
import { ouvrirPaiement, VIE_SESSION_STRIPE_MINUTES } from "@/lib/db/paiements";
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
      /*
        LA RÉFÉRENCE DOIT SUIVRE JUSQU'AU PAIEMENT, PAS S'ARRÊTER À LA SESSION.

        Les métadonnées ci-dessus vivent sur la SESSION Checkout, qui a fait son
        travail une fois le client passé. Le tableau de bord Stripe, lui, liste
        des PAIEMENTS : montant, e-mail, et une colonne « Description » qui
        restait vide. Impossible d'y dire à quelle réservation correspond une
        ligne, autrement qu'en croisant un montant et une adresse.

        Ce n'est pas un confort. Le site envoie lui-même l'exploitant rembourser
        à la main dans Stripe quand l'appel automatique échoue, et une
        contestation bancaire se traite là-bas, avec une date limite. Dans les
        deux cas il faut retrouver LA bonne ligne, et deux anniversaires du même
        samedi au même tarif sont indiscernables sans la référence.

        La description la met en clair dans la liste ; les métadonnées la
        rendent cherchable et la portent jusqu'aux événements `charge.*`, qui
        ne voient que le paiement et jamais la session.
      */
      payment_intent_data: {
        description: `${opts.reference} · ${opts.ligne.libelle}`,
        metadata: {
          reservation_id: opts.reservationId,
          reference: opts.reference,
        },
      },
      // La même durée borne le drapeau « paiement en cours » du back-office :
      // voir `VIE_SESSION_STRIPE_MINUTES`.
      expires_at: Math.floor(Date.now() / 1000) + VIE_SESSION_STRIPE_MINUTES * 60,
      success_url: `${URL_SITE}/confirmation?ref=${encodeURIComponent(opts.reference)}&paiement=ok`,
      /*
        L'ANNULATION PASSE PAR UNE ROUTE, PAS DIRECTEMENT PAR LA PAGE.

        Elle renvoyait sur `/reservation?paiement=annule`, un paramètre que
        rien ne lisait : le client retombait sur le tunnel vide et son créneau
        restait tenu jusqu'à l'expiration. La route ferme la session chez
        Stripe, rend le créneau à la vente, puis redirige sur cette même page —
        qui, elle, dit maintenant ce qui s'est passé. Voir
        `api/stripe/annule/route.ts`.

        L'identifiant porté par l'adresse est celui de la RÉSERVATION, pas
        celui de la session : Stripe ne documente la substitution de
        `{CHECKOUT_SESSION_ID}` que pour `success_url` et `return_url`. La
        route relit la session en base, puis la vérifie chez Stripe.
      */
      cancel_url: `${URL_SITE}/api/stripe/annule?r=${encodeURIComponent(opts.reservationId)}`,
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
