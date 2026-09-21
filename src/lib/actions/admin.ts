"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { base } from "@/lib/supabase/server";
import { journaliser, sessionCourante, type Session } from "@/lib/admin/session";
import {
  SaisieInvalide,
  booleen,
  email,
  entier,
  jour,
  lignes,
  montantEnCents,
  texte,
  texteFacultatif,
  uuid,
} from "@/lib/saisie";
import { autoriser } from "@/lib/limiteur";
import { lireRecapEmail } from "@/lib/db/backoffice";
import { diagnosticEmail, envoyer, envoyerEnRemontantLErreur } from "@/lib/email/envoi";
import {
  auClientDevisPropose,
  auClientRemboursement,
  auClientReservationAnnulee,
  auClientReservationConfirmee,
  emailDeTest,
} from "@/lib/email/modeles";
import { lignesDepuisJson, obstaclesEnvoi, totalDevisCents } from "@/lib/devis";
import { heuresAvant, jourLisibleCap } from "@/lib/temps";
import { AGE_MINIMUM } from "@/data/reglement";
import { genererDevisPdf } from "@/lib/devis-pdf";
import type { FormuleAdmin, OptionAdmin, SaisieDevis } from "@/lib/vues";
import {
  montantARembourser,
  paiementRemboursable,
  rembourser,
  type ChoixRemboursement,
} from "@/lib/paiement/remboursement";
import { montantLisible } from "@/lib/tarification";
import { paiementVivantSur } from "@/lib/db/paiements";

/**
 * Modifications du back-office.
 *
 * CHAQUE ACTION REVÉRIFIE LA SESSION. Le proxy redirige les visiteurs sans
 * cookie, mais une Server Action reste une URL publique : elle est appelable
 * directement, sans passer par la page. La documentation de Next le dit
 * explicitement — un changement de `matcher` peut retirer silencieusement la
 * couverture du proxy, l'autorisation doit donc être refaite ici.
 *
 * CHAQUE ACTION LAISSE UNE TRACE. Ces réservations contiennent des données
 * d'enfants et de santé : savoir qui a confirmé, annulé ou annoté quoi n'est
 * pas un confort, c'est une obligation.
 *
 * CHAQUE ACTION VÉRIFIE L'ÉTAT DE DÉPART. Confirmer une réservation déjà
 * annulée, ou fermer un créneau qui porte une réservation, doit échouer — pas
 * réussir à moitié.
 */

export interface Resultat {
  ok: boolean;
  message?: string;
}

/**
 * Ce que rend `envoyerDevis`, jeton de concurrence compris.
 *
 * La fiche doit repartir de l'horodatage RÉELLEMENT écrit, sinon un second
 * envoi légitime depuis le même onglet se ferait refuser comme périmé alors
 * que c'est cet onglet-là qui vient d'envoyer.
 */
export interface ResultatEnvoiDevis extends Resultat {
  /** L'horodatage d'envoi après l'opération. Absent si rien n'a changé. */
  envoyeLe?: string;
}

const REFUS_SESSION: Resultat = {
  ok: false,
  message: "Session expirée. Reconnectez-vous.",
};

const ERREUR_GENERIQUE = "L'opération a échoué. Réessayez.";

/** Vérifie la session ; retourne `null` si elle n'est plus valable. */
async function garde(): Promise<Session | null> {
  return sessionCourante();
}

function echec(e: unknown): Resultat {
  if (e instanceof SaisieInvalide) return { ok: false, message: e.message };
  console.error("Back-office :", e);
  return { ok: false, message: ERREUR_GENERIQUE };
}

/** Le back-office est entièrement dynamique : on rafraîchit tout son espace. */
function rafraichir(): void {
  revalidatePath("/admin", "layout");
}

// ── Réservations ─────────────────────────────────────────────────────────────

/**
 * Ce qu'on répond quand un paiement est en train de se jouer sur le créneau.
 *
 * La phrase dit l'attente et sa durée : l'exploitant n'a rien à faire, et il
 * doit pouvoir le lire sans se demander si la fiche est cassée.
 */
const REFUS_PAIEMENT_EN_COURS: Resultat = {
  ok: false,
  message:
    "Un paiement est en cours sur cette réservation : attendez qu'il aboutisse ou " +
    "qu'il expire (30 minutes au plus), puis rafraîchissez la page.",
};

export async function confirmerReservation(id: string): Promise<Resultat> {
  const session = await garde();
  if (!session) return REFUS_SESSION;

  try {
    const cible = uuid(id, "Réservation");

    /*
      CONFIRMER PENDANT UN PAIEMENT COUPE LE WEBHOOK.

      `confirmerPaiement` conditionne son écriture à `statut = "en_attente"` —
      c'est ce qui la rend idempotente face aux relivraisons de Stripe. Une
      confirmation manuelle passée entre-temps fait sortir la réservation de ce
      statut : le webhook ne trouve plus rien à confirmer, et l'e-mail au
      client ne part jamais. Il a payé, et n'a aucune trace de sa réservation.

      Le back-office masque déjà le bouton, mais un onglet ouvert avant le début
      du paiement l'affiche encore : c'est ici que la garde compte.
    */
    if (await paiementVivantSur(cible)) return REFUS_PAIEMENT_EN_COURS;

    // `eq("statut", "en_attente")` fait la vérification d'état ET la mise à
    // jour en une seule instruction : deux clics simultanés ne peuvent pas
    // confirmer deux fois.
    const { data, error } = await base()
      .from("reservations")
      .update({ statut: "confirmee" })
      .eq("id", cible)
      .eq("statut", "en_attente")
      .select("reference")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return { ok: false, message: "Cette réservation n'est plus en attente de confirmation." };
    }

    await journaliser(session, "reservation.confirmee", data.reference);
    rafraichir();

    // Le client doit l'apprendre. L'envoi a lieu après la réponse : le
    // back-office ne reste pas bloqué sur le fournisseur d'e-mails.
    after(async () => {
      const recap = await lireRecapEmail(cible);
      if (recap?.clientEmail) await envoyer(auClientReservationConfirmee(recap));
    });

    return { ok: true, message: `Réservation ${data.reference} confirmée.` };
  } catch (e) {
    return echec(e);
  }
}

/**
 * Annule une réservation, et rend l'argent si l'exploitant l'a décidé.
 *
 * LE CHOIX EST EXPLICITE, LE MONTANT NE L'EST PAS. Le navigateur envoie
 * « integral », « bareme » ou « aucun » ; le serveur relit le paiement et
 * l'heure du créneau, et recalcule lui-même la somme. Accepter un montant
 * transmis par le client rendrait le remboursement pilotable depuis la console
 * du navigateur — sur de l'argent réel.
 *
 * LE REMBOURSEMENT A LIEU AVANT L'E-MAIL, et pas dans `after()` : le message
 * annonce ce qui a été rendu, il faut donc que ce soit fait. L'exploitant, lui,
 * doit savoir tout de suite si Stripe a refusé — c'est à lui de rattraper à la
 * main, et le message de retour le lui dit.
 */
