import "server-only";
import { after } from "next/server";
import { base, baseConfiguree } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { paiementConfigure } from "@/lib/paiement/stripe";
import { envoyerTous } from "@/lib/email/envoi";
import { auClientReservationExpiree } from "@/lib/email/modeles";
import { heure, jourISO, jourLisibleCap } from "@/lib/temps";
import { premierInstantReservable } from "@/lib/db/creneaux";
import { PERIODES, type PeriodeTeamBuilding } from "@/lib/demi-journees";

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
 * Tirée des types générés depuis que la migration 0027 est appliquée : elle
 * était décrite à la main tant que `types.ts` annonçait encore `Returns: number`
 * pour cette fonction, ce qui n'est plus le cas. Les noms restent en
 * `snake_case`, parce que c'est PostgREST qui les écrit.
 */
type LigneExpiree = Database["public"]["Functions"]["expirer_reservations_en_attente"]["Returns"][number];

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
const VIOLATION_CLE_ETRANGERE = "23503";

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
  const paiementEnLigne = paiementConfigure();
  const delai = paiementEnLigne ? "45 minutes" : "48 hours";
  const { data, error } = await base().rpc("expirer_reservations_en_attente", { delai });
  if (error) {
    console.error("Expiration des réservations impossible :", error.message);
    return;
  }

  /*
    ON VÉRIFIE QUAND MÊME QUE C'EST UN TABLEAU.

    La migration 0027 est appliquée et les types le disent, donc ce contrôle
    est aujourd'hui redondant. Il reste parce que le déploiement du code et
    l'application d'une migration ne sont jamais atomiques : Vercel publie au
    push, la migration part d'ailleurs. Le jour où quelqu'un rejoue ce dépôt
    sur une base plus ancienne — une copie de secours, un environnement
    reconstruit —, cette fonction rendra un entier, et lire `.length` dessus
    ferait échouer le rendu de la page de réservation. L'expiration, elle,
    continuerait de libérer les créneaux : seul l'e-mail manquerait.
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
        /*
          CE DÉTAIL DÉCIDE DE CE QU'ON REPROCHE AU CLIENT.

          Sans paiement en ligne, le tunnel lui a écrit « nous vous
          recontactons pour convenir du règlement » : il n'a jamais eu le moyen
          de payer, et si sa demande expire c'est que personne ne l'a rappelé.
          Lui annoncer « nous n'avons reçu aucun paiement » retournerait contre
          lui une négligence qui n'est pas la sienne.
        */
        paiementEnLigne,
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
): Promise<{ id: string; reference: string }> {
  for (let essai = 0; essai < 4; essai++) {
    const ref = reference("TB");
    // L'identifiant est relu à l'écriture : c'est lui qui rattache ensuite la
    // demande aux créneaux qu'elle tient (`devis_creneaux`).
    const { data, error } = await base()
      .from("demandes_devis")
      .insert({ ...donnees, reference: ref })
      .select("id")
      .single();

    if (!error && data) return { id: data.id, reference: ref };
    if (error.code === VIOLATION_UNICITE) continue;
    throw new Error(`Enregistrement de la demande impossible : ${error.message}`);
  }
  throw new Error("Impossible de générer une référence unique.");
}

// ── Team building : les créneaux qu'une demande tient ────────────────────────

/**
 * Les créneaux qu'une demande doit tenir : TOUS les terrains de la période.
 *
 * LE TEAM BUILDING PRIVATISE LE COMPLEXE — c'est ce que le site annonce, pour
 * des groupes allant jusqu'à 60 personnes. La première version de cette
 * fonction attribuait UNE Fun zone de 18 places, et laissait l'autre à une
 * seconde entreprise : deux sociétés se seraient retrouvées ensemble dans un
 * complexe « privatisé », et une équipe de 45 sur un terrain prévu pour 18.
 * Relevé par la relecture du 24 septembre 2026.
 *
 * Une demi-journée n'est donc servie que si CHAQUE espace actif a son
 * créneau ouvert et libre à cette heure. Un terrain fermé par Brahim — une
 * location prise par téléphone, un entretien — rend la période indisponible :
 * le complexe n'y est plus privatisable. Pour accueillir deux entreprises sur
 * la même demi-journée, Brahim rouvre un terrain à la main.
 *
 * Rend la liste des créneaux à tenir, ou une liste vide si la période n'est
 * pas entièrement libre. Une seule combinaison : il n'y a plus de terrain à
 * choisir, donc plus d'alternative à essayer.
 *
 * LA JOURNÉE EST LUE LARGE PUIS FILTRÉE EN HEURE DE BRUXELLES. Borner la
 * requête avec `new Date("…T00:00:00")` la ferait lire dans le fuseau du
 * serveur — UTC sur Vercel. On lit trois jours autour de midi, et c'est
 * `jourISO`, qui connaît Bruxelles, qui trie.
 */
