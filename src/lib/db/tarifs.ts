import "server-only";
import { base, baseConfiguree } from "@/lib/supabase/server";
import type { FormuleAdmin, OptionAdmin } from "@/lib/vues";

/**
 * Lecture du référentiel tarifaire pour le back-office.
 *
 * Contrairement aux lectures publiques, les entrées inactives sont incluses :
 * c'est précisément ici qu'on les réactive.
 */
export async function lireTarifsAdmin(): Promise<{
  formules: FormuleAdmin[];
  options: OptionAdmin[];
}> {
  if (!baseConfiguree()) return { formules: [], options: [] };

  const [formules, options] = await Promise.all([
    base()
      .from("formules")
      .select("id, nom, accroche, description, prix_base_cents, enfants_inclus, prix_enfant_sup_cents, enfants_max, duree_minutes, inclus, actif")
      .order("ordre"),
    base().from("options").select("id, libelle, description, prix_cents, actif").order("id"),
  ]);

  if (formules.error) console.error("Lecture des formules impossible :", formules.error.message);
  if (options.error) console.error("Lecture des options impossible :", options.error.message);

  return {
    formules: (formules.data ?? []).map((f) => ({
      id: f.id,
      nom: f.nom,
      accroche: f.accroche ?? "",
      description: f.description,
      prixBase: f.prix_base_cents / 100,
      enfantsInclus: f.enfants_inclus,
      prixEnfantSup: f.prix_enfant_sup_cents / 100,
      enfantsMax: f.enfants_max,
      dureeMinutes: f.duree_minutes,
      inclus: f.inclus,
      actif: f.actif,
    })),
    options: (options.data ?? []).map((o) => ({
      id: o.id,
      libelle: o.libelle,
      description: o.description ?? "",
      prix: o.prix_cents / 100,
      actif: o.actif,
    })),
  };
}
