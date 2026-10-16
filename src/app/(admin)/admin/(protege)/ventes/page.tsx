import { VentesEnAttente, VueVentes } from "@/components/admin/vue-ventes";
import { exigerSession } from "@/lib/admin/session";
import { MigrationVentesManquante } from "@/lib/db/migration-ventes";
import { lireRapportVentes } from "@/lib/db/ventes";
import { lirePeriodeVentes } from "@/lib/periode-ventes";
import { jourISO } from "@/lib/temps";

/**
 * Les ventes en ligne d'une période, avec leur TVA — et le fichier pour le
 * comptable.
 *
 * Demandé par Brahim le 14 octobre 2026. L'écran montre les MÊMES chiffres que
 * les fichiers téléchargés : tous viennent de `lireRapportVentes`. Ce qu'on lit
 * ici avant d'envoyer est donc exactement ce que le comptable recevra.
 */

export const dynamic = "force-dynamic";

export default async function PageVentes({
  searchParams,
}: {
  searchParams: Promise<{ du?: string; au?: string; periode?: string }>;
}) {
  /*
    LA SESSION EST VÉRIFIÉE ICI, ET PAS SEULEMENT DANS LE GABARIT. Un gabarit
    ne se rejoue pas quand seuls les paramètres changent — or changer de
    période, c'est exactement ça. Sans cette ligne, un onglet resté ouvert
    après une déconnexion ailleurs continuait d'afficher le chiffre d'affaires.
  */
  await exigerSession();
  const { du, au, raccourci } = lirePeriodeVentes(await searchParams, jourISO(new Date()));
  // La lecture seule est dans le `try` : le rendu, lui, n'y a pas sa place.
  let rapport;
  try {
    rapport = await lireRapportVentes(du, au);
  } catch (e) {
    // Base pas encore à jour : on le dit. Toute autre erreur reste une panne.
    if (e instanceof MigrationVentesManquante) rapport = null;
    else throw e;
  }
  return rapport ? <VueVentes r={rapport} raccourci={raccourci} /> : <VentesEnAttente />;
}