export async function annulerReservation(
  id: string,
  remboursement: ChoixRemboursement = "aucun"
): Promise<Resultat> {
  const session = await garde();
  if (!session) return REFUS_SESSION;

  try {
    const cible = uuid(id, "Réservation");
    const choix = choixRemboursement(remboursement);

    /*
      ANNULER PENDANT UN PAIEMENT REND À LA VENTE UN CRÉNEAU DÉJÀ PAYÉ.

      L'annulation retire la ligne de l'index unique partiel : le créneau
      redevient réservable à la seconde. Si le webhook arrive juste après, la
      réservation est annulée, l'argent encaissé, et le créneau peut avoir été
      repris par quelqu'un d'autre entre-temps. Trente minutes d'attente au
      pire coûtent infiniment moins qu'une double réservation un samedi.
    */
    if (await paiementVivantSur(cible)) return REFUS_PAIEMENT_EN_COURS;

    // Lu AVANT la mise à jour : il faut l'heure du créneau pour appliquer le
    // barème, et la vue reste lisible après, mais autant tout tenir d'un coup.
    const { data: avant } = await base()
      .from("reservations_detaillees")
      .select("debut")
      .eq("id", cible)
      .maybeSingle();

    const { data, error } = await base()
      .from("reservations")
      .update({ statut: "annulee" })
      .eq("id", cible)
      .in("statut", ["en_attente", "confirmee"])
      .select("reference, statut")
      .maybeSingle();

    if (error) throw error;
    if (!data) return { ok: false, message: "Cette réservation est déjà annulée." };

    await journaliser(session, "reservation.annulee", data.reference, { remboursement: choix });

    let phraseArgent = "";
    let avertissement = "";
    const paiement = choix === "aucun" ? null : await paiementRemboursable(cible);
    if (paiement) {
      /*
        SANS LA DATE DU CRÉNEAU, ON NE CALCULE PAS LE BARÈME — ON REFUSE.

        Le repli valait `0` heure, ce qui plaçait l'annulation dans le dernier
        palier : « moins de 48 heures, aucun remboursement ». Si la lecture du
        créneau échouait, le client ne touchait donc rien, et Brahim lisait
        « Le barème ne prévoit aucun remboursement à cette date » — une réponse
        fausse, présentée comme le résultat normal du barème.

        Un remboursement intégral, lui, ne dépend pas de la date : il reste
        possible. Seul le barème exige de savoir quand tombe l'activité.
      */
      if (choix === "bareme" && !avant?.debut) {
        return {
          ok: false,
          message:
            "Impossible de lire la date du créneau : le barème ne peut pas être appliqué " +
            "sans elle. Réessayez, ou choisissez « remboursement intégral » ou « aucun ».",
        };
      }
      // Le calcul vit dans `lib/temps.ts`, où il est testé : unité, signe,
      // fuseau et changement d'heure. Voir `heuresAvant`.
      const delai = avant?.debut ? heuresAvant(avant.debut) : 0;
      const montant = montantARembourser(paiement, choix, delai);
      const resultat = await rembourser(paiement, montant);
      if (resultat.erreur) {
        avertissement = ` ${resultat.erreur}`;
      } else if (resultat.montantCents > 0) {
        phraseArgent = ` ${montantLisible(resultat.montantCents)} remboursés.`;
        await journaliser(session, "paiement.rembourse", data.reference, {
          montant_cents: resultat.montantCents,
        });
      } else {
        phraseArgent = " Le barème ne prévoit aucun remboursement à cette date.";
      }
    }

    rafraichir();

    /*
      L'E-MAIL PART ICI, ATTENDU, ET PAS DANS `after()`.

      Annuler sans prévenir le client, c'est le laisser venir pour rien — et
      quand de l'argent a été rendu, c'est le laisser sans trace écrite de ce
      remboursement. Cet e-mail n'est donc pas un accessoire.

      Il partait auparavant en tâche de fond, et `envoyer()` avalait ses
      erreurs : le message de retour affirmait « Le client en est informé par
      e-mail » sans rien en savoir. Brahim pouvait donc lire une confirmation
      rassurante alors que personne n'avait été prévenu — exactement le cas où
      il aurait fallu décrocher son téléphone.

      On attend l'envoi et on DIT CE QUI S'EST PASSÉ. Le coût est de quelques
      centaines de millisecondes sur un écran d'administration où l'on vient de
      cliquer « Oui, annuler » : c'est le bon endroit pour attendre. Le webhook
      Stripe, lui, garde `after()` — là, une réponse lente fait tout réessayer.
    */
    const recap = await lireRecapEmail(cible);
    let phraseClient: string;
    if (!recap?.clientEmail) {
      phraseClient = " ⚠ Aucune adresse e-mail pour ce client : prévenez-le vous-même.";
    } else {
      const envoi = await envoyer(auClientReservationAnnulee(recap));
      phraseClient = envoi.ok
        ? " Le client en est informé par e-mail."
        : " ⚠ L'e-mail au client N'EST PAS parti : prévenez-le vous-même.";
    }

    // L'annulation retire la ligne de l'index unique partiel : le créneau
    // redevient réservable immédiatement.
    return {
      ok: true,
      message:
        `Réservation ${data.reference} annulée, le créneau est libéré.${phraseArgent}` +
        `${phraseClient}${avertissement}`,
    };
  } catch (e) {
    return echec(e);
  }
}

/**
 * Rembourse une réservation SANS CHANGER SON STATUT.
 *
 * LE CAS QUE ÇA COUVRE, ET POURQUOI IL FALLAIT LE COUVRIR. Jusqu'ici, rendre
 * de l'argent n'était possible qu'à la seconde exacte de l'annulation : passé
 * ce moment, plus aucun bouton. Brahim qui annule en cochant « aucun
 * remboursement », puis dont le client rappelle et s'explique, n'avait plus
 * que le tableau de bord Stripe — où le montant serait parti sans jamais être
 * écrit dans notre base. La fiche aurait continué d'afficher « 0 € remboursé »,
 * et l'historique aurait été faux.
 *
 * Les garanties sont exactement celles de l'annulation, parce que c'est le même
 * code dessous : le navigateur envoie un CHOIX, jamais un montant ; le serveur
 * relit le paiement et la date du créneau et recalcule ; le cumul déjà rendu
 * plafonne l'opération, donc un double clic ne rend pas deux fois.
 *
 * La réservation garde son statut : rembourser n'est pas annuler. Une
 * réservation confirmée et honorée peut être remboursée — un geste commercial,
 * un incident — sans que le créneau ne soit rendu à la vente.
 */
export async function rembourserReservation(
  id: string,
  remboursement: ChoixRemboursement
): Promise<Resultat> {
  const session = await garde();
  if (!session) return REFUS_SESSION;

  try {
    const cible = uuid(id, "Réservation");
    const choix = choixRemboursement(remboursement);
    if (choix === "aucun") {
      return { ok: false, message: "Choisissez ce qui doit être rendu au client." };
    }

    const paiement = await paiementRemboursable(cible);
    if (!paiement) {
      return {
        ok: false,
        message:
          "Aucun paiement remboursable sur cette réservation : rien n'a été encaissé en ligne, " +
          "ou tout a déjà été rendu.",
      };
    }

    const { data: creneau } = await base()
      .from("reservations_detaillees")
      .select("debut, reference")
      .eq("id", cible)
      .maybeSingle();

    // Même refus que pour l'annulation : sans la date, le barème placerait
    // l'opération dans le dernier palier et ne rendrait rien, en silence.
    if (choix === "bareme" && !creneau?.debut) {
      return {
        ok: false,
        message:
          "Impossible de lire la date du créneau : le barème ne peut pas être appliqué " +
          "sans elle. Réessayez, ou choisissez « remboursement intégral ».",
      };
    }

    const montant = montantARembourser(
      paiement,
      choix,
      creneau?.debut ? heuresAvant(creneau.debut) : 0
    );
    if (montant <= 0) {
      return {
        ok: false,
        message: "Le barème ne prévoit aucun remboursement à cette date. Rien n'a été envoyé.",
      };
    }

    const resultat = await rembourser(paiement, montant);
    if (resultat.erreur) return { ok: false, message: resultat.erreur };

    await journaliser(session, "paiement.rembourse", creneau?.reference ?? cible, {
      montant_cents: resultat.montantCents,
      hors_annulation: true,
    });
    rafraichir();

    const recap = await lireRecapEmail(cible);
    let phraseClient: string;
    if (!recap?.clientEmail) {
      phraseClient = " ⚠ Aucune adresse e-mail pour ce client : prévenez-le vous-même.";
    } else {
      const envoi = await envoyer(auClientRemboursement(recap, resultat.montantCents));
      phraseClient = envoi.ok
        ? " Le client en est informé par e-mail."
        : " ⚠ L'e-mail au client N'EST PAS parti : prévenez-le vous-même.";
    }

    return {
      ok: true,
      message: `${montantLisible(resultat.montantCents)} remboursés.${phraseClient}`,
    };
  } catch (e) {
    return echec(e);
  }
}

/** Le choix vient du navigateur : on n'accepte que les trois valeurs prévues. */
function choixRemboursement(v: unknown): ChoixRemboursement {
  return v === "integral" || v === "bareme" ? v : "aucun";
}

export async function enregistrerNoteReservation(id: string, note: string): Promise<Resultat> {
  const session = await garde();
  if (!session) return REFUS_SESSION;

  try {
    const cible = uuid(id, "Réservation");
    const contenu = texteFacultatif(note, "Note", { max: 2000 });

    const { data, error } = await base()
      .from("reservations")
      .update({ note_interne: contenu })
      .eq("id", cible)
      .select("reference")
      .maybeSingle();

    if (error) throw error;
    if (!data) return { ok: false, message: "Réservation introuvable." };

    await journaliser(session, "reservation.note", data.reference, { vide: contenu === null });
    rafraichir();
    return { ok: true, message: "Note enregistrée." };
  } catch (e) {
    return echec(e);
  }
}

// ── Demandes de devis ────────────────────────────────────────────────────────

