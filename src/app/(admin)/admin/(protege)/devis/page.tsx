import { FicheDevis } from "@/components/admin/fiche-devis";
import { LienOnglet } from "@/components/admin/onglets";
import { lireDevis } from "@/lib/db/backoffice";
import { Document } from "@/components/icons";

export default async function PageDevis({
  searchParams,
}: {
  searchParams: Promise<{ toutes?: string }>;
}) {
  const { toutes } = await searchParams;
  const inclureTraites = toutes === "1";
  const devis = await lireDevis(inclureTraites);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
            <Document className="size-6 text-field" /> Demandes de devis
          </h1>
          <p className="text-sm text-muted-foreground">
            Team building. Une demande n&apos;occupe aucun créneau tant qu&apos;elle n&apos;est pas
            transformée en réservation.
          </p>
        </div>
        <LienOnglet
          href={inclureTraites ? "/admin/devis" : "/admin/devis?toutes=1"}
          actif={false}
        >
          {inclureTraites ? "Masquer les demandes closes" : "Voir aussi les demandes closes"}
        </LienOnglet>
      </div>

      {devis.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-border bg-card p-6 text-muted-foreground">
          Aucune demande de devis en cours.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {devis.map((d) => (
            <FicheDevis key={d.id} d={d} />
          ))}
        </div>
      )}
    </div>
  );
}
