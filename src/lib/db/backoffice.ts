import "server-only";
import { base, baseConfiguree } from "@/lib/supabase/server";
import { heure, jourISO, jourLisible, jourLisibleCap } from "@/lib/temps";
import { lireOptions } from "@/lib/db/referentiel";

/**
 * Lectures du back-office.
 *
 * Tout ce qui sort d'ici contient des données personnelles — dont des données
 * de mineurs et de santé. L'accès est fermé par la session vérifiée dans le
 * gabarit du back-office, et les pages ne sont ni mises en cache ni indexables.
 */

export type StatutReservation = "en_attente" | "confirmee" | "annulee" | "expiree";
export type StatutDevis = "nouvelle" | "traitee" | "devis_envoye" | "acceptee" | "refusee";

export interface ReservationAdmin {
  id: string;
  reference: string;
  type: "anniversaire" | "bubble";
  statut: StatutReservation;
  /** en euros */
  total: number;
  formuleNom: string | null;
  nbEnfants: number | null;
  enfantPrenom: string | null;
  enfantAge: number | null;
  nbPersonnes: number | null;
  options: string[];
  clientNom: string;
  clientEmail: string;
  clientTelephone: string;
  allergies: string | null;
  remarques: string | null;
  noteInterne: string | null;
  jour: string;
  jourLabel: string;
  debut: string;
  fin: string;
  espaceNom: string | null;
  /** Vrai si le créneau est déjà passé : on n'y propose plus d'action. */
  passee: boolean;
}

export interface DevisAdmin {
  id: string;
  reference: string;
  entreprise: string;
  contactNom: string;
  contactEmail: string;
  contactTelephone: string;
  dateSouhaitee: string | null;
  periode: string | null;
  nbParticipants: number | null;
  message: string | null;
  noteInterne: string | null;
  statut: StatutDevis;
  recuLe: string;
}

export interface EntreeJournal {
  id: number;
  acteur: string;
  action: string;
  cible: string | null;
  detail: string | null;
  quand: string;
}

export interface CreneauAdmin {
  id: string;
  type: "anniversaire" | "bubble";
  espaceNom: string;
  jour: string;
  jourLabel: string;
  debut: string;
  fin: string;
  ouvert: boolean;
  /** Référence de la réservation active, si le créneau est pris. */
  reservePar: string | null;
}

export type FiltreReservations = "a-venir" | "a-confirmer" | "passees" | "annulees";

const LIBELLES_ACTION: Record<string, string> = {
  connexion: "Connexion",
  deconnexion: "Déconnexion",
  "reservation.confirmee": "Réservation confirmée",
  "reservation.annulee": "Réservation annulée",
  "reservation.note": "Note interne modifiée",
  "devis.statut": "Statut de devis modifié",
  "devis.note": "Note interne modifiée",
  "creneau.ouvert": "Créneau rouvert",
  "creneau.ferme": "Créneau fermé",
  "creneaux.generes": "Créneaux générés",
};

/** Réservations, filtrées selon ce que le back-office affiche. */
export async function lireReservations(filtre: FiltreReservations): Promise<ReservationAdmin[]> {
  if (!baseConfiguree()) return [];

  const maintenant = new Date();
  let requete = base().from("reservations_detaillees").select("*");

  switch (filtre) {
    case "a-venir":
      requete = requete
        .in("statut", ["en_attente", "confirmee"])
        .gte("debut", maintenant.toISOString())
        .order("debut");
      break;
    case "a-confirmer":
      requete = requete
        .eq("statut", "en_attente")
        .gte("debut", maintenant.toISOString())
        .order("debut");
      break;
    case "passees":
      requete = requete
        .in("statut", ["en_attente", "confirmee"])
        .lt("debut", maintenant.toISOString())
        .order("debut", { ascending: false })
        .limit(100);
      break;
    case "annulees":
      requete = requete
        .in("statut", ["annulee", "expiree"])
        .order("debut", { ascending: false })
        .limit(100);
      break;
  }

  const [{ data, error }, options] = await Promise.all([requete, lireOptions()]);

  if (error || !data) {
    console.error("Lecture des réservations impossible :", error?.message);
    return [];
  }

  const libelles = new Map(options.map((o) => [o.id, o.libelle]));

  const sortie: ReservationAdmin[] = [];
  for (const r of data) {
    // Les colonnes d'une vue sont typées « nullable » : on écarte les lignes
    // dont l'ossature manque plutôt que d'afficher des trous.
    if (!r.id || !r.reference || !r.type || !r.statut || !r.debut || !r.fin) continue;
    const debut = new Date(r.debut);
    sortie.push({
      id: r.id,
      reference: r.reference,
      type: r.type,
      statut: r.statut,
      total: (r.total_cents ?? 0) / 100,
      formuleNom: r.formule_nom,
      nbEnfants: r.nb_enfants,
      enfantPrenom: r.enfant_prenom,
      enfantAge: r.enfant_age,
      nbPersonnes: r.nb_personnes,
      options: (r.options_ids ?? []).map((id) => libelles.get(id) ?? id),
      clientNom: r.client_nom ?? "",
      clientEmail: r.client_email ?? "",
      clientTelephone: r.client_telephone ?? "",
      allergies: r.allergies,
      remarques: r.remarques,
      noteInterne: r.note_interne,
      jour: jourISO(debut),
      jourLabel: jourLisibleCap(debut),
      debut: heure(debut),
      fin: heure(new Date(r.fin)),
      espaceNom: r.espace_nom,
      passee: debut < maintenant,
    });
  }
  return sortie;
}

