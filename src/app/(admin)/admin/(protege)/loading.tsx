import { SqueletteCartes, SqueletteEnTete } from "@/components/admin/squelette";

/**
 * Ossature affichée le temps que les réservations arrivent.
 * La barre du back-office, rendue par le gabarit, reste visible et cliquable.
 */
export default function Chargement() {
  return (
    <div>
      <SqueletteEnTete />
      <SqueletteCartes nombre={3} />
    </div>
  );
}
