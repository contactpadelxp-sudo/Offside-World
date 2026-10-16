import "server-only";
import { base, baseConfiguree } from "@/lib/supabase/server";
import type { FormuleAdmin, OptionAdmin } from "@/lib/vues";
import { schemaSansMigrationVentes } from "@/lib/db/migration-ventes";

/**
 * Lecture du référentiel tarifaire pour le back-office.
 *
 * Contrairement aux lectures publiques, les entrées inactives sont incluses :
 * c'est précisément ici qu'on les réactive.
 */
const COLONNES_FORMULE =
  "id, nom, accroche, description, prix_base_cents, enfants_inclus, prix_enfant_sup_cents, enfants_max, age_max, duree_minutes, inclus, actif";
const COLONNES_OPTION = "id, libelle, description, prix_cents, actif";

export async function lireTarifsAdmin(): Promise<{
  formules: FormuleAdmin[];
  options: OptionAdmin[];
  /**
   * Faux tant que la migration 0040 n'est pas appliquée : la colonne
   * `tva_pourcent` n'existe pas encore, et l'écran masque le champ TVA au lieu
   * de tomber en erreur. Voir `db/migration-ventes.ts`.
   */
  tvaDisponible: boolean;
}> {
  if (!baseConfiguree()) return { formules: [], options: [], tvaDisponible: false };

  const lire = (avecTva: boolean) =>
    Promise.all([
      base()
        .from("formules")
        .select(avecTva ? `${COLONNES_FORMULE}, tva_pourcent` : COLONNES_FORMULE)
        .order("ordre")
        .overrideTypes<
          {
            id: string;
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
            tva_pourcent?: number | null;
          }[],
          { merge: false }
        >(),
      base()
        .from("options")
        .select(avecTva ? `${COLONNES_OPTION}, tva_pourcent` : COLONNES_OPTION)
        .order("id")
        .overrideTypes<
          {
            id: string;
            libelle: string;
            description: string | null;
            prix_cents: number;
            actif: boolean;
            tva_pourcent?: number | null;
          }[],
          { merge: false }
        >(),
    ]);

  let tvaDisponible = true;
  let [formules, options] = await lire(true);
  if (schemaSansMigrationVentes(formules.error) || schemaSansMigrationVentes(options.error)) {
    tvaDisponible = false;
    [formules, options] = await lire(false);
  }

  if (formules.error) console.error("Lecture des formules impossible :", formules.error.message);
  if (options.error) console.error("Lecture des options impossible :", options.error.message);

  return {
    tvaDisponible,
    formules: (formules.data ?? []).map((f) => ({
      id: f.id,
      nom: f.nom,
      accroche: f.accroche ?? "",
      description: f.description,
      prixBase: f.prix_base_cents / 100,
      enfantsInclus: f.enfants_inclus,
      prixEnfantSup: f.prix_enfant_sup_cents / 100,
      enfantsMax: f.enfants_max,
      ageMax: f.age_max,
      dureeMinutes: f.duree_minutes,
      inclus: f.inclus,
      actif: f.actif,
      tvaPourcent: f.tva_pourcent ?? null,
    })),
    options: (options.data ?? []).map((o) => ({
      id: o.id,
      libelle: o.libelle,
      description: o.description ?? "",
      prix: o.prix_cents / 100,
      actif: o.actif,
      tvaPourcent: o.tva_pourcent ?? null,
    })),
  };
}