/**
 * Le devis : on l'enregistre, puis on l'envoie.
 *
 * POURQUOI LES CINQ BOUTONS D'ÉTAT ONT DISPARU. Le back-office proposait
 * « Prise en charge », « Devis envoyé », « Acceptée » et « Refusée » : des
 * cases que l'exploitant cochait pour se souvenir de ce qu'il avait fait. Un
 * état déclaratif ne prouve rien — rien ne garantissait qu'un devis marqué
 * « envoyé » l'ait été, ni l'inverse. Et le devis lui-même n'existait nulle
 * part : il fallait le rédiger ailleurs, l'envoyer ailleurs, puis revenir
 * cocher.
 *
 * Désormais l'envoi ÉCRIT son horodatage. L'état se lit, il ne se déclare plus.
 */

/** Enregistre le brouillon, sans rien envoyer. */
export async function enregistrerDevis(id: string, devis: SaisieDevis): Promise<Resultat> {
  const session = await garde();
  if (!session) return REFUS_SESSION;

  try {
    const cible = uuid(id, "Demande");
    const propre = nettoyerDevis(devis);

    const { data, error } = await base()
      .from("demandes_devis")
      .update({
        devis_lignes: propre.lignes,
        devis_message: propre.message || null,
        devis_validite: propre.validite || null,
        devis_tva_pourcent: propre.tvaPourcent,
        client_adresse: propre.clientAdresse || null,
        client_tva: propre.clientTva || null,
      })
      .eq("id", cible)
      .select("reference")
      .maybeSingle();

    if (error) throw error;
    if (!data) return { ok: false, message: "Demande introuvable." };

    await journaliser(session, "devis.enregistre", data.reference);
    rafraichir();
    return { ok: true, message: "Devis enregistré." };
  } catch (e) {
    return echec(e);
  }
}

/**
 * Envoie le devis au client, puis note qu'il est parti.
 *
 * TROIS TEMPS, DANS CET ORDRE : on enregistre le devis rédigé, on réserve
 * l'envoi, on envoie.
 *
 * 1. ENREGISTRER D'ABORD. Si la suite échoue, le devis rédigé est conservé et
 *    l'exploitant peut réessayer sans tout retaper.
 *
 * 2. RÉSERVER ENSUITE, et c'est la seule façon d'empêcher un double envoi.
 *    L'action ne lisait jamais `devis_envoye_le` : deux écrans ouverts sur la
 *    même demande envoyaient deux PDF portant LA MÊME RÉFÉRENCE, des montants
 *    différents et deux dates d'émission, les deux se présentant comme l'offre
 *    en cours. Lequel engage le complexe ? La question ne doit pas se poser.
 *
 *    Une simple lecture suivie d'une comparaison ne suffirait pas : entre la
 *    lecture et l'écriture il y a le PDF et le fournisseur d'e-mails, soit
 *    plusieurs secondes, et deux clics partis dans cet intervalle passeraient
 *    tous les deux. L'écriture est donc conditionnée, dans la même instruction,
 *    à l'horodatage que la fiche avait sous les yeux (`vuEnvoyeLe`). La base
 *    arbitre : le premier pose son horodatage, le second ne trouve plus rien à
 *    mettre à jour et s'arrête avant de fabriquer quoi que ce soit.
 *
 *    Un « déjà envoyé, je refuse » serait faux dans l'autre sens : renvoyer un
 *    devis corrigé après un appel du client est une opération normale. C'est
 *    bien l'écart entre l'écran et la base qu'on refuse, pas le renvoi.
 *
 * 3. ENVOYER, ET DÉFAIRE LA RÉSERVATION SI RIEN N'EST PARTI. L'horodatage
 *    précède donc l'envoi réel — on renonce ici à « mesurer plutôt que
 *    déclarer » — mais en échange l'ancien cas « parti chez le client, état non
 *    enregistré », celui qui faisait renvoyer un devis déjà reçu, ne peut plus
 *    se produire.
 *
 * `envoyerEnRemontantLErreur` et non `envoyer` : ailleurs dans le projet un
 * e-mail raté est avalé pour ne jamais faire échouer une réservation. Ici c'est
 * le contraire — l'envoi EST l'action demandée, et l'exploitant doit savoir si
 * elle a échoué, sans quoi il attendrait une réponse à un devis jamais parti.
 */
export async function envoyerDevis(
  id: string,
  devis: SaisieDevis,
  /**
   * L'horodatage d'envoi que la fiche avait sous les yeux, brut. `null` si
   * elle voyait une demande jamais envoyée. `undefined` n'est pas accepté :
   * ce serait un appelant qui ne sait pas, et on ne devine pas sur un document
   * commercial.
   */
  vuEnvoyeLe: string | null
): Promise<ResultatEnvoiDevis> {
  const session = await garde();
  if (!session) return REFUS_SESSION;

  try {
    const cible = uuid(id, "Demande");
    const propre = nettoyerDevis(devis);

    // Revalidé côté serveur : le navigateur a déjà affiché ces obstacles, mais
    // une Server Action reste une URL publique et son appelant n'est pas
    // forcément l'écran qu'on a écrit.
    const obstacles = obstaclesEnvoi(propre);
    if (obstacles.length > 0) {
      return { ok: false, message: `Il manque ${obstacles.join(", ")}.` };
    }

    const { data, error } = await base()
      .from("demandes_devis")
      .update({
        devis_lignes: propre.lignes,
        devis_message: propre.message || null,
        devis_validite: propre.validite,
        devis_tva_pourcent: propre.tvaPourcent,
        client_adresse: propre.clientAdresse || null,
        client_tva: propre.clientTva || null,
      })
      .eq("id", cible)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    if (!data) return { ok: false, message: "Demande introuvable." };

    /*
      ON RÉSERVE L'ENVOI AVANT D'ENVOYER, ET C'EST LA SEULE FAÇON DE L'EMPÊCHER
      DEUX FOIS.

      Une simple lecture de `devis_envoye_le` suivie d'une comparaison ne suffit
      pas : entre la lecture et l'écriture finale il y a l'enregistrement des
      lignes, la fabrication du PDF et le fournisseur d'e-mails — plusieurs
      secondes. Deux clics partis dans cet intervalle lisent tous deux « jamais
      envoyé », passent tous deux, et le client reçoit deux PDF portant la même
      référence avec deux dates d'émission. Brahim travaille sur deux écrans ;
      « j'ai tapé sur le téléphone, je n'ai rien vu bouger, j'ai recliqué au
      comptoir » suffit.

      L'écriture est donc conditionnée à l'état lu par la fiche, dans la même
      instruction que la mise à jour (`update … where devis_envoye_le = vu`).
      C'est la base qui arbitre : le premier des deux appels pose son
      horodatage, le second ne trouve plus rien à mettre à jour et s'arrête
      AVANT de fabriquer quoi que ce soit.

      ON RENONCE DONC À « MESURER PLUTÔT QUE DÉCLARER ». L'horodatage précédait
      l'envoi réel ; en échange, un envoi raté le défait juste après (voir plus
      bas), et l'ancien cas « parti mais non enregistré » — celui qui faisait
      renvoyer un devis déjà chez le client — ne peut plus se produire du tout.
    */
    const envoyeLe = new Date().toISOString();
    const reservation = base()
      .from("demandes_devis")
      .update({ devis_envoye_le: envoyeLe, statut: "devis_envoye" })
      .eq("id", cible);
    // `is` pour `null`, `eq` sinon : en SQL `= NULL` n'est jamais vrai, et la
    // condition se déroberait exactement sur le cas le plus fréquent — un
    // devis jamais encore envoyé.
    const { data: reserve, error: eReservation } = await (vuEnvoyeLe
      ? reservation.eq("devis_envoye_le", vuEnvoyeLe)
      : reservation.is("devis_envoye_le", null)
    )
      .select("id")
      .maybeSingle();

    if (eReservation) throw eReservation;
    if (!reserve) {
      return {
        ok: false,
        message:
          "Ce devis vient d'être envoyé depuis un autre écran. Rien n'est parti en double. " +
          "Rafraîchissez la page pour voir la version envoyée : si vous voulez vraiment en " +
          "expédier une nouvelle, relancez l'envoi depuis la page à jour.",
      };
    }

    /**
     * Défait la réservation d'envoi quand rien n'est parti.
     *
     * `eq` sur notre propre horodatage : si quelqu'un d'autre a repris la main
     * entre-temps, ce n'est plus à nous de remettre quoi que ce soit.
     */
    const relacher = async () => {
      const { error: eRelache } = await base()
        .from("demandes_devis")
        .update({ devis_envoye_le: vuEnvoyeLe, statut: data.statut })
        .eq("id", cible)
        .eq("devis_envoye_le", envoyeLe);
      if (eRelache) console.error("Libération du devis réservé impossible :", eRelache.message);
      return !eRelache;
    };

    /*
      LE PDF EST GÉNÉRÉ AVANT L'ENVOI, ET SON ÉCHEC ARRÊTE TOUT. Envoyer un
      e-mail annonçant « le devis est joint en PDF » sans la pièce jointe
      serait pire que de ne rien envoyer : le client chercherait un fichier
      absent et croirait à une erreur de sa messagerie.
    */
    try {
      const pdf = await genererDevisPdf({
        reference: data.reference,
        emisLe: jourLisibleCap(new Date()),
        validiteLisible: jourLisibleCap(new Date(`${propre.validite}T12:00:00Z`)),
        client: {
          entreprise: data.entreprise,
          contactNom: data.contact_nom,
          contactEmail: data.contact_email,
          adresse: propre.clientAdresse,
          tva: propre.clientTva,
        },
        lignes: propre.lignes,
        tvaPourcent: propre.tvaPourcent,
        motDIntroduction: propre.message,
      });

      await envoyerEnRemontantLErreur(
        auClientDevisPropose({
          reference: data.reference,
          entreprise: data.entreprise,
          contactNom: data.contact_nom,
          contactEmail: data.contact_email,
          contactTelephone: data.contact_telephone,
          dateSouhaitee: data.date_souhaitee ?? "",
          periode: data.periode ?? "",
          nbParticipants: data.nb_participants ?? 0,
          lignes: propre.lignes,
          motDIntroduction: propre.message,
          validiteLisible: jourLisibleCap(new Date(`${propre.validite}T12:00:00Z`)),
          tvaPourcent: propre.tvaPourcent,
          pdf,
        })
      );
    } catch (eEnvoi) {
      /*
        RIEN N'EST PARTI : ON REND LA MAIN. Sans ça, la réservation posée
        juste avant ferait croire à un devis envoyé — la fiche dirait « Devis
        envoyé », et personne n'attendrait plus rien d'un document qui n'a
        jamais quitté le serveur.

        Si même la libération échoue, on le dit : c'est le seul cas où
        l'horodatage ment, et l'exploitant doit le savoir pour renvoyer.
      */
      const rendu = await relacher();
      const detail = eEnvoi instanceof Error ? eEnvoi.message : String(eEnvoi);
      console.error("Envoi du devis :", eEnvoi);
      return {
        ok: false,
        message: rendu
          ? `Refusé par le fournisseur : ${detail.slice(0, 300)}`
          : `Le devis n'est PAS parti (${detail.slice(0, 200)}) et la fiche a pu rester marquée ` +
            "« Devis envoyé ». Rafraîchissez, vérifiez l'état, et renvoyez-le.",
      };
    }

    await journaliser(session, "devis.envoye", data.reference, {
      montant_cents: totalDevisCents(propre.lignes),
    });
    rafraichir();
    return { ok: true, message: `Devis envoyé à ${data.contact_email}.`, envoyeLe };
  } catch (e) {
    if (e instanceof SaisieInvalide) return { ok: false, message: e.message };
    const detail = e instanceof Error ? e.message : String(e);
    console.error("Envoi du devis :", e);
    return { ok: false, message: `Refusé par le fournisseur : ${detail.slice(0, 300)}` };
  }
}

