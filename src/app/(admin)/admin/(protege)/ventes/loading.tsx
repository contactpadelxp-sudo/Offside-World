import { SqueletteBloc, SqueletteEnTete, SqueletteTuiles } from "@/components/admin/squelette";

/** Ossature affichée le temps que les ventes de la période soient lues. */
export default function Chargement() {
  return (
    <div>
      <SqueletteEnTete onglets={6} />
      <SqueletteBloc hauteur="h-28" />
      <SqueletteTuiles nombre={4} />
      <SqueletteBloc hauteur="h-48" />
    </div>
  );
}
