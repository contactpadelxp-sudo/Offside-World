"use server";

import { revalidatePath } from "next/cache";
import { base } from "@/lib/supabase/server";
import { journaliser, sessionCourante, type Session } from "@/lib/admin/session";
import { SaisieInvalide, jour, texteFacultatif, uuid } from "@/lib/saisie";
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
    // L'annulation retire la ligne de l'index unique partiel : le créneau
    // redevient réservable immédiatement.
    return { ok: true, message: `Réservation ${data.reference} annulée, le créneau est libéré.` };
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
