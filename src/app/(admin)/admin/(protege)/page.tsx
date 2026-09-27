import Link from "next/link";
import { FicheReservation } from "@/components/admin/fiche-reservation";
import { LienOnglet, OngletsFiltres } from "@/components/admin/onglets";
import { Recherche } from "@/components/admin/recherche";
import { AgendaJour } from "@/components/admin/agenda-jour";
import { AllerAuJour } from "@/components/admin/actions-creneaux";
import {
  compterAConfirmer,
  lireCreneauxDuJour,
  lireEspaces,
  lireReservations,
  lireReservationsDesJours,
} from "@/lib/db/backoffice";
import { construireAgenda, enMinutes } from "@/lib/agenda";
import type { FiltreReservations, ReservationAdmin } from "@/lib/vues";
import { FlecheDroite, FlecheGauche, PressePapier } from "@/components/icons";
import { euros } from "@/lib/tarification";
import { heure, jourCompact, jourISO, jourLisibleCap } from "@/lib/temps";

const FILTRES: { valeur: FiltreReservations; label: string }[] = [
  { valeur: "a-venir", label: "À venir" },
  { valeur: "a-confirmer", label: "À confirmer" },
  { valeur: "passees", label: "Passées" },
  { valeur: "annulees", label: "Annulées" },
];

const FORMAT_JOUR = /^\d{4}-\d{2}-\d{2}$/;

/** Midi UTC : la date reste la même quel que soit le décalage horaire. */
function versDate(jour: string): Date {
  return new Date(`${jour}T12:00:00Z`);
}

function decaler(jour: string, jours: number): string {
  return jourISO(new Date(versDate(jour).getTime() + jours * 86_400_000));
}

/**
 * Les réservations — en agenda par défaut, en liste sur demande.
 *
 * L'AGENDA D'ABORD, depuis le 27 septembre 2026, à la demande de Mathis : une
 * journée se prépare en la regardant heure par heure, Fun zone par Fun zone,
 * pas en faisant défiler des fiches. La liste reste à un onglet : c'est elle
 * qui porte la recherche, les demandes à confirmer, les passées et les
 * annulées — ce qu'un agenda d'un jour ne sait pas montrer.
 *
 * Une recherche ou un filtre dans l'adresse ouvre donc la liste : les liens
 * existants vers `/admin?filtre=a-confirmer` continuent de mener au même
 * endroit.
 */