/**
 * Remet en forme ce que le navigateur a envoyé.
 *
 * Les lignes viennent d'un formulaire : ni leur nombre, ni leur contenu, ni
 * leurs types ne sont garantis. On borne, on tronque, on écarte l'illisible —
 * et on plafonne le nombre de lignes, faute de quoi un appel forgé pourrait
 * écrire un document de plusieurs mégaoctets dans la base.
 */
function nettoyerDevis(d: SaisieDevis) {
  const lignes = lignesDepuisJson(d.lignes)
    .slice(0, 30)
    .map((l) => ({
      designation: l.designation.slice(0, 200),
      quantite: Math.min(9999, Math.max(0, l.quantite)),
      prixUnitaireCents: Math.min(100_000_000, Math.max(0, l.prixUnitaireCents)),
    }));
  const validite = /^\d{4}-\d{2}-\d{2}$/.test(d.validite ?? "") ? d.validite : "";
  // Le taux vient d'une liste fermée à l'écran, mais une Server Action reste
  // une URL publique : on reborne. `null` est conservé tel quel — « non
  // renseigné » n'est pas « exonéré ».
  const brut = Number(d.tvaPourcent);
  const tvaPourcent =
    d.tvaPourcent === null || !Number.isFinite(brut) ? null : Math.min(25, Math.max(0, Math.round(brut)));
  return {
    lignes,
    message: (d.message ?? "").slice(0, 2000),
    validite,
    tvaPourcent,
    clientAdresse: (d.clientAdresse ?? "").slice(0, 300),
    clientTva: (d.clientTva ?? "").slice(0, 40),
  };
}

export async function enregistrerNoteDevis(id: string, note: string): Promise<Resultat> {
  const session = await garde();
  if (!session) return REFUS_SESSION;

  try {
    const cible = uuid(id, "Demande");
    const contenu = texteFacultatif(note, "Note", { max: 2000 });

    const { data, error } = await base()
      .from("demandes_devis")
      .update({ note_interne: contenu })
      .eq("id", cible)
      .select("reference")
      .maybeSingle();

    if (error) throw error;
    if (!data) return { ok: false, message: "Demande introuvable." };

    await journaliser(session, "devis.note", data.reference, { vide: contenu === null });
    rafraichir();
    return { ok: true, message: "Note enregistrée." };
  } catch (e) {
    return echec(e);
  }
}

// ── Créneaux ─────────────────────────────────────────────────────────────────

/** Contrainte d'exclusion PostgreSQL : deux créneaux ouverts se chevauchent. */
const VIOLATION_EXCLUSION = "23P01";

export async function basculerCreneau(id: string, ouvrir: boolean): Promise<Resultat> {
  const session = await garde();
  if (!session) return REFUS_SESSION;

  try {
    const cible = uuid(id, "Créneau");

    /*
      ON FERME D'ABORD, ON REGARDE ENSUITE — ET C'EST L'INVERSE DE CE QUI SE
      FAISAIT.

      La vérification « ce créneau porte-t-il une réservation ? » précédait la
      fermeture. Entre les deux, un client pouvait réserver : la lecture
      répondait « libre », l'écriture fermait, et une place vendue disparaissait
      de la vente sans que rien ne le signale. Un samedi après-midi, c'est le
      moment exact où l'on ferme un créneau ET où l'on réserve.

      Dans l'ordre inverse, la fenêtre se referme presque entièrement : dès que
      le créneau est fermé, plus aucune réservation ne peut s'y engager, et
      celle qui vient de s'engager est retrouvée par la lecture qui suit — on
      rouvre alors et on refuse, ce qui est le résultat attendu.

      IL RESTE UNE FENÊTRE, ET ON NE PRÉTEND PAS LE CONTRAIRE : une réservation
      partie avant la fermeture mais validée après la lecture passerait encore.
      Elle est alors VISIBLE dans la liste du back-office, sur un créneau
      fermé — un état que Brahim peut constater et corriger, là où l'ancien
      ordre effaçait la place en silence. Supprimer complètement la fenêtre
      demande une fonction SQL prenant le verrou, ce qui est le prochain pas.
    */
    if (!ouvrir) {
      const { data: ferme, error: eFermeture } = await base()
        .from("creneaux")
        .update({ ouvert: false })
        .eq("id", cible)
        // `ouvert = true` : on ne veut retenir que le créneau que CET appel a
        // fermé. Sans ça, un créneau déjà fermé serait « rouvert » plus bas.
        .eq("ouvert", true)
        .select("id")
        .maybeSingle();

      if (eFermeture) throw eFermeture;
      if (!ferme) {
        const { data: existe } = await base()
          .from("creneaux")
          .select("ouvert")
          .eq("id", cible)
          .maybeSingle();
        if (!existe) return { ok: false, message: "Créneau introuvable." };
        /*
          `rafraichir()` MÊME ICI, ET SURTOUT ICI. La ligne affiche « Libre »
          par affichage optimiste ; sans revalidation, `useOptimistic` retombe
          sur la propriété inchangée et la ligne repasse à « Libre » sous un
          message vert de succès. On reclique, même résultat, indéfiniment.
          C'est précisément le cas où l'écran est en retard sur la base : c'est
          le moment de le remettre à jour, pas de s'en passer.
        */
        rafraichir();
        return { ok: true, message: "Ce créneau était déjà fermé." };
      }

      const { data: prise, error: ePrise } = await base()
        .from("reservations")
        .select("reference")
        .eq("creneau_id", cible)
        .in("statut", ["en_attente", "confirmee"])
        .maybeSingle();

      if (ePrise || prise) {
        // Une place vendue ne se retire pas de la vente. On remet le créneau
        // comme on l'a trouvé — et si même ça échoue, on le dit : un créneau
        // fermé qui porte une réservation doit être vu, pas deviné.
        const { error: eRetour } = await base()
          .from("creneaux")
          .update({ ouvert: true })
          .eq("id", cible);

        if (eRetour) {
          console.error("Réouverture après refus impossible :", eRetour.message);
          return {
            ok: false,
            message:
              "Ce créneau porte une réservation ET n'a pas pu être remis en vente. " +
              "Rouvrez-le à la main depuis cet écran.",
          };
        }
        if (ePrise) {
          console.error("Lecture des réservations du créneau impossible :", ePrise.message);
          return {
            ok: false,
            message:
              "Impossible de vérifier si ce créneau est réservé. Rien n'a été modifié : réessayez.",
          };
        }
        return {
          ok: false,
          message: `Impossible : la réservation ${prise!.reference} occupe ce créneau. Annulez-la d'abord.`,
        };
      }

      await journaliser(session, "creneau.ferme", cible);
      rafraichir();
      return { ok: true, message: "Créneau fermé." };
    }

    const { data, error } = await base()
      .from("creneaux")
      .update({ ouvert: ouvrir })
      .eq("id", cible)
      .select("id")
      .maybeSingle();

    if (error) {
      if (error.code === VIOLATION_EXCLUSION) {
        return {
          ok: false,
          message: "Impossible : un autre créneau ouvert chevauche déjà cet horaire.",
        };
      }
      throw error;
    }
    if (!data) return { ok: false, message: "Créneau introuvable." };

    // Ce chemin ne sert plus qu'à la RÉOUVERTURE : la fermeture est traitée
    // plus haut, dans l'ordre qui la rend sûre.
    await journaliser(session, "creneau.ouvert", cible);
    rafraichir();
    return { ok: true, message: "Créneau rouvert." };
  } catch (e) {
    return echec(e);
  }
}

