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
