import "server-only";
import { base, baseConfiguree } from "@/lib/supabase/server";
import { jourISO } from "@/lib/temps";
import {
  construireRapport,
  lignesFigeesDepuisJson,
  type MouvementRemboursement,
  type PaiementVente,
  type RapportVentes,
  type TauxActuels,
} from "@/lib/ventes";
import type { StatutReservation, TypeActivite } from "@/lib/vues";
import { MigrationVentesManquante, schemaSansMigrationVentes } from "@/lib/db/migration-ventes";

/**
 * Lecture des ventes en ligne d'une période, pour le récapitulatif comptable.
 *
 * LA PÉRIODE EST EN JOURS DE BRUXELLES, bornes incluses. On lit large — de la
 * veille à midi au lendemain à midi, en UTC — puis `jourISO` range chaque
 * ligne dans son jour : une vente payée le 31 octobre à 23h30 appartient au
 * mois d'octobre, même si c'est déjà le 1er novembre à Greenwich. Même méthode
 * que l'agenda et l'analyse d'audience.
 *
 * UNE VENTE EST DATÉE DE SON ENCAISSEMENT (`paiements.reussi_le`), UN
 * REMBOURSEMENT DE SON MOUVEMENT (`remboursements.survenu_le`). Une vente
 * d'octobre remboursée en novembre apparaît donc dans les deux mois, chacune à
 * sa date — c'est ce qu'attend une comptabilité.
 *
 * TOUT EST LU, PAGE PAR PAGE. Supabase plafonne une réponse à 1 000 lignes : une
 * année de ventes peut dépasser ce seuil, et un récapitulatif tronqué sans le
 * dire serait pire que pas de récapitulatif du tout.
 */

const PAGE = 1000;

function midi(jour: string): Date {
  return new Date(`${jour}T12:00:00Z`);
}

/** Toutes les lignes d'une requête paginée. */
async function toutLire<T>(
  lire: (
    de: number,
    a: number
  ) => PromiseLike<{ data: T[] | null; error: { message: string; code?: string } | null }>
): Promise<T[]> {
  const lignes: T[] = [];
  for (let de = 0; ; de += PAGE) {
    const { data, error } = await lire(de, de + PAGE - 1);
    if (schemaSansMigrationVentes(error)) throw new MigrationVentesManquante();
    if (error) throw new Error(error.message);
    lignes.push(...(data ?? []));
    if (!data || data.length < PAGE) return lignes;
  }
}

interface ReservationLue {
  reference: string;
  type: TypeActivite;
  statut: StatutReservation;
  lignes: unknown;
  creneaux: { debut: string } | null;
}

interface PaiementLu {
  id: string;
  montant_cents: number;
  methode: string | null;
  reussi_le: string | null;
  reservations: ReservationLue | null;
}

const COLONNES_PAIEMENT =
  "id, montant_cents, methode, reussi_le, reservations(reference, type, statut, lignes, creneaux(debut))";

function versPaiementVente(p: PaiementLu): PaiementVente | null {
  const r = p.reservations;
  if (!r || !p.reussi_le) return null;
  return {
    paiementId: p.id,
    reference: r.reference,
    typeActivite: r.type,
    statutReservation: r.statut,
    jourActivite: r.creneaux?.debut ? jourISO(new Date(r.creneaux.debut)) : null,
    jourPaiement: jourISO(new Date(p.reussi_le)),
    montantCents: p.montant_cents,
    methode: p.methode,
    lignes: lignesFigeesDepuisJson(r.lignes),
  };
}

export async function lireRapportVentes(du: string, au: string): Promise<RapportVentes> {
  if (!baseConfiguree()) throw new Error("Base non configurée : aucune vente ne peut être lue.");

  const depuis = new Date(midi(du).getTime() - 86_400_000).toISOString();
  const jusqua = new Date(midi(au).getTime() + 86_400_000).toISOString();
  const dansLaPeriode = (instant: string) => {
    const jour = jourISO(new Date(instant));
    return jour >= du && jour <= au;
  };

  const [paiementsLus, remboursementsLus, formules, options] = await Promise.all([
    toutLire<PaiementLu>((de, a) =>
      base()
        .from("paiements")
        .select(COLONNES_PAIEMENT)
        .not("reussi_le", "is", null)
        .gte("reussi_le", depuis)
        .lt("reussi_le", jusqua)
        .order("reussi_le")
        .order("id")
        .range(de, a)
        .overrideTypes<PaiementLu[], { merge: false }>()
    ),
    toutLire<{ id: number; montant_cents: number; survenu_le: string; repris: boolean; paiements: PaiementLu | null }>(
      (de, a) =>
        base()
          .from("remboursements")
          .select(`id, montant_cents, survenu_le, repris, paiements(${COLONNES_PAIEMENT})`)
          .gte("survenu_le", depuis)
          .lt("survenu_le", jusqua)
          .order("survenu_le")
          .order("id")
          .range(de, a)
          .overrideTypes<
            { id: number; montant_cents: number; survenu_le: string; repris: boolean; paiements: PaiementLu | null }[],
            { merge: false }
          >()
    ),
    base().from("formules").select("id, tva_pourcent"),
    base().from("options").select("id, tva_pourcent"),
  ]);

  if (schemaSansMigrationVentes(formules.error) || schemaSansMigrationVentes(options.error)) {
    throw new MigrationVentesManquante();
  }
  if (formules.error) throw new Error(formules.error.message);
  if (options.error) throw new Error(options.error.message);

  const actuels: TauxActuels = {
    formules: Object.fromEntries((formules.data ?? []).map((f) => [f.id, f.tva_pourcent])),
    options: Object.fromEntries((options.data ?? []).map((o) => [o.id, o.tva_pourcent])),
  };

  const paiements = paiementsLus
    .filter((p) => p.reussi_le && dansLaPeriode(p.reussi_le))
    .map(versPaiementVente)
    .filter((p): p is PaiementVente => p !== null);

  const remboursements: MouvementRemboursement[] = [];
  for (const m of remboursementsLus) {
    if (!dansLaPeriode(m.survenu_le) || !m.paiements) continue;
    const paiement = versPaiementVente(m.paiements);
    if (!paiement) continue;
    remboursements.push({
      id: m.id,
      jour: jourISO(new Date(m.survenu_le)),
      montantCents: m.montant_cents,
      repris: m.repris,
      paiement,
    });
  }

  return construireRapport({ du, au, paiements, remboursements, actuels });
}
