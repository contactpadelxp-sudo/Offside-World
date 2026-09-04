import "server-only";
import { base, baseConfiguree } from "@/lib/supabase/server";
import { heure, jourISO, jourLisible, jourLisibleCap } from "@/lib/temps";
import { lireOptions } from "@/lib/db/referentiel";
import type { Database } from "@/lib/supabase/types";
import type { RecapEmail } from "@/lib/email/modeles";
import type {
  CreneauAdmin,
  DevisAdmin,
  EntreeJournal,
  FiltreReservations,
  ReservationAdmin,
  StatutDevis,
} from "@/lib/vues";

export type * from "@/lib/vues";

/**
 * Lectures du back-office.
 *
 * Tout ce qui sort d'ici contient des données personnelles — dont des données
 * de mineurs et de santé. L'accès est fermé par la session vérifiée dans le
 * gabarit du back-office, et les pages ne sont ni mises en cache ni indexables.
 */

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
  "formule.modifiee": "Formule modifiée",
  "option.modifiee": "Option modifiée",
};

/**
 * Nettoie un terme de recherche avant de le passer à PostgREST.
 *
 * La syntaxe `or=(...)` utilise la virgule et les parenthèses comme
 * séparateurs : les laisser passer permettrait de réécrire le filtre. On ne
 * garde donc que ce qui peut réellement figurer dans une référence, un nom, un
 * e-mail ou un numéro.
 */
function termeRecherche(q: string): string {
  return q
    .normalize("NFC")
    .replace(/[^\p{L}\p{N} @._+-]/gu, " ")
    .trim()
    .slice(0, 80);
}

/**
 * Réservations, filtrées selon ce que le back-office affiche.
 *
 * Une recherche l'emporte sur le filtre : quand on cherche une référence, on
 * veut la trouver qu'elle soit à venir, passée ou annulée.
 */
export async function lireReservations(
  filtre: FiltreReservations,
  recherche?: string
): Promise<ReservationAdmin[]> {
  if (!baseConfiguree()) return [];

  const maintenant = new Date();
  let requete = base().from("reservations_detaillees").select("*");

  const terme = recherche ? termeRecherche(recherche) : "";
  if (terme) {
    const motif = `*${terme}*`;
    requete = requete
      .or(
        [
          `reference.ilike.${motif}`,
          `client_nom.ilike.${motif}`,
          `client_email.ilike.${motif}`,
          `client_telephone.ilike.${motif}`,
          `enfant_prenom.ilike.${motif}`,
        ].join(",")
      )
      .order("debut", { ascending: false })
      .limit(50);
    const { data, error } = await requete;
    if (error || !data) {
      console.error("Recherche impossible :", error?.message);
      return [];
    }
    return construire(data, await lireOptions(), maintenant);
  }

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

  return construire(data, options, maintenant);
}

type LigneReservation = Database["public"]["Views"]["reservations_detaillees"]["Row"];

/** Traduit les lignes de la vue en fiches affichables. */
function construire(
  data: LigneReservation[],
  options: { id: string; libelle: string }[],
  maintenant: Date
): ReservationAdmin[] {
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
  // On ne compte que les réservations à venir : la pastille doit correspondre
  // exactement à ce que montre le filtre « À confirmer ». Une réservation
  // passée et jamais confirmée sera de toute façon expirée par le serveur.
  const { count, error } = await base()
    .from("reservations_detaillees")
    .select("id", { count: "exact", head: true })
    .eq("statut", "en_attente")
    .gte("debut", new Date().toISOString());
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

/**
 * Récapitulatif d'une réservation destiné à un e-mail.
 *
 * Relu depuis la base après une modification : l'action ne dispose que de
 * l'identifiant, et il faut l'horaire, l'espace et la formule pour écrire un
 * message compréhensible. Le contenu des allergies n'est PAS transmis — seul
 * un indicateur l'est, le détail restant dans le back-office.
 */
export async function lireRecapEmail(id: string): Promise<RecapEmail | null> {
  if (!baseConfiguree()) return null;

  const [{ data, error }, options] = await Promise.all([
    base().from("reservations_detaillees").select("*").eq("id", id).maybeSingle(),
    lireOptions(),
  ]);

  if (error || !data || !data.reference || !data.type || !data.debut || !data.fin) return null;

  const libelles = new Map(options.map((o) => [o.id, o.libelle]));
  const debut = new Date(data.debut);

  return {
    reference: data.reference,
    activite:
      data.type === "anniversaire"
        ? `Anniversaire — formule ${data.formule_nom ?? ""}`.trim()
        : "Bubble Foot",
    detail:
      data.type === "anniversaire"
        ? `${data.nb_enfants ?? "?"} enfants${
            data.enfant_prenom
              ? ` — ${data.enfant_prenom}${data.enfant_age ? `, ${data.enfant_age} ans` : ""}`
              : ""
          }`
        : `${data.nb_personnes ?? "?"} personnes`,
    jourLabel: jourLisibleCap(debut),
    debut: heure(debut),
    fin: heure(new Date(data.fin)),
    espaceNom: data.espace_nom,
    total: (data.total_cents ?? 0) / 100,
    clientNom: data.client_nom ?? "",
    clientEmail: data.client_email ?? "",
    clientTelephone: data.client_telephone ?? "",
    options: (data.options_ids ?? []).map((o) => libelles.get(o) ?? o),
    allergieSignalee: Boolean(data.allergies),
    remarques: data.remarques,
  };
}
