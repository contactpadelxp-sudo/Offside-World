import "server-only";
import { stripe, paiementConfigure } from "./stripe";
import { base, baseConfiguree } from "@/lib/supabase/server";
import { partRemboursee } from "@/data/reglement";
import type { ChoixRemboursement } from "@/lib/vues";

/**
 * Remboursements.
 *
 * POURQUOI CE N'EST PAS AUTOMATIQUE. Le barème d'annulation des CGV s'applique
 * au client qui se désiste : plus de 7 jours avant, tout ; entre 7 jours et
 * 48 heures, la moitié ; après, rien. Mais une annulation décidée par le
 * complexe — terrain indisponible, dégât des eaux, animateur malade — n'est pas
 * un désistement, et retenir la moitié du prix dans ce cas serait indéfendable :
 * c'est le vendeur qui n'exécute pas.
 *
 * Le code ne peut pas deviner laquelle des deux situations il traite. Il pose
 * donc la question à l'exploitant, avec les montants déjà calculés, et refuse
 * de choisir à sa place. C'est un clic de plus et zéro remboursement décidé par
 * une machine.
 *
 * LE MONTANT N'EST JAMAIS ENVOYÉ PAR LE NAVIGATEUR. Le back-office transmet le
 * choix (« intégral », « barème », « aucun »), pas la somme : sans quoi une
 * requête forgée depuis la console rembourserait n'importe quel montant. Le
 * serveur relit le paiement en base et recalcule.
 *
 * CE QUI EST DÉJÀ RENDU N'EST PAS RENDU DEUX FOIS. Le cumul remboursé est écrit
 * en base et déduit avant chaque appel à Stripe ; une double soumission ne peut
 * donc rembourser que le solde, et zéro s'il n'y en a plus.
 */

export type { ChoixRemboursement };

export interface Remboursable {
  paiementId: string;
  paymentIntent: string;
  montantCents: number;
  dejaRembourseCents: number;
}

/**
 * Le paiement encaissé d'une réservation, s'il existe et s'il reste quelque
 * chose à rendre dessus.
 */
export async function paiementRemboursable(reservationId: string): Promise<Remboursable | null> {
  if (!baseConfiguree()) return null;

  const { data } = await base()
    .from("paiements")
    .select("id, stripe_payment_intent, montant_cents, montant_rembourse_cents")
    .eq("reservation_id", reservationId)
    .in("statut", ["reussi", "partiellement_rembourse"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // `stripe_payment_intent` porte l'identifiant de session tant que le webhook
  // n'a pas livré celui de l'intention. Seul ce dernier permet de rembourser :
  // un « cs_… » ferait échouer l'appel, autant le voir tout de suite.
  if (!data || !data.stripe_payment_intent?.startsWith("pi_")) return null;

  return {
    paiementId: data.id,
    paymentIntent: data.stripe_payment_intent,
    montantCents: data.montant_cents,
    dejaRembourseCents: data.montant_rembourse_cents,
  };
}

/**
 * Combien rendre, selon le choix de l'exploitant.
 *
 * `heuresAvant` peut être négatif quand l'activité est déjà passée : le barème
 * répond alors « rien », ce qui est le comportement voulu.
 */
export function montantARembourser(
  p: Remboursable,
  choix: ChoixRemboursement,
  heuresAvant: number
): number {
  const part = choix === "integral" ? 1 : choix === "bareme" ? partRemboursee(heuresAvant) : 0;
  const du = Math.round(p.montantCents * part);
  // Jamais plus que le solde : un second passage ne rend que ce qui reste.
  return Math.max(0, Math.min(du, p.montantCents - p.dejaRembourseCents));
}

export interface ResultatRemboursement {
  /** Ce qui est effectivement parti chez Stripe, en centimes. */
  montantCents: number;
  /** Message à montrer à l'exploitant si quelque chose n'a pas fonctionné. */
  erreur?: string;
}

/**
 * Rembourse, puis écrit ce qui a été rendu.
 *
 * L'ORDRE COMPTE. Stripe d'abord, la base ensuite : si l'écriture échoue après
 * un remboursement réussi, on a un client remboursé et une ligne en retard —
 * gênant, mais rattrapable. L'inverse donnerait une ligne qui affirme un
 * remboursement qui n'a jamais eu lieu, et personne ne s'en apercevrait avant
 * la réclamation.
 */
export async function rembourser(
  p: Remboursable,
  montantCents: number
): Promise<ResultatRemboursement> {
  if (montantCents <= 0) return { montantCents: 0 };
  if (!paiementConfigure()) {
    return { montantCents: 0, erreur: "Le paiement en ligne n'est pas configuré." };
  }

  try {
    await stripe().refunds.create(
      {
        payment_intent: p.paymentIntent,
        amount: montantCents,
        reason: "requested_by_customer",
      },
      {
        // Deux clics sur « annuler » ne doivent pas rembourser deux fois. La
        // clé inclut le cumul déjà rendu : un second remboursement volontaire,
        // plus tard et pour un autre montant, reste possible.
        idempotencyKey: `remb-${p.paiementId}-${p.dejaRembourseCents}-${montantCents}`,
      }
    );
  } catch (e) {
    console.error("Remboursement Stripe :", e);
    return {
      montantCents: 0,
      erreur: "Le remboursement a échoué. À effectuer à la main depuis Stripe.",
    };
  }

  const cumul = p.dejaRembourseCents + montantCents;
  const { error } = await base()
    .from("paiements")
    .update({
      montant_rembourse_cents: cumul,
      statut: cumul >= p.montantCents ? "rembourse" : "partiellement_rembourse",
      updated_at: new Date().toISOString(),
    })
    .eq("id", p.paiementId);

  if (error) {
    console.error("Remboursement enregistré chez Stripe mais pas en base :", error);
    return {
      montantCents,
      erreur:
        "Le remboursement est parti mais n'a pas pu être enregistré. Vérifiez la fiche avant d'en refaire un.",
    };
  }

  return { montantCents };
}
