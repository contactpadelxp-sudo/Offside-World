import "server-only";
import { base, baseConfiguree } from "@/lib/supabase/server";
import { heure, jourISO, jourLisible } from "@/lib/temps";
import { lireOptions } from "@/lib/db/referentiel";

/**
 * Lectures du back-office.
 *
 * Tout ce qui sort d'ici contient des données personnelles — dont des données
 * de mineurs et de santé. L'accès à /admin est fermé par une authentification
 * dans `src/proxy.ts`, et la page n'est ni mise en cache ni indexable.
 */

export interface ReservationAdmin {
  id: string;
  reference: string;
  type: "anniversaire" | "bubble";
  statut: "en_attente" | "confirmee" | "annulee" | "expiree";
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
  jour: string;
  jourLabel: string;
  debut: string;
  fin: string;
  espaceNom: string | null;
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
  statut: string;
  recuLe: string;
}

/** Réservations à venir, les plus proches d'abord. */
export async function lireReservationsAVenir(jours = 14): Promise<ReservationAdmin[]> {
  if (!baseConfiguree()) return [];

  const maintenant = new Date();
  const limite = new Date(maintenant.getTime() + jours * 86_400_000);

  const [{ data, error }, options] = await Promise.all([
    base()
      .from("reservations_detaillees")
      .select("*")
      .in("statut", ["en_attente", "confirmee"])
      .gte("debut", maintenant.toISOString())
      .lt("debut", limite.toISOString())
      .order("debut"),
    lireOptions(),
  ]);

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
      jour: jourISO(debut),
      jourLabel: jourLisible(debut),
      debut: heure(debut),
      fin: heure(new Date(r.fin)),
      espaceNom: r.espace_nom,
    });
  }
  return sortie;
}

/** Demandes de devis encore à traiter. */
export async function lireDevisEnAttente(): Promise<DevisAdmin[]> {
  if (!baseConfiguree()) return [];

  const { data, error } = await base()
    .from("demandes_devis")
    .select("*")
    .in("statut", ["nouvelle", "traitee", "devis_envoye"])
    .order("created_at", { ascending: false })
    .limit(30);

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
    dateSouhaitee: d.date_souhaitee ? jourLisible(new Date(`${d.date_souhaitee}T12:00:00Z`)) : null,
    periode: d.periode === "matin" ? "Matin" : d.periode === "apres-midi" ? "Après-midi" : null,
    nbParticipants: d.nb_participants,
    message: d.message,
    statut: d.statut,
    recuLe: jourLisible(new Date(d.created_at)),
  }));
}
