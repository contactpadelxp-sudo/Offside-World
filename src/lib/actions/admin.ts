"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { base } from "@/lib/supabase/server";
import { journaliser, sessionCourante, type Session } from "@/lib/admin/session";
import {
  SaisieInvalide,
  booleen,
  entier,
  jour,
  lignes,
  montantEnCents,
  texte,
  texteFacultatif,
  uuid,
} from "@/lib/saisie";
import { lireRecapEmail } from "@/lib/db/backoffice";
import { envoyer } from "@/lib/email/envoi";
import {
  auClientReservationAnnulee,
  auClientReservationConfirmee,
} from "@/lib/email/modeles";
import type { StatutDevis } from "@/lib/db/backoffice";

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

export async function annulerReservation(id: string): Promise<Resultat> {
  const session = await garde();
  if (!session) return REFUS_SESSION;

  try {
    const cible = uuid(id, "Réservation");

    const { data, error } = await base()
      .from("reservations")
      .update({ statut: "annulee" })
      .eq("id", cible)
      .in("statut", ["en_attente", "confirmee"])
      .select("reference, statut")
      .maybeSingle();

    if (error) throw error;
    if (!data) return { ok: false, message: "Cette réservation est déjà annulée." };

    await journaliser(session, "reservation.annulee", data.reference);
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
      message: `Réservation ${data.reference} annulée, le créneau est libéré. Le client en est informé par e-mail.`,
    };
  } catch (e) {
    return echec(e);
  }
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

const STATUTS_DEVIS: StatutDevis[] = [
  "nouvelle",
  "traitee",
  "devis_envoye",
  "acceptee",
  "refusee",
];

export async function changerStatutDevis(id: string, statut: string): Promise<Resultat> {
  const session = await garde();
  if (!session) return REFUS_SESSION;

  try {
    const cible = uuid(id, "Demande");
    if (!STATUTS_DEVIS.includes(statut as StatutDevis)) {
      return { ok: false, message: "Statut inconnu." };
    }

    const { data, error } = await base()
      .from("demandes_devis")
      .update({ statut: statut as StatutDevis })
      .eq("id", cible)
      .select("reference")
      .maybeSingle();

    if (error) throw error;
    if (!data) return { ok: false, message: "Demande introuvable." };

    await journaliser(session, "devis.statut", data.reference, { statut });
    rafraichir();
    return { ok: true, message: "Statut mis à jour." };
  } catch (e) {
    return echec(e);
  }
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

    const total = (anniversaire.data ?? 0) + (bubble.data ?? 0);
    await journaliser(session, "creneaux.generes", null, { du: debut, au: fin, crees: total });
    rafraichir();

    return {
      ok: true,
      message:
        total > 0
          ? `${total} créneau${total > 1 ? "x" : ""} ouvert${total > 1 ? "s" : ""}.`
          : "Aucun nouveau créneau : la période était déjà ouverte.",
    };
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