export default async function PageReservations({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string; q?: string; vue?: string; jour?: string; r?: string }>;
}) {
  const params = await searchParams;
  const { filtre, q } = params;
  const recherche = (q ?? "").trim();

  if (!recherche && !filtre && params.vue !== "liste") {
    return <VueAgenda jourDemande={params.jour} selection={params.r ?? null} />;
  }

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
      {/*
        Sur un iPhone SE, l'en-tête poussait la première fiche à 628 px du
        haut : sur un écran de 667 px, on ne voyait aucune réservation au
        chargement. Le montant attendu passe donc sur une seule ligne, à côté
        du titre, au lieu d'occuper deux rangées à lui seul.
      */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
          <PressePapier className="size-6 text-field" /> Réservations
        </h1>
        <ChoixVue liste />
        {montantAffiche && (
          <p className="text-sm text-muted-foreground">
            {/*
              « Total des réservations » et non « Montant attendu » : ce chiffre
              est la somme des PRIX affichés, encaissements compris. Il ne dit
              pas ce qu'il reste à recevoir, alors que son ancien nom le
              promettait — et il change de sens d'un onglet à l'autre, « À
              venir » mêlant confirmées et en attente là où « À confirmer » ne
              compte que les secondes.
            */}
            Total des réservations{" "}
            <span className="font-bold text-foreground">{euros(total)}</span>
          </p>
        )}
      </div>
      {/*
        Une phrase rappelait ici que les locations de terrain passent par
        Sport-Finder et n'apparaissent pas dans cette liste. Retirée à la
        demande du client le 16 septembre 2026 : elle était utile la première
        fois, puis restait à l'écran pour toujours — et elle coûtait une ligne
        exactement là où l'on s'est battu pour en gagner, l'en-tête poussant
        déjà la première fiche à 628 px du haut sur un iPhone SE.

        L'information elle-même n'est pas perdue : le parcours public dirige
        vers Sport-Finder, et les CGV le disent.
      */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <OngletsFiltres filtres={FILTRES} actif={actif} desactives={Boolean(recherche)} />
        <Recherche valeur={recherche} filtre={actif} />
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

/** Agenda ou liste : deux onglets, en tête de page. */
function ChoixVue({ liste }: { liste: boolean }) {
  return (
    <nav className="flex gap-2" aria-label="Affichage">
      <LienOnglet href="/admin" actif={!liste}>
        Agenda
      </LienOnglet>
      <LienOnglet href="/admin?filtre=a-venir" actif={liste}>
        Liste
      </LienOnglet>
    </nav>
  );
}

async function VueAgenda({
  jourDemande,
  selection,
}: {
  jourDemande: string | undefined;
  selection: string | null;
}) {
  const aujourdhui = jourISO(new Date());
  const jour = jourDemande && FORMAT_JOUR.test(jourDemande) ? jourDemande : aujourdhui;
  const semaine = Array.from({ length: 7 }, (_, i) => decaler(jour, i - 3));

  // Une seule lecture pour la semaine affichée : elle sert à la fois la
  // journée et les pastilles de la bande de dates.
  const [reservationsSemaine, creneaux, espaces, enAttente] = await Promise.all([
    lireReservationsDesJours(semaine),
    lireCreneauxDuJour(jour),
    lireEspaces(),
    compterAConfirmer(),
  ]);

  const duJour = reservationsSemaine.filter((r) => r.jour === jour);
  const parJour = new Map<string, number>();
  for (const r of reservationsSemaine) parJour.set(r.jour, (parJour.get(r.jour) ?? 0) + 1);

  const agenda = construireAgenda({
    jour,
    creneaux,
    reservations: duJour,
    espaces: espaces.map((e) => e.nom),
  });
  const choisie = duJour.find((r) => r.id === selection) ?? null;
  const aConfirmer = duJour.filter((r) => r.statut === "en_attente").length;
  const total = duJour.reduce((somme, r) => somme + r.total, 0);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h1 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
          <PressePapier className="size-6 text-field" /> Réservations
        </h1>
        <ChoixVue liste={false} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Recherche valeur="" />
        <AllerAuJour jour={jour} base="/admin" />
        {jour !== aujourdhui && (
          <Link
            href="/admin"
            className="inline-flex min-h-9 items-center rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:border-field/40 hover:text-foreground"
          >
            Aujourd&apos;hui
          </Link>
        )}
      </div>

      {/*
        LES DEMANDES À CONFIRMER NE SE PERDENT PAS DANS L'AGENDA. Elles peuvent
        tomber n'importe quel jour ; l'agenda n'en montre qu'un. On les compte
        toutes ici, avec le chemin vers la liste qui les rassemble.
      */}
      {enAttente > 0 && (
        <Link
          href="/admin?filtre=a-confirmer"
          className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-kick/40 bg-kick/10 px-4 py-2.5 text-sm font-medium text-kick transition-colors hover:bg-kick/15"
        >
          {enAttente} réservation{enAttente > 1 ? "s" : ""} à confirmer
          <FlecheDroite className="size-4 shrink-0" />
        </Link>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={`/admin?jour=${decaler(jour, -1)}`}
          aria-label="Jour précédent"
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-field/40 hover:text-foreground"
        >
          <FlecheGauche className="size-4" />
        </Link>
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          {semaine.map((j) => {
            const n = parJour.get(j) ?? 0;
            return (
              <LienOnglet key={j} href={`/admin?jour=${j}`} actif={j === jour}>
                <span className="sm:hidden">{jourCompact(versDate(j))}</span>
                <span className="hidden sm:inline">{jourLisibleCap(versDate(j))}</span>
                {n > 0 && (
                  <span
                    aria-label={`${n} réservation${n > 1 ? "s" : ""}`}
                    className="inline-flex min-w-5 items-center justify-center rounded-full bg-field px-1.5 text-[11px] font-bold text-black"
                  >
                    {n}
                  </span>
                )}
              </LienOnglet>
            );
          })}
        </div>
        <Link
          href={`/admin?jour=${decaler(jour, 1)}`}
          aria-label="Jour suivant"
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-field/40 hover:text-foreground"
        >
          <FlecheDroite className="size-4" />
        </Link>
      </div>

      <h2 className="mt-6 mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {jourLisibleCap(versDate(jour))}
        {jour === aujourdhui && " (aujourd’hui)"}
        <span className="ml-2 font-normal normal-case tracking-normal">
          {duJour.length === 0
            ? "aucune réservation"
            : `${duJour.length} réservation${duJour.length > 1 ? "s" : ""}` +
              (aConfirmer > 0 ? ` dont ${aConfirmer} à confirmer` : "") +
              ` · ${euros(total)}`}
        </span>
      </h2>

      <AgendaJour
        agenda={agenda}
        jour={jour}
        selection={choisie?.id ?? null}
        maintenant={jour === aujourdhui ? enMinutes(heure(new Date())) : null}
      />

      <p className="mt-2 text-xs text-muted-foreground">
        Touchez une réservation pour ouvrir sa fiche. <strong className="font-medium text-foreground">Fermé</strong>{" "}
        : retiré de la vente, par exemple un anniversaire pris par téléphone — il se gère dans{" "}
        <Link href={`/admin/creneaux?jour=${jour}`} className="underline underline-offset-2 hover:text-foreground">
          Créneaux
        </Link>
        .
      </p>

      {choisie && (
        <section id="fiche" className="mt-6 scroll-mt-24">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Fiche {choisie.reference}
            </h2>
            <Link
              href={`/admin?jour=${jour}`}
              scroll={false}
              className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Fermer
            </Link>
          </div>
          <FicheReservation r={choisie} />
        </section>
      )}
    </div>
  );
}
