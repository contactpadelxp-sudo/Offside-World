import { SqueletteEnTete, SqueletteLignes } from "@/components/admin/squelette";

/**
 * Ossature de la liste des articles.
 *
 * Aucun onglet : l'en-tête du blog porte un bouton « Nouvel article », pas des
 * filtres. En annoncer trois faisait apparaître puis disparaître une rangée
 * qui n'existe pas sur cette page.
 */
export default function Chargement() {
  return (
    <div>
      <SqueletteEnTete onglets={0} />
      <SqueletteLignes nombre={4} />
    </div>
  );
}
