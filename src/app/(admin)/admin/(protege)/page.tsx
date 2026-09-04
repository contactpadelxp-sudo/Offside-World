import { FicheReservation } from "@/components/admin/fiche-reservation";
import { OngletsFiltres } from "@/components/admin/onglets";
import { Recherche } from "@/components/admin/recherche";
import { lireReservations } from "@/lib/db/backoffice";
import type { FiltreReservations, ReservationAdmin } from "@/lib/vues";
import { PressePapier } from "@/components/icons";

const FILTRES: { valeur: FiltreReservations; label: string }[] = [
  { valeur: "a-venir", label: "À venir" },
  { valeur: "a-confirmer", label: "À confirmer" },
  { valeur: "passees", label: "Passées" },
  { valeur: "annulees", label: "Annulées" },
];

export default async function PageReservations({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string; q?: string }>;
}) {
  const { filtre, q } = await searchParams;
  const recherche = (q ?? "").trim();
  const actif: FiltreReservations = FILTRES.some((f) => f.valeur === filtre)
    ? (filtre as FiltreReservations)
    : "a-venir";

  const reservations = await lireReservations(actif, recherche);
  const total = reservations.reduce((somme, r) => somme + r.total, 0);

  // Regroupement par journée : c'est ainsi qu'on prépare une journée de travail.
  const parJour = new Map<string, ReservationAdmin[]>();
  for (const r of reservations) {
    const liste = parJour.get(r.jourLabel);
    if (liste) liste.push(r);
    else parJour.set(r.jourLabel, [r]);
  }

  const montantAffiche =
    !recherche && (actif === "a-venir" || actif === "a-confirmer") && reservations.length > 0;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
            <PressePapier className="size-6 text-field" /> Réservations
          </h1>
          <p className="text-sm text-muted-foreground">
            Les locations de terrain sont gérées sur Sport-Finder et n&apos;apparaissent pas ici.
          </p>
        </div>
        {montantAffiche && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Montant attendu</p>
            <p className="text-xl font-bold text-field">{total}€</p>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <OngletsFiltres filtres={FILTRES} actif={actif} desactives={Boolean(recherche)} />
        <Recherche valeur={recherche} />
      </div>

      {recherche && (
        <p className="mt-4 text-sm text-muted-foreground">
          {reservations.length === 0
            ? "Aucun résultat pour "
            : `${reservations.length} résultat${reservations.length > 1 ? "s" : ""} pour `}
          <strong className="text-foreground">« {recherche} »</strong> — toutes vues confondues.
        </p>
      )}

      {reservations.length === 0 ? (
        !recherche && (
          <p className="mt-6 rounded-2xl border border-border bg-card p-6 text-muted-foreground">
            Aucune réservation dans cette vue.
          </p>
        )
      ) : (
        <div className="mt-6 space-y-8">
          {[...parJour].map(([jourLabel, liste]) => (
            <section key={jourLabel}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {jourLabel}
              </h2>
              <div className="space-y-4">
                {liste.map((r) => (
                  <FicheReservation key={r.id} r={r} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
