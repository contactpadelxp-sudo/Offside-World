import { SqueletteCartes, SqueletteEnTete } from "@/components/admin/squelette";

export default function Chargement() {
  return (
    <div>
      <SqueletteEnTete />
      <SqueletteCartes nombre={2} />
    </div>
  );
}
