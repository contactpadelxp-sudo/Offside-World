import "server-only";
import Stripe from "stripe";

/**
 * Accès à Stripe, côté serveur uniquement.
 *
 * DEUX DÉCISIONS PORTENT TOUT LE RESTE.
 *
 * 1. CHECKOUT HÉBERGÉ, PAS UN FORMULAIRE MAISON. Le client est envoyé sur une
 *    page de Stripe pour payer, puis renvoyé ici. Aucun numéro de carte ne
 *    touche jamais ce site : cela sort le projet du périmètre PCI le plus
 *    lourd, supprime toute une classe de failles, et donne Bancontact — de
 *    loin le premier moyen de paiement en Belgique — sans travail
 *    supplémentaire. Un formulaire intégré serait plus joli et bien plus
 *    coûteux à sécuriser.
 *
 * 2. LA VÉRITÉ VIENT DU WEBHOOK, PAS DE LA REDIRECTION. Après paiement,
 *    Stripe renvoie le client sur une page de retour — mais il peut fermer
 *    l'onglet avant, perdre le réseau, ou tomber en panne de batterie. La
 *    réservation ne doit pas dépendre de ça. C'est le webhook, envoyé de
 *    serveur à serveur et réessayé par Stripe, qui confirme. La page de retour
 *    ne fait qu'informer.
 *
 * COMME POUR LES E-MAILS, l'absence de configuration n'est pas une erreur : le
 * site fonctionne sans, en enregistrant les réservations « à confirmer »
 * comme aujourd'hui. Le paiement s'allume le jour où les clés existent.
 *
 * Variables attendues (Vercel → Settings → Environment Variables) :
 *   STRIPE_SECRET_KEY            type « Sensitive »
 *   STRIPE_WEBHOOK_SECRET        type « Sensitive »
 */

let instance: Stripe | null = null;

/** Le paiement en ligne est-il actif ? */
export function paiementConfigure(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Le webhook peut-il être vérifié ? Sans ce secret, on refuse de le traiter. */
export function webhookConfigure(): boolean {
  return Boolean(process.env.STRIPE_WEBHOOK_SECRET);
}

/**
 * Sommes-nous sur les clés de test ?
 *
 * Sert à afficher un avertissement dans le back-office : une clé de test
 * accepte les paiements sans jamais encaisser un centime, et rien ne le
 * signale au client. C'est exactement le même piège que l'expéditeur
 * `resend.dev` pour les e-mails.
 */
export function modeTest(): boolean {
  return (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_");
}

/**
 * Le moyen de paiement RÉELLEMENT utilisé par le client.
 *
 * POURQUOI CETTE FONCTION EXISTE, ET CE QU'ELLE RÉPARE.
 *
 * Le webhook lisait `session.payment_method_types[0]`. Ce champ est la liste
 * des moyens PROPOSÉS au client, pas celui qu'il a choisi — et comme la session
 * est créée avec `["bancontact", "card"]`, le premier élément valait toujours
 * « bancontact ». Tout paiement par carte était donc enregistré, puis annoncé
 * au client, comme un paiement Bancontact. Constaté en test le 15 septembre
 * 2026 : « 200 € TVAC réglés par Bancontact » sur un paiement fait à la carte.
 *
 * Ce n'est pas un détail cosmétique. L'e-mail de confirmation est le support
 * durable exigé par l'article VI.46 § 7 du Code de droit économique, et
 * l'e-mail d'annulation promet que « le remboursement revient sur le moyen de
 * paiement utilisé » — en le nommant. Se tromper de moyen, c'est écrire au
 * client quelque chose de faux sur son argent.
 *
 * Le moyen réellement employé ne figure ni sur la session ni sur l'événement :
 * il vit sur l'imputation (`charge`) rattachée au paiement. D'où cet appel
 * supplémentaire, fait avant d'écrire en base.
 *
 * EN CAS D'ÉCHEC, ON RENVOIE `null` PLUTÔT QU'UNE SUPPOSITION. Les e-mails
 * savent se passer du nom du moyen de paiement — ils écrivent « 200 € réglés »
 * au lieu de « 200 € réglés par carte bancaire ». Une phrase moins précise vaut
 * mieux qu'une phrase fausse.
 */
export async function moyenDePaiementUtilise(
  paymentIntentId: string | null
): Promise<string | null> {
  if (!paymentIntentId || !paiementConfigure()) return null;
  try {
    const paiement = await stripe().paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });
    const imputation = paiement.latest_charge;
    if (!imputation || typeof imputation === "string") return null;
    return imputation.payment_method_details?.type ?? null;
  } catch (e) {
    console.error("Moyen de paiement illisible :", e);
    return null;
  }
}

export function stripe(): Stripe {
  if (instance) return instance;

  const cle = process.env.STRIPE_SECRET_KEY;
  if (!cle) {
    throw new Error(
      "STRIPE_SECRET_KEY est absente. Le paiement en ligne ne peut pas fonctionner. " +
        "Les appelants doivent tester `paiementConfigure()` avant d'arriver ici."
    );
  }
  if (cle.startsWith("pk_")) {
    throw new Error(
      "STRIPE_SECRET_KEY contient une clé PUBLIABLE (pk_…). La clé secrète commence " +
        "par sk_. Une clé publiable ne permet pas d'encaisser."
    );
  }

  instance = new Stripe(cle, {
    // Version d'API figée, et alignée sur celle qu'attend la bibliothèque
    // installée : Stripe fait évoluer ses formats, et une montée de version
    // non choisie changerait la forme des webhooks sans prévenir. Mettre à
    // jour le paquet `stripe` demandera de changer cette ligne — et de relire
    // les notes de version, pas seulement de faire taire le compilateur.
    apiVersion: "2026-08-26.dahlia",
    // Les appels partent depuis une fonction serverless : on échoue vite
    // plutôt que de tenir une requête ouverte pendant que le client attend.
    timeout: 15_000,
    maxNetworkRetries: 2,
    appInfo: { name: "Offside Foot Indoor" },
  });
  return instance;
}

/**
 * Ce qu'on montre au back-office pour qu'on sache dans quel état on est,
 * sans avoir à ouvrir Vercel.
 */
export interface DiagnosticPaiement {
  configure: boolean;
  webhook: boolean;
  modeTest: boolean;
}

export function diagnosticPaiement(): DiagnosticPaiement {
  return {
    configure: paiementConfigure(),
    webhook: webhookConfigure(),
    modeTest: modeTest(),
  };
}