/**
 * Prolonge l'horizon de réservation. Les fonctions de génération sont
 * idempotentes : rappeler sur une période déjà ouverte n'ajoute rien.
 */
export async function genererCreneaux(du: string, au: string): Promise<Resultat> {
  const session = await garde();
  if (!session) return REFUS_SESSION;

  try {
    const debut = jour(du, "Date de début", { maxJours: 400 });
    const fin = jour(au, "Date de fin", { maxJours: 400 });
    if (fin < debut) return { ok: false, message: "La date de fin précède la date de début." };

    const [anniversaire, bubble] = await Promise.all([
      base().rpc("generer_creneaux_anniversaire", { du: debut, au: fin }),
      base().rpc("generer_creneaux_bubble", { du: debut, au: fin }),
    ]);

    if (anniversaire.error) throw anniversaire.error;
    if (bubble.error) throw bubble.error;

    // Les deux fonctions renvoient une ligne unique : créés, déjà présents,
    // refusés pour chevauchement. Voir la migration 0014.
    //
    // `sansHoraire` n'existe que sur la fonction Bubble, depuis la migration
    // 0023. Il distingue deux zéros que rien ne séparait : « la période était
    // déjà ouverte » et « je n'ai aucun horaire à ouvrir ». C'est exactement la
    // confusion qui a laissé le Bubble Foot à zéro créneau sans que personne
    // ne le voie.
    const compte = (r: unknown) => {
      const ligne = Array.isArray(r) ? r[0] : r;
      const l = (ligne ?? {}) as Record<string, unknown>;
      const nombre = (v: unknown) => (typeof v === "number" ? v : 0);
      return {
        crees: nombre(l.crees),
        deja: nombre(l.deja_presents),
        refuses: nombre(l.refuses),
        sansHoraire: l.sans_horaire === true,
      };
    };
    const a = compte(anniversaire.data);
    const b = compte(bubble.data);
    const crees = a.crees + b.crees;
    const refuses = a.refuses + b.refuses;

    await journaliser(session, "creneaux.generes", null, {
      du: debut,
      au: fin,
      crees,
      refuses,
    });
    rafraichir();

    /*
      LES REFUS SONT DITS, ET C'EST TOUT L'INTÉRÊT DE CE BLOC. Auparavant la
      fonction ne renvoyait qu'un nombre de créations : un créneau refusé pour
      chevauchement comptait comme un créneau déjà présent, et l'écran
      annonçait « la période était déjà ouverte ». C'est ainsi que les Bubble
      Foot de 18 h et 19 h du week-end ont disparu sans que personne ne le
      sache — ils tombent pendant l'anniversaire de 17 h 30 à 19 h 30.
    */
    const phrases: string[] = [];
    if (crees > 0) {
      phrases.push(`${crees} créneau${crees > 1 ? "x" : ""} ouvert${crees > 1 ? "s" : ""}.`);
    }
    if (refuses > 0) {
      phrases.push(
        `${refuses} créneau${refuses > 1 ? "x" : ""} non ouvert${refuses > 1 ? "s" : ""} : ` +
          `${refuses > 1 ? "ils chevauchent" : "il chevauche"} un créneau existant dans le même espace.`
      );
    }
    if (phrases.length === 0) {
      phrases.push("Aucun nouveau créneau : la période était déjà ouverte.");
    }
    /*
      Dit à la fin, et même quand des anniversaires ont été ouverts : c'est
      précisément le cas où l'on croit avoir tout fait. Le bouton ouvre les
      deux activités d'un coup ; sans cette phrase, une période « ouverte »
      peut ne contenir aucun Bubble Foot.
    */
    if (b.sansHoraire) {
      phrases.push(
        "Aucun créneau Bubble Foot : ses horaires ne sont pas encore renseignés."
      );
    }

    return { ok: true, message: phrases.join(" ") };
  } catch (e) {
    return echec(e);
  }
}

// ── Tarifs ───────────────────────────────────────────────────────────────────

/**
 * Modification du référentiel tarifaire.
 *
 * Ce que Brahim écrit ici est ce que le serveur facturera : c'est la même table
 * que celle relue au moment d'enregistrer une réservation. D'où le bornage
 * strict de chaque champ, et la cohérence vérifiée entre eux — un forfait qui
 * couvrirait plus d'enfants que le maximum autorisé rendrait le maximum
 * inatteignable.
 *
 * Les réservations déjà enregistrées ne bougent pas : leur montant a été figé
 * au moment de l'écriture. Un changement de tarif ne vaut que pour la suite.
 */
/**
 * Ce que le formulaire de tarifs envoie.
 *
 * LES NOMBRES ARRIVENT EN TEXTE, comme les montants. Un champ de saisie
 * contient toujours du texte, y compris vide ; le convertir à chaque frappe
 * transformait un champ effacé en « 0 » — il fallait alors tout sélectionner
 * pour retaper. `entier()` et `montantEnCents()` font la conversion ICI, au
 * moment où l'on écrit en base, et refusent proprement une valeur absurde.
 */
export interface SaisieFormule {
  nom: string;
  accroche: string;
  description: string;
  prixBase: string;
  enfantsInclus: string | number;
  prixEnfantSup: string;
  enfantsMax: string | number;
  /** Vide ou absent = pas de limite d'âge. */
  ageMax?: string | number | null;
  dureeMinutes: string | number;
  inclus: string;
  actif: boolean;
}

/**
 * Ce que l'écran avait sous les yeux quand on a commencé à modifier.
 *
 * Exactement la forme rendue par `lireTarifsAdmin`, renvoyée telle quelle par
 * la fiche. Elle ne sert QU'À COMPARER : aucune de ces valeurs n'est écrite,
 * donc un appelant qui les truquerait ne pourrait que se faire refuser sa
 * propre modification.
 */
type SnapshotFormule = Omit<FormuleAdmin, "id">;

/**
 * La base porte-t-elle encore ce que l'écran croyait ?
 *
 * Comparaison en CENTIMES, jamais en euros : `lireTarifsAdmin` divise par 100
 * pour l'affichage, et comparer des flottants ferait échouer l'égalité sur des
 * montants parfaitement identiques.
 *
 * Tout écart, y compris un champ absent ou d'un type inattendu, répond
 * « changé ». C'est le sens sûr : on refuse l'écriture et on demande de
 * rafraîchir, au lieu d'écraser à l'aveugle.
 */
