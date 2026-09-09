import type Stripe from "stripe";
import { after } from "next/server";
import { stripe, paiementConfigure, webhookConfigure } from "@/lib/paiement/stripe";
import { confirmerPaiement, echouerPaiement } from "@/lib/db/paiements";
import { lireRecapEmail } from "@/lib/db/backoffice";
import { envoyerTous } from "@/lib/email/envoi";
import {
  auClientReservationConfirmee,
  auComplexeNouvelleReservation,
} from "@/lib/email/modeles";

/**
 * Ce que Stripe nous dit, et qui fait foi.
 *
 * C'EST ICI QUE LA RÉSERVATION EST CONFIRMÉE — pas sur la page de retour. Un
 * client qui paie puis ferme l'onglet, perd le réseau ou tombe en panne de
 * batterie n'atteindra jamais la page de retour. Il a pourtant payé, et sa
 * réservation doit être confirmée. Stripe, lui, réessaie cet appel jusqu'à
 * obtenir une réponse.
 *
 * TROIS RÈGLES, TOUTES INDISPENSABLES.
 *
 * 1. LA SIGNATURE EST VÉRIFIÉE. Cette adresse est publique : sans
 *    vérification, n'importe qui pourrait confirmer une réservation en
 *    envoyant un faux message « paiement réussi ». C'est la seule chose qui
 *    distingue Stripe d'un inconnu.
 *
 * 2. LE CORPS EST LU BRUT. La signature porte sur les octets exacts ; passer
 *    par `req.json()` les reformaterait et la vérification échouerait sans
 *    raison apparente.
 *
 * 3. ON RÉPOND 200 DÈS QUE POSSIBLE. Un traitement lent ou une erreur font
 *    réessayer Stripe, et l'événement revient en boucle. Le travail long —
 *    les e-mails — part donc dans `after()`, après la réponse.
 */

export const runtime = "nodejs";

/** Réponse standard : Stripe ne lit que le code. */
function recu(): Response {
  return new Response(null, { status: 200 });
}

export async function POST(req: Request) {
  if (!paiementConfigure() || !webhookConfigure()) {
    // Rien n'est configuré : on ne peut rien vérifier, donc on ne traite rien.
    // 200 tout de même, pour ne pas faire réessayer indéfiniment un test.
    return recu();
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Signature absente", { status: 400 });

  let evenement: Stripe.Event;
  try {
    const brut = await req.text();
    evenement = stripe().webhooks.constructEvent(
      brut,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch {
    // Signature invalide : ce message ne vient pas de Stripe. On refuse, et on
    // ne dit pas pourquoi.
    return new Response("Signature invalide", { status: 400 });
  }

  try {
    switch (evenement.type) {
      case "checkout.session.completed": {
        const session = evenement.data.object;
        // `payment_status` et non le seul `status` : une session peut être
        // « complete » avec un paiement encore en attente selon le moyen.
        if (session.payment_status !== "paid") break;

        const resultat = await confirmerPaiement(
          session.id,
          typeof session.payment_intent === "string" ? session.payment_intent : null,
          session.payment_method_types?.[0] ?? null
        );

        // `nouveau: false` = webhook déjà traité. Stripe rejoue ses événements,
        // et renvoyer un second e-mail au client serait le seul dégât visible.
        if (resultat.nouveau && resultat.reservationId) {
          after(async () => {
            const recap = await lireRecapEmail(resultat.reservationId as string);
            if (recap?.clientEmail) {
              await envoyerTous([
                auClientReservationConfirmee(recap),
                auComplexeNouvelleReservation(recap),
              ]);
            }
          });
        }
        break;
      }

      case "checkout.session.expired": {
        // Le client n'a pas payé dans les trente minutes. La réservation reste
        // « en attente » et sera libérée par l'expiration : il peut encore
        // revenir la payer si le créneau n'est pas repris.
        await echouerPaiement(evenement.data.object.id, "Session expirée");
        break;
      }

      case "checkout.session.async_payment_failed": {
        await echouerPaiement(evenement.data.object.id, "Paiement refusé");
        break;
      }

      default:
        // Stripe envoie plus d'événements qu'on n'en écoute. Les ignorer en
        // répondant 200 évite qu'il les réessaie en boucle.
        break;
    }
  } catch (e) {
    // Une erreur de notre côté : on le dit à Stripe, qui réessaiera. C'est
    // exactement ce qu'on veut — mieux vaut un doublon traité de façon
    // idempotente qu'un paiement encaissé sans réservation confirmée.
    console.error("Webhook Stripe :", e);
    return new Response("Erreur de traitement", { status: 500 });
  }

  return recu();
}
