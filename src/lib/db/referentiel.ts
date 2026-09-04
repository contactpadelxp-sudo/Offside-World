import "server-only";
import { base, baseConfiguree } from "@/lib/supabase/server";
import type { FormuleVue, OptionVue } from "@/lib/vues";

export type { FormuleVue, OptionVue };

/**
 * Référentiel tarifaire — lu depuis la base, jamais recopié dans le code.
 *
 * `src/data/formules.ts` ne sert plus que de repli d'affichage si la base est
 * injoignable : le prix RÉELLEMENT FACTURÉ est toujours recalculé ici, à partir
 * de la table `formules`, au moment d'écrire la réservation.
 */

/** Les montants sont stockés en centimes pour éviter les arrondis flottants. */
export const enEuros = (cents: number): number => cents / 100;

export async function lireFormules(): Promise<FormuleVue[]> {
  if (!baseConfiguree()) return [];

  const { data, error } = await base()
    .from("formules")
    .select("id, nom, accroche, description, prix_base_cents, enfants_inclus, prix_enfant_sup_cents, enfants_max, duree_minutes, inclus, image")
    .eq("actif", true)
    .order("ordre");

  if (error) {
    console.error("Lecture des formules impossible :", error.message);
    return [];
  }

  return data.map((f) => ({
    id: f.id,
    nom: f.nom,
    accroche: f.accroche,
    description: f.description,
    prixBase: enEuros(f.prix_base_cents),
    enfantsInclus: f.enfants_inclus,
    prixEnfantSup: enEuros(f.prix_enfant_sup_cents),
    enfantsMax: f.enfants_max,
    dureeMinutes: f.duree_minutes,
    inclus: f.inclus,
    image: f.image,
  }));
}

export async function lireOptions(): Promise<OptionVue[]> {
  if (!baseConfiguree()) return [];

  const { data, error } = await base()
    .from("options")
    .select("id, libelle, description, prix_cents")
    .eq("actif", true)
    .order("id");

  if (error) {
    console.error("Lecture des options impossible :", error.message);
    return [];
  }

  return data.map((o) => ({
    id: o.id,
    libelle: o.libelle,
    description: o.description,
    prix: enEuros(o.prix_cents),
  }));
}

// ── Tarification (centimes) ───────────────────────────────────────────────────
//
// Le funnel affiche des euros ; le calcul, lui, se fait en centimes entiers.
// Ces deux fonctions sont la seule source du prix réellement facturé.

export interface TarifFormule {
  id: string;
  nom: string;
  prixBaseCents: number;
  enfantsInclus: number;
  prixEnfantSupCents: number;
  enfantsMax: number;
}

/** Retourne `null` si la formule n'existe pas ou n'est plus active. */
export async function lireTarifFormule(id: string): Promise<TarifFormule | null> {
  const { data, error } = await base()
    .from("formules")
    .select("id, nom, prix_base_cents, enfants_inclus, prix_enfant_sup_cents, enfants_max")
    .eq("id", id)
    .eq("actif", true)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id,
    nom: data.nom,
    prixBaseCents: data.prix_base_cents,
    enfantsInclus: data.enfants_inclus,
    prixEnfantSupCents: data.prix_enfant_sup_cents,
    enfantsMax: data.enfants_max,
  };
}

/**
 * Tarif des options demandées. Les identifiants inconnus ou inactifs sont
 * simplement absents du résultat : l'appelant compare les tailles pour refuser
 * une commande contenant une option qui n'existe pas.
 */
export async function lireTarifsOptions(
  ids: string[]
): Promise<{ id: string; libelle: string; prixCents: number }[]> {
  if (ids.length === 0) return [];

  const { data, error } = await base()
    .from("options")
    .select("id, libelle, prix_cents")
    .in("id", ids)
    .eq("actif", true);

  if (error || !data) return [];
  return data.map((o) => ({ id: o.id, libelle: o.libelle, prixCents: o.prix_cents }));
}