function formuleInchangee(
  actuel: {
    nom: string;
    accroche: string | null;
    description: string;
    prix_base_cents: number;
    enfants_inclus: number;
    prix_enfant_sup_cents: number;
    enfants_max: number;
    age_max: number | null;
    duree_minutes: number;
    inclus: string[];
    actif: boolean;
  },
  vu: SnapshotFormule
): boolean {
  if (!vu || !Array.isArray(vu.inclus)) return false;
  return (
    actuel.nom === vu.nom &&
    (actuel.accroche ?? "") === vu.accroche &&
    actuel.description === vu.description &&
    actuel.prix_base_cents === Math.round(Number(vu.prixBase) * 100) &&
    actuel.enfants_inclus === vu.enfantsInclus &&
    actuel.prix_enfant_sup_cents === Math.round(Number(vu.prixEnfantSup) * 100) &&
    actuel.enfants_max === vu.enfantsMax &&
    actuel.age_max === vu.ageMax &&
    actuel.duree_minutes === vu.dureeMinutes &&
    actuel.actif === vu.actif &&
    actuel.inclus.length === vu.inclus.length &&
    actuel.inclus.every((l, i) => l === vu.inclus[i])
  );
}

/**
 * Ce qu'on répond quand la fiche modifie une ligne qui a bougé ailleurs.
 *
 * Le mot « écrasé » est délibéré : c'est ce qui se passait, et l'exploitant
 * doit comprendre qu'on vient de l'éviter, pas qu'on a raté quelque chose.
 */
const REFUS_TARIF_PERIME: Resultat = {
  ok: false,
  message:
    "Cette ligne a été modifiée ailleurs depuis l'ouverture de cette page. Rien n'a été " +
    "écrasé. Rafraîchissez pour voir les valeurs à jour, puis refaites votre modification.",
};

export async function modifierFormule(
  id: string,
  saisie: SaisieFormule,
  /**
   * L'état que la fiche avait chargé. Sans lui, enregistrer depuis un onglet
   * resté ouvert réécrivait TOUTE la ligne avec des valeurs périmées : un prix
   * changé ailleurs revenait à l'ancien, sans un mot, et le site vendait au
   * mauvais tarif jusqu'à ce que quelqu'un s'en aperçoive.
   */
  vu: SnapshotFormule
): Promise<Resultat> {
  const session = await garde();
  if (!session) return REFUS_SESSION;

  try {
    const cible = texte(id, "Formule", { max: 60 });
    const nom = texte(saisie?.nom, "Nom", { min: 2, max: 60 });
    const accroche = texteFacultatif(saisie?.accroche, "Accroche", { max: 120, sauts: false });
    const description = texte(saisie?.description, "Description", { min: 10, max: 800, sauts: true });
    const prixBase = montantEnCents(saisie?.prixBase, "Prix de base", { max: 500_000 });
    const prixEnfantSup = montantEnCents(saisie?.prixEnfantSup, "Prix par participant supplémentaire", { max: 50_000 });
    const enfantsInclus = entier(saisie?.enfantsInclus, "Participants inclus", { min: 1, max: 100 });
    const enfantsMax = entier(saisie?.enfantsMax, "Participants maximum", { min: 1, max: 100 });

    /*
      UN CHAMP VIDE VEUT DIRE « PAS DE LIMITE », ET NON ZÉRO.

      C'est le réglage qui ouvre ou ferme un forfait aux adultes. Le distinguer
      de zéro est tout l'enjeu : `entier("")` vaudrait 0, ce qui interdirait la
      formule à tout le monde — l'exact contraire de ce que l'exploitant croit
      faire en effaçant le champ.
    */
    const ageBrut = saisie?.ageMax;
    const sansLimite =
      ageBrut === null || ageBrut === undefined || String(ageBrut).trim() === "";
    const ageMax = sansLimite
      ? null
      : entier(ageBrut, "Âge maximum", { min: AGE_MINIMUM, max: 120 });
    const dureeMinutes = entier(saisie?.dureeMinutes, "Durée", { min: 15, max: 600 });
    const inclus = lignes(saisie?.inclus, "Ce qui est compris");

    if (enfantsMax < enfantsInclus) {
      return {
        ok: false,
        message: "Le maximum de participants ne peut pas être inférieur au nombre inclus dans le forfait.",
      };
    }

    const { data: actuel, error: eLu } = await base()
      .from("formules")
      .select(
        "nom, accroche, description, prix_base_cents, enfants_inclus, prix_enfant_sup_cents, enfants_max, age_max, duree_minutes, inclus, actif"
      )
      .eq("id", cible)
      .maybeSingle();

    if (eLu) throw eLu;
    if (!actuel) return { ok: false, message: "Formule introuvable." };
    if (!formuleInchangee(actuel, vu)) return REFUS_TARIF_PERIME;

    const { data, error } = await base()
      .from("formules")
      .update({
        nom,
        accroche,
        description,
        prix_base_cents: prixBase,
        enfants_inclus: enfantsInclus,
        prix_enfant_sup_cents: prixEnfantSup,
        enfants_max: enfantsMax,
        age_max: ageMax,
        duree_minutes: dureeMinutes,
        inclus,
        actif: booleen(saisie?.actif),
      })
      .eq("id", cible)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) return { ok: false, message: "Formule introuvable." };

    await journaliser(session, "formule.modifiee", cible, {
      prix_base_cents: prixBase,
      prix_enfant_sup_cents: prixEnfantSup,
      actif: booleen(saisie?.actif),
    });
    rafraichir();
    // La page d'accueil est prérendue toutes les heures : on la régénère tout
    // de suite, sinon l'ancien tarif y resterait affiché jusqu'à une heure.
    revalidatePath("/");
    return { ok: true, message: "Formule enregistrée." };
  } catch (e) {
    return echec(e);
  }
}

export interface SaisieOption {
  libelle: string;
  description: string;
  prix: string;
  actif: boolean;
}

/** Voir `SnapshotFormule` : même rôle, mêmes garanties, pour une option. */
type SnapshotOption = Omit<OptionAdmin, "id">;

function optionInchangee(
  actuel: { libelle: string; description: string | null; prix_cents: number; actif: boolean },
  vu: SnapshotOption
): boolean {
  if (!vu) return false;
  return (
    actuel.libelle === vu.libelle &&
    (actuel.description ?? "") === vu.description &&
    actuel.prix_cents === Math.round(Number(vu.prix) * 100) &&
    actuel.actif === vu.actif
  );
}

export async function modifierOption(
  id: string,
  saisie: SaisieOption,
  /** L'état chargé par la fiche. Voir `modifierFormule`. */
  vu: SnapshotOption
): Promise<Resultat> {
  const session = await garde();
  if (!session) return REFUS_SESSION;

  try {
    const cible = texte(id, "Option", { max: 60 });
    const libelle = texte(saisie?.libelle, "Libellé", { min: 2, max: 80 });
    const description = texteFacultatif(saisie?.description, "Description", { max: 300 });
    const prix = montantEnCents(saisie?.prix, "Prix", { max: 100_000 });

    const { data: actuel, error: eLu } = await base()
      .from("options")
      .select("libelle, description, prix_cents, actif")
      .eq("id", cible)
      .maybeSingle();

    if (eLu) throw eLu;
    if (!actuel) return { ok: false, message: "Option introuvable." };
    if (!optionInchangee(actuel, vu)) return REFUS_TARIF_PERIME;

    const { data, error } = await base()
      .from("options")
      .update({ libelle, description, prix_cents: prix, actif: booleen(saisie?.actif) })
      .eq("id", cible)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) return { ok: false, message: "Option introuvable." };

    await journaliser(session, "option.modifiee", cible, {
      prix_cents: prix,
      actif: booleen(saisie?.actif),
    });
    rafraichir();
    revalidatePath("/");
    return { ok: true, message: "Option enregistrée." };
  } catch (e) {
    return echec(e);
  }
}

// ── Vérification de l'envoi d'e-mails ────────────────────────────────────────

/**
 * Envoie un e-mail de test.
 *
 * Il emprunte exactement le même chemin qu'un vrai message — même expéditeur,
 * même gabarit, même fournisseur : le réussir prouve donc quelque chose. Et
 * contrairement aux envois automatiques, l'échec est REMONTÉ ici plutôt
 * qu'avalé : c'est le seul cas où l'on veut voir l'erreur du fournisseur.
 *
 * Deux tests par tranche de cinq minutes : de quoi vérifier une configuration
 * sans transformer le back-office en outil d'envoi.
 */
