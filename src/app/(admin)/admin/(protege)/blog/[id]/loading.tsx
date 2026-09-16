import { SqueletteBloc, SqueletteEnTete } from "@/components/admin/squelette";

/**
 * Ossature de l'écriture d'un article.
 *
 * Sans elle, c'est l'ossature de la LISTE qui s'affichait — des lignes courtes
 * là où arrive un formulaire, puis un éditeur de texte pleine hauteur. Le saut
 * était d'autant plus visible que cette page est celle où l'on passe du temps.
 */
export default function Chargement() {
  return (
    <div>
      <SqueletteEnTete onglets={0} />
      {/* Titre, adresse, couverture, résumé. */}
      <SqueletteBloc hauteur="h-24" />
      {/* L'éditeur lui-même, qui occupe l'essentiel de la page. */}
      <SqueletteBloc hauteur="h-64" />
    </div>
  );
}
