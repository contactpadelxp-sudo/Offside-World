import "server-only";
import { after } from "next/server";
import { base, baseConfiguree } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { paiementConfigure } from "@/lib/paiement/stripe";
import { envoyerTous } from "@/lib/email/envoi";
import { auClientReservationExpiree } from "@/lib/email/modeles";
import { heure, jourLisibleCap } from "@/lib/temps";

/**
 * Écriture des réservations et des demandes de devis.
 *
 * Le montant écrit ici vient TOUJOURS d'un calcul serveur (voir
 * `src/app/reservation/actions.ts`). Aucune valeur de prix envoyée par le
 * navigateur n'atteint ce module.
 */

/**
 * Une réservation que l'expiration vient de libérer.
 *
 * Décrit à la main plutôt que tiré des types générés : tant que la migration
 * 0027 n'est pas appliquée, `types.ts` annonce encore `Returns: number` pour
 * cette fonction. Les noms suivent le `returns table (…)` de la migration, en
 * `snake_case`, parce que c'est PostgREST qui les écrit.
 */
interface LigneExpiree {
  reference: string;
  client_nom: string;
  client_email: string;
  type: string;
  debut: string;
  fin: string;
}

type InsertReservation = Database["public"]["Tables"]["reservations"]["Insert"];
type InsertDevis = Database["public"]["Tables"]["demandes_devis"]["Insert"];

/**
 * Alphabet sans I, O, 0 ni 1 : une référence se lit au téléphone et se recopie
 * à la main. 32 symboles, donc `octet % 32` reste uniforme sur 0-255 — pas de
 * biais modulo.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function reference(prefixe: string, longueur = 8): string {
  const octets = new Uint8Array(longueur);
  crypto.getRandomValues(octets);
  let suite = "";
  for (const o of octets) suite += ALPHABET[o % ALPHABET.length];
  return `${prefixe}-${suite}`;
}

/** Codes PostgreSQL renvoyés par PostgREST dans `error.code`. */
const VIOLATION_UNICITE = "23505";
const VIOLATION_EXCLUSION = "23P01";

/** Le créneau vient d'être pris par quelqu'un d'autre. */
export class CreneauDejaPris extends Error {
  constructor() {
    super("Ce créneau vient d'être réservé.");
    this.name = "CreneauDejaPris";
  }
}

/**
 * Libère les créneaux tenus par des réservations jamais confirmées.
 * Sans effet si aucune n'a expiré ; l'échec n'est pas bloquant.
 */
/**
 * Libère les créneaux tenus par des réservations jamais menées à terme.
 *
 * LE DÉLAI DÉPEND DE CE QU'ON ATTEND, et les deux situations n'ont rien à voir.
 *
 * Sans paiement en ligne, une réservation est une DEMANDE que le complexe
 * confirme par téléphone : 48 heures laissent à Brahim le temps de rappeler.
 *
 * Avec paiement, c'est une FENÊTRE DE PAIEMENT. La session Stripe expire au
 * bout de trente minutes ; garder le créneau bloqué deux jours pour quelqu'un
 * qui a fermé l'onglet ferait perdre de vraies réservations un samedi
 * après-midi.
 *
 * Quarante-cinq minutes et non trente : Bancontact passe par l'application
 * bancaire du client, et sa confirmation peut arriver un peu après la fermeture
 * de la session. Cette marge évite d'expirer une réservation dont l'argent est
 * en train d'arriver — le pire cas possible, puisqu'on aurait encaissé sans
 * garder le créneau.
 *
 * ELLE PRÉVIENT LE CLIENT, MAINTENANT.
 *
 * L'expiration était muette. Le client, lui, avait reçu « votre créneau est
 * retenu, nous vous recontactons rapidement » : cette phrase restait la
 * dernière chose qu'il ait lue, et elle était devenue fausse. Il découvrait le
 * jour dit, devant une porte, qu'il n'avait pas de réservation.
 *
 * UN SEUL E-MAIL PAR RÉSERVATION, GARANTI PAR SQL. La fonction retourne les
 * lignes que CET appel a fait basculer (`update … returning` sur
 * `statut = 'en_attente'`) : aucun appel suivant, aucun appel concurrent ne
 * peut rendre la même. Rien à dédupliquer côté application.
 *
 * L'ENVOI NE RETARDE PAS L'APPELANT. Cette fonction est appelée au rendu de la
 * page de réservation et au début du tunnel : y attendre le fournisseur
 * d'e-mails ferait patienter un visiteur pour un message qui ne lui est pas
 * destiné. `after()` diffère l'envoi après la réponse — même choix que pour la
 * confirmation envoyée par le back-office.
 */