export async function envoyerEmailTest(destinataire: string): Promise<Resultat> {
  const session = await garde();
  if (!session) return REFUS_SESSION;

  try {
    const adresse = email(destinataire, "Adresse de test");

    if (!autoriser(`test-email:${session.acteur}`, 2, 5 * 60_000)) {
      return { ok: false, message: "Deux tests par tranche de cinq minutes. Patientez un peu." };
    }

    const diagnostic = diagnosticEmail();
    if (!diagnostic.configure) {
      return {
        ok: false,
        message:
          "Aucun fournisseur d'e-mails configuré : renseignez RESEND_API_KEY et EMAIL_EXPEDITEUR dans Vercel, puis redéployez.",
      };
    }

    await envoyerEnRemontantLErreur(emailDeTest(adresse, session.acteur));
    await journaliser(session, "email.test", adresse);
    return { ok: true, message: `Message envoyé à ${adresse}. Vérifiez la boîte, et les indésirables.` };
  } catch (e) {
    if (e instanceof SaisieInvalide) return { ok: false, message: e.message };
    // Ici on montre l'erreur du fournisseur : c'est précisément ce qu'on cherche.
    const detail = e instanceof Error ? e.message : String(e);
    console.error("Test d'e-mail :", e);
    return { ok: false, message: `Refusé par le fournisseur : ${detail.slice(0, 300)}` };
  }
}

/**
 * Crée UN créneau, à la main.
 *
 * Il n'existait que « ouvrir une période », qui génère des dizaines de créneaux
 * d'après des règles écrites dans le SQL — celles qu'on a posées faute de
 * connaître les vrais horaires du complexe. Aucun moyen d'en ajouter un seul,
 * ni d'en corriger un. L'exploitant ne pouvait donc pas saisir SON planning :
 * il pouvait seulement régénérer le nôtre.
 *
 * L'heure est reçue telle qu'elle est saisie — « 2026-10-11 » et « 15:30 » —
 * et interprétée à Bruxelles, parce que c'est l'heure du complexe. Passer par
 * une chaîne ISO sans fuseau la ferait basculer d'une heure deux fois par an,
 * précisément aux périodes où l'on prépare la saison suivante.
 */
export async function creerCreneau(saisie: {
  jour: string;
  heure: string;
  dureeMinutes: number;
  espaceId: string;
  type: "anniversaire" | "bubble";
}): Promise<Resultat> {
  const session = await garde();
  if (!session) return REFUS_SESSION;

  try {
    const j = jour(saisie?.jour, "Date");
    const h = texte(saisie?.heure, "Heure", { min: 4, max: 5 });
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(h)) {
      return { ok: false, message: "L'heure doit s'écrire comme 15:30." };
    }
    const duree = entier(saisie?.dureeMinutes, "Durée", { min: 15, max: 600 });
    const espaceId = texte(saisie?.espaceId, "Espace", { min: 1, max: 40 });
    const type = saisie?.type;
    if (type !== "anniversaire" && type !== "bubble") {
      return { ok: false, message: "Choisissez le type d'activité." };
    }

    /*
      LE CALCUL DE L'HORAIRE EST FAIT PAR POSTGRES, PAS PAR NOUS.

      `(timestamp) at time zone 'Europe/Brussels'` est exactement ce qu'emploie
      la génération automatique (migration 0014) : les deux chemins produisent
      donc le même instant pour le même horaire affiché, y compris la nuit des
      changements d'heure. Le refaire en JavaScript aurait introduit une
      deuxième vérité.
    */
    const { data, error } = await base()
      .rpc("creer_creneau", {
        p_espace: espaceId,
        p_type: type,
        p_jour: j,
        p_heure: h,
        p_duree_minutes: duree,
      })
      .single();

    if (error) {
      if (error.code === VIOLATION_EXCLUSION) {
        return {
          ok: false,
          message: "Un créneau ouvert occupe déjà cet horaire dans cet espace.",
        };
      }
      throw error;
    }

    await journaliser(session, "creneau.cree", String(data));
    rafraichir();
    return { ok: true, message: "Créneau ajouté." };
  } catch (e) {
    return echec(e);
  }
}

/**
 * Supprime un créneau.
 *
 * Différent de « fermer » : fermer retire de la vente en gardant la trace,
 * supprimer efface. On supprime ce qui n'aurait jamais dû exister — un créneau
 * généré au mauvais horaire —, on ferme ce qui existe mais ne se vend pas ce
 * jour-là.
 *
 * Un créneau qui porte une réservation, MÊME ANNULÉE, n'est jamais supprimé :
 * la ligne de réservation le référence, et avec elle le paiement, le
 * remboursement et le journal. Effacer le créneau ferait disparaître l'horaire
 * d'une vente passée.
 */
export async function supprimerCreneau(id: string): Promise<Resultat> {
  const session = await garde();
  if (!session) return REFUS_SESSION;

  try {
    const cible = uuid(id, "Créneau");

    const { data: liee } = await base()
      .from("reservations")
      .select("reference, statut")
      .eq("creneau_id", cible)
      .limit(1)
      .maybeSingle();

    if (liee) {
      return {
        ok: false,
        message: `Impossible : la réservation ${liee.reference} porte ce créneau. Fermez-le plutôt que de le supprimer.`,
      };
    }

    const { data, error } = await base()
      .from("creneaux")
      .delete()
      .eq("id", cible)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) return { ok: false, message: "Créneau introuvable." };

    await journaliser(session, "creneau.supprime", cible);
    rafraichir();
    return { ok: true, message: "Créneau supprimé." };
  } catch (e) {
    return echec(e);
  }
}

/**
 * Ferme ou rouvre TOUS les créneaux d'une journée.
 *
 * UN JOUR DE FERMETURE SE FERMAIT CRÉNEAU PAR CRÉNEAU. L'écran annonce
 * pourtant l'usage — « Fermer retire de la vente en gardant le créneau — un
 * tournoi, un jour de fermeture » — mais ne donnait aucun geste à l'échelle de
 * la journée. Un vendredi férié coûte six clics, un samedi douze, et il faut
 * penser à revenir les rouvrir. Personne ne le fait : le 25 décembre 2026 et
 * le 1er janvier 2027 étaient encore en vente au moment d'écrire ceci.
 *
 * LES CRÉNEAUX RÉSERVÉS NE SONT PAS TOUCHÉS, et c'est dit. Fermer une place
 * déjà vendue reviendrait à la retirer sous le client sans l'en avertir — ce
 * que `basculerCreneau` refuse déjà un par un. Ici on ne peut pas refuser
 * l'opération entière pour un seul créneau pris : on écarte celui-là, on fait
 * le reste, et on nomme la réservation en cause pour que l'exploitant sache
 * qu'il lui reste un appel à passer.
 */