/** Nombre de réservations encore à confirmer — sert la pastille de navigation. */
export async function compterAConfirmer(): Promise<number> {
  if (!baseConfiguree()) return 0;
  const { count, error } = await base()
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq("statut", "en_attente");
  if (error) return 0;
  return count ?? 0;
}

export async function lireDevis(inclureTraites = false): Promise<DevisAdmin[]> {
  if (!baseConfiguree()) return [];

  const statuts: StatutDevis[] = inclureTraites
    ? ["nouvelle", "traitee", "devis_envoye", "acceptee", "refusee"]
    : ["nouvelle", "traitee", "devis_envoye"];

  const { data, error } = await base()
    .from("demandes_devis")
    .select("*")
    .in("statut", statuts)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    console.error("Lecture des demandes de devis impossible :", error?.message);
    return [];
  }

  return data.map((d) => ({
    id: d.id,
    reference: d.reference,
    entreprise: d.entreprise,
    contactNom: d.contact_nom,
    contactEmail: d.contact_email,
    contactTelephone: d.contact_telephone,
    dateSouhaitee: d.date_souhaitee ? jourLisibleCap(new Date(`${d.date_souhaitee}T12:00:00Z`)) : null,
    periode: d.periode === "matin" ? "Matin" : d.periode === "apres-midi" ? "Après-midi" : null,
    nbParticipants: d.nb_participants,
    message: d.message,
    noteInterne: d.note_interne,
    statut: d.statut,
    recuLe: jourLisible(new Date(d.created_at)),
  }));
}

export async function compterDevisANouveau(): Promise<number> {
  if (!baseConfiguree()) return 0;
  const { count, error } = await base()
    .from("demandes_devis")
    .select("id", { count: "exact", head: true })
    .eq("statut", "nouvelle");
  if (error) return 0;
  return count ?? 0;
}

/**
 * Créneaux d'une journée, ouverts comme fermés, avec l'indication de ceux qui
 * portent déjà une réservation active — c'est ce qui interdit de les fermer.
 */
export async function lireCreneauxDuJour(jour: string): Promise<CreneauAdmin[]> {
  if (!baseConfiguree()) return [];

  // Bornes de la journée en heure de Bruxelles, converties en instants.
  const debutJour = new Date(`${jour}T00:00:00`);
  const finJour = new Date(`${jour}T23:59:59.999`);

  const { data, error } = await base()
    .from("creneaux")
    .select("id, type, espace_id, debut, fin, ouvert, espaces(nom)")
    .gte("debut", debutJour.toISOString())
    .lte("debut", finJour.toISOString())
    .order("debut");

  if (error || !data) {
    console.error("Lecture des créneaux impossible :", error?.message);
    return [];
  }
  if (data.length === 0) return [];

  const { data: prises } = await base()
    .from("reservations")
    .select("creneau_id, reference")
    .in("statut", ["en_attente", "confirmee"])
    .in(
      "creneau_id",
      data.map((c) => c.id)
    );

  const parCreneau = new Map((prises ?? []).map((r) => [r.creneau_id, r.reference]));

  return data.map((c) => {
    const debut = new Date(c.debut);
    return {
      id: c.id,
      type: c.type,
      espaceNom: c.espaces?.nom ?? c.espace_id,
      jour: jourISO(debut),
      jourLabel: jourLisibleCap(debut),
      debut: heure(debut),
      fin: heure(new Date(c.fin)),
      ouvert: c.ouvert,
      reservePar: parCreneau.get(c.id) ?? null,
    };
  });
}

/** Journal des actions du back-office, les plus récentes d'abord. */
export async function lireJournal(limite = 150): Promise<EntreeJournal[]> {
  if (!baseConfiguree()) return [];

  const { data, error } = await base()
    .from("journal_admin")
    .select("id, acteur, action, cible, detail, created_at")
    .order("created_at", { ascending: false })
    .limit(limite);

  if (error || !data) {
    console.error("Lecture du journal impossible :", error?.message);
    return [];
  }

  return data.map((e) => {
    const quand = new Date(e.created_at);
    return {
      id: e.id,
      acteur: e.acteur,
      action: LIBELLES_ACTION[e.action] ?? e.action,
      cible: e.cible,
      detail: e.detail ? JSON.stringify(e.detail) : null,
      quand: `${jourLisibleCap(quand)} à ${heure(quand)}`,
    };
  });
}
