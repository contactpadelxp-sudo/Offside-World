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
  auClientReservationAnnulee,
  auClientReservationConfirmee,
  emailDeTest,
} from "@/lib/email/modeles";
import {
  lignesDepuisJson,
  obstaclesEnvoi,
  totalDevisCents,
  type LigneDevis,
} from "@/lib/devis";
import { jourLisibleCap } from "@/lib/temps";
import {
  montantARembourser,
  paiementRemboursable,
  rembourser,
  type ChoixRemboursement,
} from "@/lib/paiement/remboursement";
import { montantLisible } from "@/lib/tarification";

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

export async function confirmerReservation(id: string): Promise<Resultat> {
  const session = await garde();
  if (!session) return REFUS_SESSION;

  try {
    const cible = uuid(id, "Réservation");

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
      const heuresAvant = avant?.debut
        ? (new Date(avant.debut).getTime() - Date.now()) / 3_600_000
        : 0;
      const montant = montantARembourser(paiement, choix, heuresAvant);
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

    // Annuler sans prévenir le client, c'est le laisser venir pour rien.
    after(async () => {
      const recap = await lireRecapEmail(cible);
      if (recap?.clientEmail) await envoyer(auClientReservationAnnulee(recap));
    });

    // L'annulation retire la ligne de l'index unique partiel : le créneau
    // redevient réservable immédiatement.
    return {
      ok: true,
      message:
        `Réservation ${data.reference} annulée, le créneau est libéré.${phraseArgent}` +
        ` Le client en est informé par e-mail.${avertissement}`,
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
export async function enregistrerDevis(
  id: string,
  devis: { lignes: LigneDevis[]; message: string; validite: string }
): Promise<Resultat> {
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
 * L'ORDRE COMPTE, et il est l'inverse de celui du remboursement. Ici on
 * ENREGISTRE d'abord, on envoie ensuite : si l'envoi échoue, le devis rédigé
 * est conservé et l'exploitant peut réessayer sans tout retaper. Et on n'écrit
 * l'horodatage d'envoi qu'APRÈS un envoi réussi — c'est tout l'intérêt de le
 * mesurer plutôt que de le déclarer.
 *
 * `envoyerEnRemontantLErreur` et non `envoyer` : ailleurs dans le projet un
 * e-mail raté est avalé pour ne jamais faire échouer une réservation. Ici c'est
 * le contraire — l'envoi EST l'action demandée, et l'exploitant doit savoir si
 * elle a échoué, sans quoi il attendrait une réponse à un devis jamais parti.
 */
export async function envoyerDevis(
  id: string,
  devis: { lignes: LigneDevis[]; message: string; validite: string }
): Promise<Resultat> {
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
      })
      .eq("id", cible)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    if (!data) return { ok: false, message: "Demande introuvable." };

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
      })
    );

    // Après l'envoi seulement.
    await base()
      .from("demandes_devis")
      .update({ devis_envoye_le: new Date().toISOString(), statut: "devis_envoye" })
      .eq("id", cible);

    await journaliser(session, "devis.envoye", data.reference, {
      montant_cents: totalDevisCents(propre.lignes),
    });
    rafraichir();
    return { ok: true, message: `Devis envoyé à ${data.contact_email}.` };
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
function nettoyerDevis(d: { lignes: LigneDevis[]; message: string; validite: string }) {
  const lignes = lignesDepuisJson(d.lignes)
    .slice(0, 30)
    .map((l) => ({
      designation: l.designation.slice(0, 200),
      quantite: Math.min(9999, Math.max(0, l.quantite)),
      prixUnitaireCents: Math.min(100_000_000, Math.max(0, l.prixUnitaireCents)),
    }));
  const validite = /^\d{4}-\d{2}-\d{2}$/.test(d.validite ?? "") ? d.validite : "";
  return { lignes, message: (d.message ?? "").slice(0, 2000), validite };
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

    // Fermer un créneau qui porte une réservation active reviendrait à retirer
    // de la vente une place déjà vendue : on refuse, et on dit laquelle.
    if (!ouvrir) {
      const { data: prise } = await base()
        .from("reservations")
        .select("reference")
        .eq("creneau_id", cible)
        .in("statut", ["en_attente", "confirmee"])
        .maybeSingle();

      if (prise) {
        return {
          ok: false,
          message: `Impossible : la réservation ${prise.reference} occupe ce créneau. Annulez-la d'abord.`,
        };
      }
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

    await journaliser(session, ouvrir ? "creneau.ouvert" : "creneau.ferme", cible);
    rafraichir();
    return { ok: true, message: ouvrir ? "Créneau rouvert." : "Créneau fermé." };
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
    const compte = (r: unknown) => {
      const ligne = Array.isArray(r) ? r[0] : r;
      const l = (ligne ?? {}) as Record<string, number>;
      return {
        crees: l.crees ?? 0,
        deja: l.deja_presents ?? 0,
        refuses: l.refuses ?? 0,
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
export interface SaisieFormule {
  nom: string;
  accroche: string;
  description: string;
  prixBase: string;
  enfantsInclus: number;
  prixEnfantSup: string;
  enfantsMax: number;
  dureeMinutes: number;
  inclus: string;
  actif: boolean;
}

export async function modifierFormule(id: string, saisie: SaisieFormule): Promise<Resultat> {
  const session = await garde();
  if (!session) return REFUS_SESSION;

  try {
    const cible = texte(id, "Formule", { max: 60 });
    const nom = texte(saisie?.nom, "Nom", { min: 2, max: 60 });
    const accroche = texteFacultatif(saisie?.accroche, "Accroche", { max: 120, sauts: false });
    const description = texte(saisie?.description, "Description", { min: 10, max: 800, sauts: true });
    const prixBase = montantEnCents(saisie?.prixBase, "Prix de base", { max: 500_000 });
    const prixEnfantSup = montantEnCents(saisie?.prixEnfantSup, "Prix par enfant supplémentaire", { max: 50_000 });
    const enfantsInclus = entier(saisie?.enfantsInclus, "Enfants inclus", { min: 1, max: 100 });
    const enfantsMax = entier(saisie?.enfantsMax, "Enfants maximum", { min: 1, max: 100 });
    const dureeMinutes = entier(saisie?.dureeMinutes, "Durée", { min: 15, max: 600 });
    const inclus = lignes(saisie?.inclus, "Ce qui est compris");

    if (enfantsMax < enfantsInclus) {
      return {
        ok: false,
        message: "Le maximum d'enfants ne peut pas être inférieur au nombre inclus dans le forfait.",
      };
    }

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

export async function modifierOption(id: string, saisie: SaisieOption): Promise<Resultat> {
  const session = await garde();
  if (!session) return REFUS_SESSION;

  try {
    const cible = texte(id, "Option", { max: 60 });
    const libelle = texte(saisie?.libelle, "Libellé", { min: 2, max: 80 });
    const description = texteFacultatif(saisie?.description, "Description", { max: 300 });
    const prix = montantEnCents(saisie?.prix, "Prix", { max: 100_000 });

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
