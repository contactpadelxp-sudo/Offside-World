import { redirect } from "next/navigation";
import { stripe, paiementConfigure } from "@/lib/paiement/stripe";
import { sessionPaiementVivante } from "@/lib/db/paiements";
import { libererReservationAbandonnee } from "@/lib/db/reservations";
import { URL_SITE } from "@/lib/site";

/**
 * Retour de Stripe quand le client renonce à payer.
 *
 * CE QUE FAISAIT L'ANCIEN `cancel_url`, C'EST-À-DIRE RIEN.
 *
 * Il renvoyait sur `/reservation?paiement=annule`. Aucune page ne lisait ce
 * paramètre : le client retombait sur le tunnel vide, sans un mot sur ce qui
 * venait de se passer, et — c'est le vrai coût — SON CRÉNEAU RESTAIT TENU.
 *
 * La réservation est écrite avant l'appel à Stripe, c'est elle qui tient le
 * créneau pendant le paiement. Un abandon la laissait « en attente » jusqu'à
 * l'expiration à quarante-cinq minutes, et cette expiration n'est pas
 * planifiée : elle ne tourne que lorsqu'un visiteur ouvre la page de
 * réservation. Un samedi après-midi, un client qui renonce bloquait donc son
 * créneau pour le suivant, et bien souvent pour lui-même : revenu deux minutes
 * plus tard, le site lui refusait SON PROPRE créneau comme déjà pris.
 *
 * L'ORDRE DES DEUX ÉCRITURES N'EST PAS INTERCHANGEABLE.
 *
 * On ferme d'abord la session chez Stripe, on libère ensuite. L'inverse
 * rouvrirait exactement le trou que la migration 0026 a bouché : un créneau
 * rendu à la vente pendant qu'une session de paiement vit encore, donc deux
 * clients sur le même créneau dont l'un a payé. Si `expire` échoue — Stripe
 * refuse d'expirer une session dont le paiement est déjà engagé —, on ne
 * libère rien. C'est précisément le cas où il ne faut pas.
 *
 * ON NE CROIT PAS L'URL, ON S'EN SERT COMME D'UNE CLÉ.
 *
 * Le paramètre porte l'identifiant de la réservation, écrit par le serveur au
 * moment de créer la session — un UUID, donc non devinable. Il ne décide de
 * rien à lui seul : la base doit confirmer qu'une session vit encore sur cette
 * réservation, et Stripe qu'elle est ouverte et impayée. Deux vérifications
 * hors de portée de qui bricole l'adresse.
 *
 * ON N'UTILISE PAS `{CHECKOUT_SESSION_ID}`. Stripe ne documente cette
 * substitution que pour `success_url` et `return_url` ; s'appuyer dessus dans
 * `cancel_url` ferait dépendre la libération d'un créneau d'un comportement
 * non garanti. L'identifiant de session, on le relit en base.
 *
 * ON REDIRIGE TOUJOURS, ET TOUJOURS AU MÊME ENDROIT. Un identifiant inconnu,
 * une panne de Stripe ou une session déjà payée mènent à la même page : cette
 * adresse ne doit rien apprendre à qui la sonde, et un client qui renonce n'a
 * pas à lire un message d'erreur technique.
 */
export const dynamic = "force-dynamic";

/** Forme d'un UUID. Ce qui n'y ressemble pas ne touche pas la base. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request): Promise<Response> {
  const reservation = new URL(req.url).searchParams.get("r");

  if (reservation && UUID.test(reservation) && paiementConfigure()) {
    try {
      const session = await sessionPaiementVivante(reservation);
      if (session) {
        const chez = await stripe().checkout.sessions.retrieve(session);
        if (chez.status === "open" && chez.payment_status === "unpaid") {
          // Ferme la session : plus aucun paiement ne peut aboutir dessus.
          // Stripe en émettra `checkout.session.expired`, que le webhook traite
          // déjà en passant la ligne de paiement à « échoué ».
          await stripe().checkout.sessions.expire(session);
          await libererReservationAbandonnee(reservation);
        }
      }
    } catch (e) {
      // Le client n'y peut rien et n'a rien perdu : au pire son créneau reste
      // tenu jusqu'à l'expiration, comme avant cette route.
      console.error("Abandon de paiement : libération impossible.", e);
    }
  }

  // Hors du `try` : `redirect` lève pour interrompre le rendu, et un `catch`
  // au-dessus l'avalerait. La documentation de Next l'écrit noir sur blanc
  // (`04-functions/redirect.md`).
  redirect(`${URL_SITE}/reservation?paiement=annule`);
}