export async function basculerJournee(jourDemande: string, ouvrir: boolean): Promise<Resultat> {
  const session = await garde();
  if (!session) return REFUS_SESSION;

  try {
    const cible = jour(jourDemande, "Jour");

    /*
      Mêmes bornes que `lireCreneauxDuJour` : la journée est celle de Bruxelles,
      pas celle d'UTC. Sans cela, fermer le 25 décembre laisserait ouvert le
      créneau de 23 h — qui est encore le 25 chez nous et déjà le 26 en UTC.
    */
    const debutJour = new Date(`${cible}T00:00:00`);
    const finJour = new Date(`${cible}T23:59:59.999`);

    if (ouvrir) {
      const { data, error } = await base()
        .from("creneaux")
        .update({ ouvert: true })
        .gte("debut", debutJour.toISOString())
        .lte("debut", finJour.toISOString())
        .eq("ouvert", false)
        .select("id");

      if (error) {
        // Un créneau ajouté depuis peut occuper la même plage dans le même
        // espace, et la contrainte d'exclusion refuse.
        if (error.code === VIOLATION_EXCLUSION) {
          return {
            ok: false,
            message:
              "Réouverture impossible : un créneau ouvert chevauche déjà l'un de ceux-ci. " +
              "Rouvrez-les un par un pour voir lequel.",
          };
        }
        throw error;
      }

      const touches = data?.length ?? 0;
      if (touches === 0) return { ok: false, message: "Aucun créneau fermé ce jour-là." };

      await journaliser(session, "creneaux.journee_ouverte", null, {
        jour: cible,
        creneaux: touches,
      });
      rafraichir();
      return {
        ok: true,
        message: `${touches} créneau${touches > 1 ? "x" : ""} rouvert${touches > 1 ? "s" : ""}.`,
      };
    }

    /*
      FERMETURE : ON FERME D'ABORD, ON REGARDE ENSUITE.

      La lecture des réservations précédait l'écriture. Entre les deux, un
      client pouvait réserver l'un de ces créneaux : la lecture le disait
      libre, l'écriture le fermait, et une place vendue disparaissait de la
      vente sans que rien ne le signale. Le bouton « fermer la journée » sert
      justement les jours chargés.

      Fermées d'abord, les places ne peuvent plus s'engager ; celles qui
      venaient de s'engager sont retrouvées juste après et rouvertes une à une.
      Voir `basculerCreneau` pour la fenêtre résiduelle, identique ici : une
      réservation validée après la lecture resterait visible sur un créneau
      fermé — un état constatable, là où l'ancien ordre effaçait la place en
      silence.
    */
    const { data: fermes, error: eFermeture } = await base()
      .from("creneaux")
      .update({ ouvert: false })
      .gte("debut", debutJour.toISOString())
      .lte("debut", finJour.toISOString())
      // Seuls ceux que CET appel a fermés : un créneau déjà fermé ne doit pas
      // pouvoir être rouvert par le rattrapage ci-dessous.
      .eq("ouvert", true)
      .select("id");

    if (eFermeture) throw eFermeture;
    if (!fermes || fermes.length === 0) {
      return { ok: false, message: "Aucun créneau ouvert ce jour-là." };
    }

    const ids = fermes.map((c) => c.id);

    const { data: prises, error: erreurPrises } = await base()
      .from("reservations")
      .select("creneau_id, reference")
      .in("statut", ["en_attente", "confirmee"])
      .in("creneau_id", ids);

    /*
      SI LA LECTURE ÉCHOUE, ON REMET TOUT COMME C'ÉTAIT — ET ON VÉRIFIE QUE
      ÇA S'EST FAIT.

      Garder la journée fermée sans savoir ce qu'elle portait reviendrait à
      retirer de la vente des places peut-être vendues. Mais la réouverture ne
      peut pas être lancée sans regarder son résultat : elle part vers la MÊME
      base que la lecture qui vient d'échouer, donc dans la même panne. Sans
      ce contrôle, `throw` menait à `echec()`, qui affiche « L'opération a
      échoué. Réessayez. » — c'est-à-dire « rien n'a bougé », alors qu'un
      samedi entier venait de sortir de la vente, sans journal et sans un mot.

      C'est le seul endroit du fichier où une écriture de rattrapage ignorait
      son erreur ; sa jumelle `basculerCreneau` la vérifie déjà.
    */
    if (erreurPrises) {
      console.error("Lecture des réservations de la journée impossible :", erreurPrises.message);
      const { error: eRetourTotal } = await base()
        .from("creneaux")
        .update({ ouvert: true })
        .in("id", ids);

      if (eRetourTotal) {
        console.error("Réouverture de la journée impossible :", eRetourTotal.message);
        return {
          ok: false,
          message:
            `Les ${ids.length} créneaux de cette journée ont été fermés, mais la vérification ` +
            "des réservations a échoué ET ils n'ont pas pu être rouverts. La journée est " +
            "actuellement retirée de la vente : rouvrez-la dès que possible depuis cet écran.",
        };
      }

      return {
        ok: false,
        message:
          "Impossible de vérifier quelles réservations occupent cette journée. Les créneaux " +
          "ont été remis comme ils étaient : rien n'a changé. Réessayez.",
      };
    }

    const occupes = new Map((prises ?? []).map((r) => [r.creneau_id, r.reference]));

    if (occupes.size > 0) {
      const { error: eRetour } = await base()
        .from("creneaux")
        .update({ ouvert: true })
        .in("id", [...occupes.keys()]);

      if (eRetour) {
        console.error("Réouverture des créneaux réservés impossible :", eRetour.message);
        const refs = [...new Set(occupes.values())].join(", ");
        return {
          ok: false,
          message:
            `La journée a été fermée, mais ${occupes.size > 1 ? "les créneaux réservés" : "le créneau réservé"} ` +
            `(${refs}) n'${occupes.size > 1 ? "ont" : "a"} pas pu être remis en vente. Rouvrez-${occupes.size > 1 ? "les" : "le"} à la main.`,
        };
      }
    }

    const touches = ids.length - occupes.size;
    await journaliser(session, "creneaux.journee_fermee", null, {
      jour: cible,
      creneaux: touches,
    });
    rafraichir();

    const phrases = [
      `${touches} créneau${touches > 1 ? "x" : ""} fermé${touches > 1 ? "s" : ""}.`,
    ];
    if (occupes.size > 0) {
      const refs = [...new Set(occupes.values())].join(", ");
      phrases.push(
        `${occupes.size} créneau${occupes.size > 1 ? "x" : ""} laissé${occupes.size > 1 ? "s" : ""} ouvert${occupes.size > 1 ? "s" : ""} : ` +
          `${occupes.size > 1 ? "les réservations" : "la réservation"} ${refs} ${occupes.size > 1 ? "les occupent" : "l'occupe"}.`
      );
    }
    return { ok: true, message: phrases.join(" ") };
  } catch (e) {
    return echec(e);
  }
}

/**
 * Change l'état d'une demande de team building.
 *
 * IL N'Y AVAIT AUCUN MOYEN DE CLORE UNE DEMANDE. Le seul changement d'état
 * possible était l'envoi du devis, qui la passe à « devis envoyé ». Un client
 * qui refuse, ou qui ne répond jamais, laissait donc sa demande dans la liste
 * active pour toujours — et la liste proposait « voir aussi les demandes
 * closes » alors que rien ne pouvait en clore une.
 *
 * Les états ne sont PAS libres : on ne peut pas prétendre qu'un devis a été
 * envoyé, seul l'envoi réel l'écrit. Ici on ne fait que constater la réponse
 * du client, ou ranger une demande traitée autrement — par téléphone, par
 * exemple, ce qui est le cas le plus courant pour du team building.
 */
export async function changerStatutDevis(
  id: string,
  statut: "nouvelle" | "traitee" | "acceptee" | "refusee"
): Promise<Resultat> {
  const session = await garde();
  if (!session) return REFUS_SESSION;

  try {
    const cible = uuid(id, "Demande");
    if (!["nouvelle", "traitee", "acceptee", "refusee"].includes(statut)) {
      return { ok: false, message: "État inconnu." };
    }

    const { data, error } = await base()
      .from("demandes_devis")
      .update({ statut })
      .eq("id", cible)
      .select("reference")
      .maybeSingle();

    if (error) throw error;
    if (!data) return { ok: false, message: "Demande introuvable." };

    await journaliser(session, "devis.statut", data.reference, { statut });
    rafraichir();
    return { ok: true, message: "État mis à jour." };
  } catch (e) {
    return echec(e);
  }
}

/**
 * Sort une demande close et la remet dans l'état qui la décrit vraiment.
 *
 * LA FICHE ET LE SERVEUR NE DISAIENT PAS LA MÊME CHOSE. « Rouvrir la demande »
 * affichait aussitôt « Devis envoyé » puis appelait `changerStatutDevis` avec
 * « traitee » : la pastille passait de « Devis envoyé » à « Prise en charge »
 * une seconde plus tard, sans que rien n'explique le recul. Et la fiche
 * perdait l'information la plus utile de l'écran — ce client a bien reçu un
 * devis.
 *
 * Le détour venait d'une bonne règle mal appliquée : `changerStatutDevis`
 * refuse « devis_envoye » pour qu'on ne puisse pas prétendre qu'un devis est
 * parti. La règle tient toujours — ici ce n'est pas le navigateur qui décide,
 * c'est `devis_envoye_le` en base, c'est-à-dire la trace d'un envoi réel. Le
 * serveur la lit lui-même ; l'appelant n'a rien à proposer.
 */
export async function rouvrirDemandeDevis(id: string): Promise<Resultat> {
  const session = await garde();
  if (!session) return REFUS_SESSION;

  try {
    const cible = uuid(id, "Demande");

    const { data: etat, error: eLu } = await base()
      .from("demandes_devis")
      .select("devis_envoye_le")
      .eq("id", cible)
      .maybeSingle();

    if (eLu) throw eLu;
    if (!etat) return { ok: false, message: "Demande introuvable." };

    const statut = etat.devis_envoye_le ? "devis_envoye" : "nouvelle";

    const { data, error } = await base()
      .from("demandes_devis")
      .update({ statut })
      // Rouvrir n'a de sens que sur une demande close : sans cette condition,
      // un onglet périmé ramènerait à « nouvelle » une demande que quelqu'un
      // vient d'accepter.
      .eq("id", cible)
      .in("statut", ["acceptee", "refusee"])
      .select("reference")
      .maybeSingle();

    if (error) throw error;
    if (!data) return { ok: false, message: "Cette demande n'est pas close." };

    await journaliser(session, "devis.statut", data.reference, { statut });
    rafraichir();
    return { ok: true, message: "Demande rouverte." };
  } catch (e) {
    return echec(e);
  }
}
