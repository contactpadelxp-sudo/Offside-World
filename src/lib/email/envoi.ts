import "server-only";
import { EMAIL as EMAIL_CONTACT } from "@/data/entreprise";

/**
 * Envoi des e-mails transactionnels.
 *
 * TRANSACTIONNEL UNIQUEMENT. Ce module ne sert qu'à informer quelqu'un d'une
 * opération qu'il vient de déclencher : sa réservation est enregistrée,
 * confirmée, annulée. Aucune newsletter, aucune offre. Le consentement
 * marketing est bien recueilli et horodaté en base, mais rien ici ne s'en sert
 * — et rien ne doit s'en servir sans un vrai mécanisme de désinscription.
 *
 * UN ENVOI RATÉ NE DOIT JAMAIS FAIRE ÉCHOUER UNE RÉSERVATION. Toutes les
 * erreurs sont avalées et journalisées : la réservation est déjà en base, elle
 * fait foi. C'est aussi pourquoi l'appelant passe par `after()` — l'envoi a
 * lieu APRÈS la réponse, le client n'attend pas le fournisseur d'e-mails.
 *
 * FOURNISSEUR. L'implémentation vise l'API HTTP de Resend, mais tout est
 * contenu dans `appelerFournisseur` : en changer revient à réécrire cette seule
 * fonction. Aucune dépendance npm n'est ajoutée pour autant.
 *
 * Variables d'environnement :
 *   RESEND_API_KEY     clé d'API (type « Sensitive »)
 *   EMAIL_EXPEDITEUR   « Offside Foot Indoor <reservations@offsidefootindoor.be> »
 *   EMAIL_COMPLEXE     boîte qui reçoit les avis internes (défaut : contact du site)
 *   EMAIL_API_URL      facultatif : autre point d'envoi (relais, bac à sable)
 */

export interface Message {
  destinataire: string;
  sujet: string;
  texte: string;
  html: string;
  /** Adresse à laquelle le destinataire répondra s'il clique sur « Répondre ». */
  repondreA?: string;
}

/**
 * Point d'envoi. Configurable pour pouvoir viser un relais interne ou un bac à
 * sable lors des vérifications, sans toucher au code.
 */
const POINT_DE_TERMINAISON = process.env.EMAIL_API_URL || "https://api.resend.com/emails";

export function emailConfigure(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_EXPEDITEUR);
}

/** Boîte interne du complexe. */
export function adresseComplexe(): string {
  return process.env.EMAIL_COMPLEXE || EMAIL_CONTACT;
}

async function appelerFournisseur(message: Message): Promise<void> {
  const reponse = await fetch(POINT_DE_TERMINAISON, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_EXPEDITEUR,
      to: [message.destinataire],
      subject: message.sujet,
      text: message.texte,
      html: message.html,
      ...(message.repondreA ? { reply_to: message.repondreA } : {}),
    }),
    // Un e-mail n'est jamais mis en cache, et on ne veut pas attendre
    // indéfiniment si le fournisseur ne répond pas.
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!reponse.ok) {
    const detail = await reponse.text().catch(() => "");
    throw new Error(`Fournisseur d'e-mail : ${reponse.status} ${detail.slice(0, 200)}`);
  }
}

/**
 * Envoie un message. Ne lève jamais : l'échec est journalisé côté serveur, et
 * l'opération qui l'a déclenché reste valide.
 */
export async function envoyer(message: Message): Promise<void> {
  if (!emailConfigure()) {
    console.warn(
      `E-mail non envoyé (fournisseur non configuré) : « ${message.sujet} » à ${message.destinataire}`
    );
    return;
  }
  try {
    await appelerFournisseur(message);
  } catch (e) {
    console.error("Envoi d'e-mail impossible :", e);
  }
}

/**
 * État de la configuration, pour l'afficher dans le back-office.
 *
 * Ne divulgue JAMAIS la clé d'API — seulement si elle est présente. Le
 * back-office est authentifié, mais une valeur secrète qui n'a aucune raison
 * d'être affichée n'a aucune raison d'être renvoyée.
 */
export interface DiagnosticEmail {
  configure: boolean;
  cle: boolean;
  expediteur: string | null;
  complexe: string;
  /** Vrai si l'envoi vise autre chose que Resend (relais, bac à sable). */
  pointPersonnalise: boolean;
}

export function diagnosticEmail(): DiagnosticEmail {
  return {
    configure: emailConfigure(),
    cle: Boolean(process.env.RESEND_API_KEY),
    expediteur: process.env.EMAIL_EXPEDITEUR || null,
    complexe: adresseComplexe(),
    pointPersonnalise: Boolean(process.env.EMAIL_API_URL),
  };
}

/**
 * Comme `envoyer`, mais remonte l'échec au lieu de l'avaler.
 * Réservé à l'envoi de test : c'est le seul cas où l'on veut voir l'erreur.
 */
export async function envoyerEnRemontantLErreur(message: Message): Promise<void> {
  if (!emailConfigure()) throw new Error("Fournisseur d'e-mails non configuré.");
  await appelerFournisseur(message);
}

/** Envoie plusieurs messages sans qu'un échec n'empêche les autres. */
export async function envoyerTous(messages: Message[]): Promise<void> {
  await Promise.all(messages.map(envoyer));
}
