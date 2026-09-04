import { Accueil } from "./accueil";
import { lireFormules } from "@/lib/db/referentiel";
import { FORMULES_REPLI } from "@/data/formules";

/**
 * Page d'accueil — prérendue, puis rafraîchie toutes les heures.
 *
 * Les tarifs affichés viennent de la base. Un tarif changé en base apparaît
 * donc ici sans redéploiement, au plus tard une heure après.
 *
 * Si la base ne répond pas au moment du rendu, on affiche le repli de
 * `src/data/formules.ts` plutôt que de masquer la section. C'est un choix
 * d'affichage seulement : le montant réellement facturé est toujours recalculé
 * depuis la base au moment de la réservation, jamais depuis ce repli.
 */
export const revalidate = 3600;

export default async function Page() {
  const formules = await lireFormules();
  return <Accueil formules={formules.length > 0 ? formules : FORMULES_REPLI} />;
}
