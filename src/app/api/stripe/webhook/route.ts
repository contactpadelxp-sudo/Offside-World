import type Stripe from "stripe";
import { after } from "next/server";
import {
  stripe,
  paiementConfigure,
  webhookConfigure,
  moyenDePaiementUtilise,
} from "@/lib/paiement/stripe";
import {
  confirmerPaiement,
  echouerPaiement,
  synchroniserRemboursement,
} from "@/lib/db/paiements";
import { lireRecapEmail } from "@/lib/db/backoffice";
import { envoyerTous } from "@/lib/email/envoi";
import {
  auClientReservationConfirmee,
  auComplexeContestation,
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

/**
 * De quoi reconstruire une ligne de paiement absente.
 *
 * `metadata.reservation_id` est posé par `creerSessionPaiement` ; le montant
 * vient de Stripe lui-même, donc de ce qui a réellement été débité. On ne rend
 * rien si l'un des deux manque : reconstruire à moitié serait pire que de ne
 * rien reconstruire.
 */
function secoursDepuis(
  session: Stripe.Checkout.Session
): { reservationId: string; montantCents: number } | undefined {
  const id = session.metadata?.reservation_id;
  const montant = session.amount_total;
  if (!id || typeof montant !== "number") return undefined;
  return { reservationId: id, montantCents: montant };
}

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

        const intention =
          typeof session.payment_intent === "string" ? session.payment_intent : null;
        const resultat = await confirmerPaiement(
          session.id,
          intention,
          // Le moyen RÉELLEMENT utilisé, lu sur l'imputation. Surtout pas
          // `session.payment_method_types[0]` : c'est la liste des moyens
          // proposés, dont le premier est toujours « bancontact » ici.
          await moyenDePaiementUtilise(intention),
          // De quoi reconstruire la ligne de paiement si elle manque. Ces
          // métadonnées sont celles que le serveur a écrites en créant la
          // session : le client n'a aucun moyen de les influencer.
          secoursDepuis(session)
        );

        /*
          ON EXIGE `reference`, ET PAS SEULEMENT `nouveau`.

          `nouveau` dit que la ligne de PAIEMENT a basculé ; `reference` n'est
          renseignée que si la RÉSERVATION a basculé aussi. Les deux peuvent
          diverger : un webhook qui arrive après l'expiration trouve une
          réservation déjà `expiree`, encaisse quand même — et, avec l'ancienne
          condition, envoyait « votre réservation est confirmée » à quelqu'un
          dont le créneau venait d'être rendu à la vente. Argent pris, créneau
          reperdu, client rassuré : le pire enchaînement possible.

          Le cas est rare (la session Stripe expire à 30 min, la réservation à
          45) mais il n'est pas théorique, et Bancontact peut se dénouer tard.
          Il laisse une ligne de paiement « réussi » sans réservation
          confirmée : c'est visible au back-office, et c'est exactement ce
          qu'on veut voir.
        */
        if (resultat.nouveau && resultat.reference && resultat.reservationId) {
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

      case "checkout.session.async_payment_succeeded": {
        /*
          Bancontact passe par l'application bancaire du client : le paiement
          peut se dénouer APRÈS la fermeture de la page. Stripe envoie alors
          cet événement, et non `checkout.session.completed`.

          Il manquait, alors que son pendant en échec était traité — l'argent
          serait parti sans que la réservation soit jamais confirmée. C'est le
          moyen de paiement le plus utilisé en Belgique.
        */
        const session = evenement.data.object;
        const intention =
          typeof session.payment_intent === "string" ? session.payment_intent : null;
        const resultat = await confirmerPaiement(
          session.id,
          intention,
          // Le moyen RÉELLEMENT utilisé, lu sur l'imputation. Surtout pas
          // `session.payment_method_types[0]` : c'est la liste des moyens
          // proposés, dont le premier est toujours « bancontact » ici.
          await moyenDePaiementUtilise(intention),
          // De quoi reconstruire la ligne de paiement si elle manque. Ces
          // métadonnées sont celles que le serveur a écrites en créant la
          // session : le client n'a aucun moyen de les influencer.
          secoursDepuis(session)
        );
        if (resultat.nouveau && resultat.reference && resultat.reservationId) {
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

      case "checkout.session.async_payment_failed": {
        await echouerPaiement(evenement.data.object.id, "Paiement refusé");
        break;
      }

      /*
        UN REMBOURSEMENT FAIT AILLEURS REVIENT QUAND MÊME ICI.

        Aucun événement de remboursement n'était écouté. `montant_rembourse_cents`
        n'était donc écrit que par notre propre bouton — alors que le code envoie
        lui-même l'exploitant rembourser dans le tableau de bord Stripe quand
        l'appel échoue. Ce remboursement-là n'était jamais rapatrié : le solde
        restant à rendre restait surévalué, et le chiffre d'affaires du
        back-office trop haut.

        `charge.refunded` porte le CUMUL remboursé sur l'imputation, pas le
        montant de la dernière opération — c'est donc lui qui fait autorité.
      */
      case "charge.refunded": {
        const imputation = evenement.data.object;
        const intention =
          typeof imputation.payment_intent === "string" ? imputation.payment_intent : null;
        if (intention) {
          await synchroniserRemboursement(intention, imputation.amount_refunded);
        }
        break;
      }

      /*
        UNE CONTESTATION EST UNE URGENCE, ET ELLE A UNE DATE LIMITE.

        Le client conteste le débit auprès de sa banque. Stripe retire aussitôt
        la somme du solde, y ajoute des frais, et laisse quelques jours pour
        fournir des preuves — passé ce délai, la contestation est perdue par
        défaut. Personne n'était prévenu de rien.

        On ne tente pas de répondre automatiquement : c'est à l'exploitant de
        fournir les éléments. On s'assure seulement qu'il l'apprenne.
      */
      case "charge.dispute.created": {
        const litige = evenement.data.object;
        console.error(
          `CONTESTATION Stripe ${litige.id} : ${litige.amount} centimes, motif « ${litige.reason} ». À traiter dans le tableau de bord Stripe avant la date limite.`
        );
        after(async () => {
          await envoyerTous([
            auComplexeContestation({
              montantCents: litige.amount,
              motif: litige.reason,
              echeance: litige.evidence_details?.due_by ?? null,
            }),
          ]);
        });
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