export async function candidatsTeamBuilding(
  jour: string,
  periode: PeriodeTeamBuilding
): Promise<string[]> {
  const midi = new Date(`${jour}T12:00:00Z`);
  const plancher = premierInstantReservable();
  const de = new Date(Math.max(midi.getTime() - 36 * 3_600_000, plancher.getTime()));
  const a = new Date(midi.getTime() + 36 * 3_600_000);

  const [creneaux, espaces] = await Promise.all([
    base()
      .from("creneaux_disponibles")
      .select("id, espace_id, debut")
      .eq("type", "team_building")
      .eq("libre", true)
      .gte("debut", de.toISOString())
      .lt("debut", a.toISOString()),
    compterEspacesActifs(),
  ]);

  // Une panne n'est pas une indisponibilité : voir `verifierCreneau`.
  if (creneaux.error) throw creneaux.error;
  if (espaces === 0) return [];

  const duJour = (creneaux.data ?? []).filter(
    (c): c is { id: string; espace_id: string; debut: string } =>
      Boolean(c.id && c.espace_id && c.debut) && jourISO(new Date(c.debut as string)) === jour
  );

  /** Les créneaux d'une heure donnée, s'il y en a un libre par terrain actif. */
  const complets = (h: string): string[] | null => {
    const libres = duJour.filter((c) => heure(new Date(c.debut)) === h);
    const terrains = new Set(libres.map((c) => c.espace_id));
    return terrains.size >= espaces ? libres.map((c) => c.id) : null;
  };

  const matin = complets(PERIODES.matin.debut);
  const apresMidi = complets(PERIODES["apres-midi"].debut);

  if (periode === "matin") return matin ?? [];
  if (periode === "apres-midi") return apresMidi ?? [];
  return matin && apresMidi ? [...matin, ...apresMidi] : [];
}

/**
 * Nombre de terrains en service — ce qu'une privatisation doit tenir.
 *
 * Lu en base plutôt qu'écrit en dur : la Fun zone 3 ouvrira un jour, et la
 * privatisation devra alors la couvrir aussi, sans qu'on y pense.
 */
export async function compterEspacesActifs(): Promise<number> {
  const { count, error } = await base()
    .from("espaces")
    .select("id", { count: "exact", head: true })
    .eq("actif", true);
  if (error) throw error;
  return count ?? 0;
}

/**
 * Fait tenir à une demande tous ses créneaux, ou aucun.
 *
 * L'INSERTION EST UNE SEULE INSTRUCTION, DONC ATOMIQUE. Deux terrains pour une
 * demi-journée, quatre pour une journée : ils partent ensemble. Si un seul
 * vient d'être pris, aucun n'est tenu. Une privatisation à moitié tenue serait
 * pire qu'un refus — l'entreprise croirait avoir le complexe.
 *
 * C'EST LA BASE QUI TRANCHE. L'index unique partiel
 * `devis_creneaux_un_seul_actif_par_creneau` refuse qu'un créneau soit tenu
 * deux fois (23505). La clé étrangère refuse un créneau que Brahim vient de
 * SUPPRIMER (23503). Les deux veulent dire la même chose pour l'entreprise —
 * la place n'est plus disponible — et rendent `false`. Toute autre erreur
 * remonte.
 *
 * PUIS ON RELIT, parce que l'index ne voit pas tout : il ne sait rien de
 * l'ouverture du créneau, et Brahim peut le FERMER entre la lecture et cette
 * écriture. Si l'un manque dans `creneaux_disponibles`, on relâche tout.
 */
export async function tenirCreneauxDevis(demandeId: string, ids: string[]): Promise<boolean> {
  if (ids.length === 0) return false;

  const { error } = await base()
    .from("devis_creneaux")
    .insert(ids.map((creneau_id) => ({ demande_id: demandeId, creneau_id })));

  if (error) {
    if (error.code === VIOLATION_UNICITE || error.code === VIOLATION_CLE_ETRANGERE) return false;
    throw error;
  }

  const { data: encoreOuverts, error: eRelu } = await base()
    .from("creneaux_disponibles")
    .select("id")
    .in("id", ids);
  if (eRelu) throw eRelu;

  if ((encoreOuverts ?? []).length === ids.length) return true;

  const { error: eRelache } = await base()
    .from("devis_creneaux")
    .delete()
    .eq("demande_id", demandeId);
  if (eRelache) throw eRelache;
  return false;
}

/**
 * Retire une demande qui n'a pu tenir aucun créneau.
 *
 * Elle vient d'être écrite, n'a déclenché aucun e-mail et ne tient rien :
 * la garder ferait apparaître au back-office une demande pour une place que
 * l'entreprise n'a pas obtenue — et qu'on lui dit à l'écran de rechoisir.
 */
export async function supprimerDemandeDevis(id: string): Promise<void> {
  // La suppression emporte ses éventuelles lignes `devis_creneaux` (cascade).
  const { error } = await base().from("demandes_devis").delete().eq("id", id);
  if (error) {
    // Deux échecs d'affilée : on ne peut plus rien réparer d'ici. Le message
    // nomme la demande pour que Brahim la retrouve et la refuse à la main.
    console.error(`Demande de devis ${id} orpheline, non supprimée :`, error.message);
  }
}