export async function expirerReservationsAbandonnees(): Promise<void> {
  const delai = paiementConfigure() ? "45 minutes" : "48 hours";
  const { data, error } = await base().rpc("expirer_reservations_en_attente", { delai });
  if (error) {
    console.error("Expiration des réservations impossible :", error.message);
    return;
  }

  /*
    DEUX FORMES DE RETOUR SONT ACCEPTÉES, ET CE N'EST PAS UNE PRÉCAUTION
    DÉCORATIVE.

    Le déploiement du code et l'application de la migration ne sont pas
    atomiques : Vercel publie quand on pousse, la migration 0027 part d'ailleurs
    et à un autre moment. Il existe donc forcément une fenêtre où ce code
    rencontre l'ANCIENNE fonction, qui rend un entier — le nombre de lignes
    touchées — et non les lignes elles-mêmes.

    Pendant cette fenêtre, l'expiration continue de faire son travail
    essentiel : libérer les créneaux. Seul l'e-mail manque, ce qui est
    exactement l'état d'avant. Lire `.length` sur un entier aurait au contraire
    fait échouer le rendu de la page de réservation.
  */
  const expirees: LigneExpiree[] = Array.isArray(data) ? data : [];
  if (expirees.length === 0) return;

  const messages = expirees
    .filter((r) => Boolean(r.client_email))
    .map((r) => {
      const debut = new Date(r.debut);
      return auClientReservationExpiree({
        reference: r.reference,
        clientNom: r.client_nom,
        clientEmail: r.client_email,
        activite: r.type === "anniversaire" ? "Anniversaire" : "Bubble Foot",
        jourLabel: jourLisibleCap(debut),
        debut: heure(debut),
        fin: heure(new Date(r.fin)),
      });
    });

  if (messages.length > 0) after(() => envoyerTous(messages));
}

/**
 * Insère une réservation. La référence est retirée au sort ; en cas de collision
 * (extrêmement improbable) on retente, sans jamais confondre cette collision
 * avec un créneau déjà pris — les deux remontent le même code SQL, seul le nom
 * de l'index les distingue.
 */
/**
 * L'identifiant est renvoyé en plus de la référence : c'est lui qui relie la
 * réservation à sa ligne de paiement. La référence, elle, est faite pour être
 * lue au téléphone — elle ne sert pas de clé étrangère.
 */
/**
 * Libère le créneau d'une réservation qu'on vient d'écrire et qu'on abandonne.
 *
 * POURQUOI ELLE EXISTE. La réservation est écrite AVANT l'appel à Stripe —
 * c'est elle qui tient le créneau pendant que le client paie. Si la création de
 * la session échoue, elle reste en base : le client voit un message d'erreur,
 * recommence, et son PROPRE créneau lui est refusé comme déjà pris, pendant
 * les quarante-cinq minutes du délai d'expiration.
 *
 * « expiree » plutôt qu'une suppression : la ligne sort de l'index unique
 * partiel, donc le créneau redevient réservable immédiatement, et la trace de
 * la tentative reste — utile le jour où un client appelle en disant qu'il a
 * essayé de réserver et que le site a refusé.
 *
 * ELLE NE LÈVE JAMAIS. Elle est appelée depuis un chemin d'erreur : y échouer
 * à son tour masquerait la cause d'origine, qui est la seule intéressante.
 */
export async function libererReservationAbandonnee(id: string): Promise<void> {
  if (!baseConfiguree()) return;
  try {
    const { error } = await base()
      .from("reservations")
      .update({ statut: "expiree" })
      .eq("id", id)
      .eq("statut", "en_attente");
    if (error) throw error;
  } catch (e) {
    console.error(`Libération de la réservation ${id} impossible :`, e);
  }
}

export async function enregistrerReservation(
  donnees: Omit<InsertReservation, "reference">
): Promise<{ reference: string; id: string }> {
  for (let essai = 0; essai < 4; essai++) {
    const ref = reference("OW");
    const { data, error } = await base()
      .from("reservations")
      .insert({ ...donnees, reference: ref })
      .select("id")
      .single();

    if (!error && data) return { reference: ref, id: data.id };

    const surCreneau =
      error.code === VIOLATION_EXCLUSION ||
      (error.code === VIOLATION_UNICITE && !error.message.includes("reference"));
    if (surCreneau) throw new CreneauDejaPris();

    if (error.code === VIOLATION_UNICITE) continue; // collision de référence
    throw new Error(`Écriture de la réservation impossible : ${error.message}`);
  }
  throw new Error("Impossible de générer une référence unique.");
}

export async function enregistrerDemandeDevis(
  donnees: Omit<InsertDevis, "reference">
): Promise<{ reference: string }> {
  for (let essai = 0; essai < 4; essai++) {
    const ref = reference("TB");
    const { error } = await base()
      .from("demandes_devis")
      .insert({ ...donnees, reference: ref });

    if (!error) return { reference: ref };
    if (error.code === VIOLATION_UNICITE) continue;
    throw new Error(`Enregistrement de la demande impossible : ${error.message}`);
  }
  throw new Error("Impossible de générer une référence unique.");
}
