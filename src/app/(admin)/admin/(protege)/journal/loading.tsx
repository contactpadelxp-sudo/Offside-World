import { SqueletteEnTete, SqueletteLignes } from "@/components/admin/squelette";

export default function Chargement() {
  return (
    <div>
      <SqueletteEnTete />
      <SqueletteLignes nombre={8} />
    </div>
  );
}
