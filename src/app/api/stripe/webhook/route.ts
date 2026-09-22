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
  referencePourIntention,
  synchroniserRemboursement,
} from "@/lib/db/paiements";
import { lireRecapEmail } from "@/lib/db/backoffice";
import { envoyerTous } from "@/lib/email/envoi";
import {
  auClientReservationConfirmee,
  auComplexeContestation,
  auComplexeNouvelleReservation,
  auComplexePaiementSansReservation,
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

/**
 * PAYER UN CRÉNEAU QU'ON N'A PLUS NE DOIT PAS ÊTRE SILENCIEUX.
 *
 * La confirmation est filtrée sur `statut = 'en_attente'`. Sans référence en
 * retour, deux choses très différentes se cachaient derrière le même silence :
 * une simple relivraison de Stripe sur une réservation déjà confirmée — rien à
 * faire — ou un encaissement sur une réservation expirée ou annulée, donc un
 * client débité pour un créneau déjà rendu à la vente.
 *
 * Seul le second cas alerte. C'est `statutReservation` qui les sépare : il ne
 * vaut « confirmee » que dans le premier.
 *
 * L'avis part APRÈS la réponse à Stripe, comme tous les autres envois : un
 * fournisseur d'e-mails indisponible ne doit jamais faire échouer le traitement
 * d'un paiement.
 */
function alerterSiPaiementOrphelin(
  resultat: {
    reference: string | null;
    referenceConnue?: string | null;
    statutReservation?: string | null;
  },
  montantCents: number | null
): void {
  const statut = resultat.statutReservation;
  if (!statut || statut === "confirmee") return;

  console.error(
    `Paiement abouti sur une réservation « ${statut} » : ${montantCents ?? "?"} centimes encaissés sans créneau.`
  );
  after(async () => {
    await envoyerTous([
      auComplexePaiementSansReservation({
        reference: resultat.referenceConnue ?? resultat.reference,
        montantCents: montantCents ?? 0,
        statut,
      }),
    ]);
  });
}

/** Réponse standard : Stripe ne lit que le code. */
function recu(): Response {
  return new Response(null, { status: 200 });
}

export async function POST(req: Request) {
  if (!paiementConfigure() || !webhookConfigure()) {
    /*
      500, ET SURTOUT PAS 200. REFUSER EN ACCUSANT RÉCEPTION N'EST PAS REFUSER.

      Cette branche répondait 200 « pour ne pas faire réessayer indéfiniment un
      test ». Or un 200 dit à Stripe : livré, compris, ne renvoie rien. Il
      marque l'événement traité, n'effectue AUCUNE relivraison, et son tableau
      de bord affiche du vert.

      Il suffit alors que `STRIPE_SECRET_KEY` soit posée et
      `STRIPE_WEBHOOK_SECRET` absente — un oubli, une rotation de clé, une
      variable posée sur le mauvais environnement, un redéploiement antérieur à
      son ajout — pour que chaque paiement produise l'enchaînement complet :
      client débité, réservation laissée « en attente », expirée à la
      quarante-cinquième minute, créneau rendu à la vente, aucun e-mail. Et pas
      une trace : ni chez Stripe, ni au back-office, ni dans les journaux.

      `MISE-EN-LIGNE.md` décrit cet enchaînement comme « la panne la plus
      coûteuse possible, et la plus silencieuse ». Ce code en était la cause
      possible au lieu d'en être le garde-fou — et il affirmait l'inverse :
      « sans STRIPE_WEBHOOK_SECRET, le site REFUSE de traiter la notification ».

      Avec un 500, Stripe relivre pendant trois jours, l'endpoint passe en
      rouge, et poser la variable manquante rattrape rétroactivement TOUS les
      paiements de l'intervalle. Le coût d'un test qui réessaie quelques fois
      est sans commune mesure.
    */
    console.error(
      "Webhook Stripe reçu alors que la configuration est incomplète — " +
        `clé: ${paiementConfigure()}, secret de signature: ${webhookConfigure()}. ` +
        "On répond 500 pour que Stripe relivre."
    );
    return new Response("Paiement non configuré", { status: 500 });
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
        } else {
          alerterSiPaiementOrphelin(resultat, session.amount_total);
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
        } else {
          alerterSiPaiementOrphelin(resultat, session.amount_total);
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
        /*
          LA RÉFÉRENCE EST CHERCHÉE DANS `after()`, PAS AVANT.

          L'avis disait le montant, le motif et la date limite — jamais de qui
          il s'agissait. Or répondre à une contestation, c'est produire le nom
          du client, la date de l'activité et l'e-mail de confirmation qu'il a
          reçu : sans la référence, il fallait retrouver la réservation à
          partir d'un montant, et deux anniversaires du même samedi au même
          tarif sont indiscernables.

          La lecture vit APRÈS la réponse à Stripe, avec l'envoi. Un webhook
          qui tarde est réessayé ; faire attendre Stripe pour enrichir un
          e-mail serait payer une relivraison pour une ligne de texte. Et si
          la lecture échoue, `referencePourIntention` rend `null` et l'avis
          part quand même — il y a une date limite au bout.
        */
        const intentionLitige =
          typeof litige.payment_intent === "string" ? litige.payment_intent : null;
        after(async () => {
          const reference = intentionLitige
            ? await referencePourIntention(intentionLitige)
            : null;
          await envoyerTous([
            auComplexeContestation({
              montantCents: litige.amount,
              motif: litige.reason,
              echeance: litige.evidence_details?.due_by ?? null,
              reference,
            }),
          ]);
        });
        break;
      }

      /*
        UNE CONTESTATION PERDUE EST DE L'ARGENT REPRIS, ET ÇA DOIT SE VOIR.

        On écoutait l'OUVERTURE d'une contestation — un e-mail à l'exploitant,
        avec sa date limite — mais jamais son issue. Quand la banque tranche en
        faveur du client, Stripe retire définitivement la somme et envoie
        `charge.dispute.closed` avec `status: "lost"`.

        Sans ce cas, la ligne de paiement restait « réussie » avec un
        remboursement à zéro : le chiffre d'affaires du back-office comptait
        pour toujours un argent que le complexe n'a plus.

        On passe par `synchroniserRemboursement`, qui COPIE le cumul plutôt que
        de l'incrémenter : si le montant a déjà été rapatrié autrement, le
        repasser ici ne le compte pas deux fois.

        Les autres issues — `won`, `warning_closed` — ne changent rien au solde :
        l'argent revient de lui-même, et il n'y a rien à écrire.
      */
      case "charge.dispute.closed": {
        const litige = evenement.data.object;
        const intention =
          typeof litige.payment_intent === "string" ? litige.payment_intent : null;
        if (litige.status === "lost" && intention) {
          console.error(
            `Contestation ${litige.id} PERDUE : ${litige.amount} centimes définitivement repris.`
          );
          await synchroniserRemboursement(intention, litige.amount);
        }
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
