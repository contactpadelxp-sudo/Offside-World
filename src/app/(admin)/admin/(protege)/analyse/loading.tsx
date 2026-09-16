import {
  SqueletteBloc,
  SqueletteEnTete,
  SqueletteTuiles,
} from "@/components/admin/squelette";

/**
 * Ossature de l'analyse.
 *
 * C'est la page où elle compte le plus : la lecture rapatrie jusqu'à 50 000
 * lignes de mesure, donc l'attente est la plus longue du back-office. Sans
 * ossature propre, celle des réservations s'affichait à la place — trois
 * grandes fiches et trois onglets de filtre — puis tout sautait d'un coup.
 *
 * Trois onglets, parce que la vraie page en montre trois : 7, 30 et 90 jours.
 */
export default function Chargement() {
  return (
    <div>
      <SqueletteEnTete onglets={3} />
      <SqueletteTuiles nombre={4} />
      <SqueletteBloc hauteur="h-32" />
      <SqueletteBloc hauteur="h-40" />
    </div>
  );
}
