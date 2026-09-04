import Link from "next/link";
import { ListeCreneaux, OuvrirPeriode } from "@/components/admin/actions-creneaux";
import { lireCreneauxDuJour } from "@/lib/db/backoffice";
import { jourISO, jourLisibleCap } from "@/lib/temps";
import { Calendrier, FlecheDroite, FlecheGauche } from "@/components/icons";

/** Midi UTC : la date reste la même quel que soit le décalage horaire. */
function versDate(jour: string): Date {
  return new Date(`${jour}T12:00:00Z`);
}

function decaler(jour: string, jours: number): string {
  return jourISO(new Date(versDate(jour).getTime() + jours * 86_400_000));
}

const FORMAT_JOUR = /^\d{4}-\d{2}-\d{2}$/;

export default async function PageCreneaux({
  searchParams,
}: {
  searchParams: Promise<{ jour?: string }>;
}) {
  const { jour: demande } = await searchParams;
  const aujourdhui = jourISO(new Date());
  const jour = demande && FORMAT_JOUR.test(demande) ? demande : aujourdhui;

  const creneaux = await lireCreneauxDuJour(jour);
  const semaine = Array.from({ length: 7 }, (_, i) => decaler(jour, i - 3));

  return (
    <div>
      <h1 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
        <Calendrier className="size-6 text-field" /> Créneaux
      </h1>
      <p className="text-sm text-muted-foreground">
        Ce qui est ouvert ici est vendable sur le site. Fermez un créneau pour le retirer de la
        vente sans rien supprimer — un tournoi, un entretien, un jour de fermeture.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/creneaux?jour=${decaler(jour, -1)}`}
          aria-label="Jour précédent"
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-field/40 hover:text-foreground"
        >
          <FlecheGauche className="size-4" />
        </Link>

        <div className="-mx-1 flex flex-1 items-center gap-1 overflow-x-auto px-1">
          {semaine.map((j) => (
            <Link
              key={j}
              href={`/admin/creneaux?jour=${j}`}
              aria-current={j === jour ? "page" : undefined}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                j === jour
                  ? "bg-field/15 text-field ring-1 ring-field/40"
                  : "border border-border text-muted-foreground hover:border-field/40 hover:text-foreground"
              }`}
            >
              {jourLisibleCap(versDate(j))}
              {j === aujourdhui && <span className="ml-1.5 text-xs opacity-70">(aujourd&apos;hui)</span>}
            </Link>
          ))}
        </div>

        <Link
          href={`/admin/creneaux?jour=${decaler(jour, 1)}`}
          aria-label="Jour suivant"
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-field/40 hover:text-foreground"
        >
          <FlecheDroite className="size-4" />
        </Link>
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {jourLisibleCap(versDate(jour))}
      </h2>
      <ListeCreneaux creneaux={creneaux} />

      <div className="mt-10">
        <OuvrirPeriode debutParDefaut={aujourdhui} finParDefaut={decaler(aujourdhui, 180)} />
      </div>
    </div>
  );
}
