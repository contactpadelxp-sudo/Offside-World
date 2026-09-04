import "server-only";
import { base, baseConfiguree } from "@/lib/supabase/server";
import { heure, jourISO, jourLisibleCap } from "@/lib/temps";
import { DELAI_RESERVATION_HEURES } from "@/data/reglement";
import type { Database } from "@/lib/supabase/types";
import type { CreneauVue } from "@/lib/vues";

export type { CreneauVue };

/**
 * Disponibilités — lues depuis la vue `creneaux_disponibles`.
 *
 * La vue applique exactement la même règle que l'index unique qui interdit le
 * double-booking : ce qui s'affiche « libre » est ce que la base acceptera
 * d'écrire. La disponibilité n'est donc jamais recalculée dans le navigateur.
 */

export type TypeActivite = Database["public"]["Enums"]["type_activite"];

/**
 * Horizon d'affichage. Six mois de créneaux sont ouverts en base, mais en
 * proposer autant d'un coup noierait le sélecteur de dates. Le client peut
 * réserver plus loin dès que le besoin s'en fera sentir : c'est une limite
 * d'affichage, pas une limite commerciale.
 */
const HORIZON_JOURS = 90;

/** Instant à partir duquel un créneau est encore réservable. */
export function premierInstantReservable(maintenant = new Date()): Date {
  return new Date(maintenant.getTime() + DELAI_RESERVATION_HEURES * 3_600_000);
}

export async function lireCreneaux(type: TypeActivite): Promise<CreneauVue[]> {
  if (!baseConfiguree()) return [];

  const debutMin = premierInstantReservable();
  const finMax = new Date(debutMin.getTime() + HORIZON_JOURS * 86_400_000);

  const { data, error } = await base()
    .from("creneaux_disponibles")
    .select("id, espace_id, espace_nom, capacite, debut, fin, libre")
    .eq("type", type)
    .gte("debut", debutMin.toISOString())
    .lt("debut", finMax.toISOString())
    .order("debut");

  if (error) {
    console.error("Lecture des créneaux impossible :", error.message);
    return [];
  }

  // Les colonnes d'une vue sont typées « nullable » : Postgres ne peut pas
  // garantir le contraire à travers une jointure. On écarte donc les lignes
  // incomplètes plutôt que de propager des valeurs vides jusqu'à l'affichage.
  const creneaux: CreneauVue[] = [];
  for (const c of data) {
    if (!c.id || !c.espace_id || !c.espace_nom || !c.debut || !c.fin || c.capacite === null) continue;
    const debut = new Date(c.debut);
    const fin = new Date(c.fin);
    creneaux.push({
      id: c.id,
      espaceId: c.espace_id,
      espaceNom: c.espace_nom,
      capacite: c.capacite,
      jour: jourISO(debut),
      jourLabel: jourLisibleCap(debut),
      debut: heure(debut),
      fin: heure(fin),
      libre: c.libre ?? false,
    });
  }
  return creneaux;
}

/** Créneau vérifié au moment d'écrire une réservation. */
export interface CreneauReservable {
  id: string;
  type: TypeActivite;
  espaceId: string;
  capacite: number;
  debut: Date;
  fin: Date;
}

/**
 * Relit un créneau au moment de la validation.
 *
 * Le navigateur peut envoyer n'importe quel identifiant : le type, l'ouverture,
 * le délai minimum et la disponibilité sont donc revérifiés ici, sur la base,
 * et non sur ce que la page prétend avoir affiché.
 */
export async function verifierCreneau(
  id: string,
  type: TypeActivite
): Promise<CreneauReservable | null> {
  const { data, error } = await base()
    .from("creneaux_disponibles")
    .select("id, type, espace_id, capacite, debut, fin, libre")
    .eq("id", id)
    .eq("type", type)
    .maybeSingle();

  if (error || !data) return null;
  if (!data.id || !data.type || !data.espace_id || !data.debut || !data.fin || data.capacite === null) return null;
  if (!data.libre) return null;

  const debut = new Date(data.debut);
  if (debut < premierInstantReservable()) return null;

  return {
    id: data.id,
    type: data.type,
    espaceId: data.espace_id,
    capacite: data.capacite,
    debut,
    fin: new Date(data.fin),
  };
}
