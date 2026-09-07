import Link from "next/link";
import { lireAudience } from "@/lib/db/audience";
import { Graphique } from "@/components/icons";

/**
 * Tableau de bord d'audience.
 *
 * UNE SEULE TEINTE, PARTOUT, ET C'EST MESURÉ. Les deux accents du site,
 * « field » (#f4b23f) et « kick » (#f9a03f), sont séparés de ΔE 4,4 en vision
 * normale — le seuil de lisibilité est à 15 — et de 2,6 en deutéranopie. Les
 * opposer dans un même graphique donnerait deux séries que personne ne peut
 * distinguer, daltonien ou non. Chaque graphique ne porte donc qu'une série,
 * dans la seule teinte « field », et tout ce qui devrait être « une autre
 * couleur » est exprimé par du texte : un chiffre, un libellé, un écart.
 *
 * Conséquence heureuse : aucune légende n'est nécessaire nulle part, puisque
 * le titre nomme la série.
 */

export const dynamic = "force-dynamic";

const PERIODES = [
  { jours: 7, label: "7 jours" },
  { jours: 30, label: "30 jours" },
  { jours: 90, label: "90 jours" },
];

const NOMBRE = new Intl.NumberFormat("fr-BE");

function Carte({
  titre,
  aide,
  children,
}: {
  titre: string;
  aide?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-semibold">{titre}</h2>
      {aide && <p className="mt-0.5 text-sm text-muted-foreground">{aide}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Grand chiffre. Pas un graphique : une seule valeur ne se dessine pas. */
function Chiffre({ valeur, label }: { valeur: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="font-[family-name:var(--font-heading)] text-3xl font-bold text-field">
        {valeur}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * Classement horizontal. La barre est un repère de proportion ; la valeur est
 * écrite, elle n'est jamais à déduire de la longueur.
 */
function Classement({
  lignes,
  vide,
}: {
  lignes: { cle: string; n: number }[];
  vide: string;
}) {
  if (lignes.length === 0) {
    return <p className="text-sm text-muted-foreground">{vide}</p>;
  }
  const max = Math.max(...lignes.map((l) => l.n));
  return (
    <ul className="space-y-2">
      {lignes.map((l) => (
        <li key={l.cle}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate" title={l.cle}>
              {l.cle}
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {NOMBRE.format(l.n)}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-field"
              style={{ width: `${max > 0 ? (l.n / max) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function PageAnalyse({
  searchParams,
}: {
  searchParams: Promise<{ jours?: string }>;
}) {
  const { jours: brut } = await searchParams;
  const demande = Number(brut);
  const jours = PERIODES.some((p) => p.jours === demande) ? demande : 30;

  const a = await lireAudience(jours);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
          <Graphique className="size-6 text-field" /> Analyse
        </h1>
        {/* Les filtres tiennent sur une rangée, au-dessus des graphiques. */}
        <nav className="flex flex-wrap gap-2">
          {PERIODES.map((p) => (
            <Link
              key={p.jours}
              href={`/admin/analyse?jours=${p.jours}`}
              aria-current={p.jours === jours ? "page" : undefined}
              className={`inline-flex min-h-8 items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 active:scale-[0.97] ${
                p.jours === jours
                  ? "bg-field/15 text-field ring-1 ring-field/40"
                  : "border border-border text-muted-foreground hover:border-field/40 hover:text-foreground"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Fréquentation du site public. Seuls les visiteurs ayant accepté la mesure sont comptés :
        les chiffres sont donc un plancher, jamais un total.
      </p>

      {!a ? (
        <p className="mt-6 rounded-2xl border border-border bg-card p-6 text-muted-foreground">
          La base n&apos;est pas joignable : aucune mesure ne peut être lue.
        </p>
      ) : a.visites === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <p className="font-medium">Aucune visite mesurée sur cette période.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            C&apos;est attendu tant que le domaine n&apos;est pas basculé : le site n&apos;a pas
            encore de public. Les mesures apparaîtront d&apos;elles-mêmes ensuite.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Chiffre valeur={NOMBRE.format(a.visites)} label="visites" />
            <Chiffre valeur={NOMBRE.format(a.pagesVues)} label="pages vues" />
            <Chiffre valeur={NOMBRE.format(a.reservations)} label="réservations" />
            <Chiffre
              valeur={a.tauxConversion === null ? "—" : `${a.tauxConversion.toFixed(1)} %`}
              label="taux de conversion"
            />
          </div>

          <Carte
            titre="Visites par jour"
            aide={`Sur les ${jours} derniers jours, jours sans visite compris.`}
          >
            <Journalier points={a.parJour} />
          </Carte>

          <Carte
            titre="Où les gens abandonnent"
            aide="Chaque étape compte des visites distinctes, pas des clics."
          >
            <Tunnel etapes={a.tunnel} />
          </Carte>

          <div className="grid gap-4 md:grid-cols-2">
            <Carte titre="Pages les plus vues">
              <Classement lignes={a.pages} vide="Aucune page vue." />
            </Carte>
            <Carte titre="D’où viennent les visiteurs" aide="Vide = accès direct ou lien sans référent.">
              <Classement lignes={a.provenances} vide="Personne n’est arrivé par un lien externe." />
            </Carte>
            <Carte titre="Appareils">
              <Classement lignes={a.appareils} vide="Aucune donnée." />
            </Carte>
            <Carte titre="Pays">
              <Classement lignes={a.pays} vide="Aucune donnée." />
            </Carte>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Visites par jour.
 *
 * Barres et non courbe : une visite est un compte discret, et sur 7 jours une
 * courbe à sept points suggère une continuité qui n'existe pas. Les extrémités
 * sont arrondies et ancrées à la ligne de base ; un écart de 2 px sépare les
 * barres, ce qui suffit à les distinguer sans grille.
 */
function Journalier({ points }: { points: { jour: string; visites: number }[] }) {
  const max = Math.max(1, ...points.map((p) => p.visites));
  const jourCourt = new Intl.DateTimeFormat("fr-BE", { day: "numeric", month: "short" });

  return (
    <div>
      <div className="flex h-32 items-end gap-[2px]" role="list">
        {points.map((p) => {
          const hauteur = (p.visites / max) * 100;
          const label = `${jourCourt.format(new Date(p.jour))} : ${p.visites} visite${
            p.visites > 1 ? "s" : ""
          }`;
          return (
            <div
              key={p.jour}
              role="listitem"
              aria-label={label}
              title={label}
              className="group relative flex h-full flex-1 items-end"
            >
              {/* Zone de survol pleine hauteur : viser une barre de 3 px de
                  haut serait impossible, surtout au doigt. */}
              <div
                className="w-full rounded-t bg-field transition-opacity group-hover:opacity-80"
                style={{ height: `${Math.max(hauteur, p.visites > 0 ? 4 : 1)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{jourCourt.format(new Date(points[0].jour))}</span>
        <span className="tabular-nums">max {max}</span>
        <span>{jourCourt.format(new Date(points[points.length - 1].jour))}</span>
      </div>
    </div>
  );
}

/**
 * Entonnoir.
 *
 * La perte est écrite, pas coloriée : c'est le seul encodage que tout le monde
 * lit, et la palette du site n'offre pas deux teintes distinguables (voir
 * l'en-tête du fichier). Le chiffre qui compte est la dernière ligne — les
 * visiteurs qui avaient choisi leur créneau et sont partis quand même.
 */
function Tunnel({
  etapes,
}: {
  etapes: { nom: string; label: string; visites: number; part: number; perte: number }[];
}) {
  return (
    <ol className="space-y-3">
      {etapes.map((e, i) => (
        <li key={e.nom}>
          {/*
            Sans `min-w-0` sur le libellé, un intitulé long poussait le nombre
            à la ligne suivante : il se retrouvait aligné à gauche alors que
            les quatre autres étaient à droite. On laisse donc le TEXTE aller
            à la ligne, et le nombre reste à sa place.
          */}
          <div className="flex items-baseline justify-between gap-x-3 text-sm">
            <span className="min-w-0 font-medium">
              <span className="text-muted-foreground">{i + 1}. </span>
              {e.label}
            </span>
            <span className="shrink-0 tabular-nums">
              {NOMBRE.format(e.visites)}
              <span className="ml-2 text-muted-foreground">
                {(e.part * 100).toFixed(0)} %
              </span>
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-field"
              style={{ width: `${Math.min(100, e.part * 100)}%` }}
            />
          </div>
          {i > 0 && e.perte > 0 && (
            <p className="mt-1 text-xs text-destructive">
              −{(e.perte * 100).toFixed(0)} % par rapport à l’étape précédente
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
