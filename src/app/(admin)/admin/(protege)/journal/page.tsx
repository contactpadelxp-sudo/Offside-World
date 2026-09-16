import Link from "next/link";
import { lireJournal } from "@/lib/db/backoffice";
import type { EntreeJournal, FamilleJournal } from "@/lib/vues";
import { Bouclier } from "@/components/icons";
import { LienOnglet } from "@/components/admin/onglets";

/**
 * Journal des accès et des modifications.
 *
 * Ce n'est pas un confort d'exploitation. Les réservations contiennent des
 * données d'enfants et de santé : savoir qui a confirmé, annulé ou annoté quoi,
 * et quand, fait partie des mesures attendues d'un responsable de traitement
 * (RGPD art. 5.1.f et 32). Le journal n'est ni modifiable ni effaçable depuis
 * cette page.
 *
 * CE QU'IL FALLAIT CORRIGER, ET POURQUOI.
 *
 * La page montrait quatre colonnes — quand, qui, action, cible — et rien
 * d'autre. Trois défauts, tous du même genre : elle affichait ce qui ne varie
 * pas et cachait ce qui varie.
 *
 * 1. LE DÉTAIL N'ÉTAIT PAS AFFICHÉ. Il était pourtant lu en base et sérialisé
 *    en JSON avant d'être jeté. « Devis envoyé au client » ne disait pas s'il
 *    s'agissait de 180 € ou de 1 800 € ; « Réservation annulée » ne disait pas
 *    si le client avait été remboursé.
 * 2. LA COLONNE « QUI » NE VARIAIT JAMAIS. Un seul compte d'exploitation : la
 *    colonne occupait un quart de la largeur pour répéter la même adresse.
 *    Elle ne s'affiche donc que si plusieurs personnes ont agi — et elle
 *    réapparaîtra d'elle-même le jour où c'est le cas.
 * 3. LES CONNEXIONS NOYAIENT LE RESTE. Elles doivent être conservées, mais ce
 *    n'est pas ce qu'on cherche en ouvrant le journal : on y vient pour
 *    comprendre ce qui est arrivé à une réservation. D'où les onglets.
 */

const ONGLETS: { valeur: FamilleJournal | "tout"; label: string }[] = [
  { valeur: "tout", label: "Tout" },
  { valeur: "reservations", label: "Réservations" },
  { valeur: "devis", label: "Devis" },
  { valeur: "catalogue", label: "Tarifs et créneaux" },
  { valeur: "acces", label: "Connexions" },
];

export default async function PageJournal({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  const { f } = await searchParams;
  const actif = ONGLETS.some((o) => o.valeur === f)
    ? (f as FamilleJournal | "tout")
    : "tout";

  const toutes = await lireJournal();
  const entrees = actif === "tout" ? toutes : toutes.filter((e) => e.famille === actif);

  // La colonne « qui » ne se justifie que si elle apprend quelque chose.
  const acteurs = new Set(toutes.map((e) => e.acteur));
  const plusieursActeurs = acteurs.size > 1;

  // Regroupement par journée, comme la liste des réservations : « mardi 12 »
  // écrit une fois, puis des heures. Répété sur chaque ligne, le jour occupait
  // la place et masquait l'ordre des événements dans la journée.
  const parJour = new Map<string, EntreeJournal[]>();
  for (const e of entrees) {
    const liste = parJour.get(e.jourLabel);
    if (liste) liste.push(e);
    else parJour.set(e.jourLabel, [e]);
  }

  return (
    <div>
      <h1 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
        <Bouclier className="size-6 text-field" /> Journal
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Les 150 dernières actions du back-office, consultation seule.
        {!plusieursActeurs && acteurs.size === 1 && (
          <> Toutes par {[...acteurs][0]}.</>
        )}
      </p>

      <nav className="mt-4 flex flex-wrap gap-2">
        {ONGLETS.map((o) => {
          const n =
            o.valeur === "tout"
              ? toutes.length
              : toutes.filter((e) => e.famille === o.valeur).length;
          return (
            <LienOnglet
              key={o.valeur}
              href={o.valeur === "tout" ? "/admin/journal" : `/admin/journal?f=${o.valeur}`}
              actif={o.valeur === actif}
            >
              {o.label}
              {/* Le compteur évite d'ouvrir un onglet pour y trouver le vide. */}
              <span aria-hidden className="ml-1.5 tabular-nums opacity-60">
                {n}
              </span>
              <span className="sr-only">
                {" "}
                — {n} action{n > 1 ? "s" : ""}
              </span>
            </LienOnglet>
          );
        })}
      </nav>

      {entrees.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-border bg-card p-6 text-muted-foreground">
          {actif === "tout"
            ? "Aucune action enregistrée pour l’instant."
            : "Aucune action de ce type dans les 150 dernières."}
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {[...parJour].map(([jour, liste]) => (
            <section key={jour}>
              <h2 className="text-sm font-semibold text-muted-foreground">{jour}</h2>
              <ul className="mt-2 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {liste.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3">
                    {/*
                      L'heure d'abord, en chasse fixe : les lignes s'alignent,
                      et l'œil descend la colonne sans la chercher.
                    */}
                    <span className="shrink-0 tabular-nums text-sm text-muted-foreground">
                      {e.heure}
                    </span>

                    <span className="min-w-0 flex-1 text-sm">
                      <span className="font-medium">{e.libelle}</span>
                      {e.precision && (
                        <span className="text-muted-foreground"> — {e.precision}</span>
                      )}
                      {plusieursActeurs && (
                        <span className="text-muted-foreground"> · {e.acteur}</span>
                      )}
                    </span>

                    {/*
                      La cible mène à la chose concernée. Elle s'affichait en
                      chasse fixe, sans lien : lire « OW-JRUMAL8Y » puis aller
                      le recopier dans la recherche était le seul moyen de voir
                      de quelle réservation il s'agissait.
                    */}
                    {e.cible &&
                      (e.lien ? (
                        <Link
                          href={e.lien}
                          className="shrink-0 rounded font-mono text-xs text-field underline underline-offset-2 hover:text-foreground"
                        >
                          {e.cible}
                        </Link>
                      ) : (
                        <span className="shrink-0 break-all font-mono text-xs text-muted-foreground">
                          {e.cible}
                        </span>
                      ))}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
