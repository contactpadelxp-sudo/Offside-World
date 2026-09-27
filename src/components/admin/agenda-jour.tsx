import Link from "next/link";
import type { Agenda, BlocPlace } from "@/lib/agenda";

/**
 * La grille horaire d'une journée : une colonne par Fun zone, de 9h à minuit.
 *
 * Rendue côté serveur, sans état : chaque bloc est un lien. Une réservation
 * ouvre sa fiche sous la grille (`?r=`), une demande de devis mène à sa fiche
 * dans « Devis », un créneau libre ou fermé mène au planning du jour, où il se
 * ferme et se rouvre. L'agenda montre ; les gestes restent là où ils vivaient.
 *
 * 48 PIXELS PAR HEURE. Un anniversaire de deux heures fait 96 px : assez pour
 * l'heure, le prénom et la formule sur trois lignes, même sur un téléphone où
 * chaque colonne fait moins de 160 px. La journée entière tient en 720 px.
 */

const PX_PAR_MINUTE = 48 / 60;

function hauteur(minutes: number): number {
  return minutes * PX_PAR_MINUTE;
}

function hhmm(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function AgendaJour({
  agenda,
  jour,
  selection,
  maintenant,
}: {
  agenda: Agenda;
  jour: string;
  /** Identifiant de la réservation dont la fiche est ouverte. */
  selection: string | null;
  /** Minutes depuis minuit à Bruxelles, seulement si le jour affiché est aujourd'hui. */
  maintenant: number | null;
}) {
  const total = agenda.fin - agenda.debut;
  const heures = Array.from({ length: total / 60 + 1 }, (_, i) => agenda.debut + i * 60);

  return (
    <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
      {/* En-têtes des colonnes */}
      <div className="flex pl-11 sm:pl-14">
        {agenda.colonnes.map((c) => (
          <div
            key={c.espace}
            className="min-w-0 flex-1 truncate px-1 pb-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {c.espace}
          </div>
        ))}
      </div>

      <div className="relative flex" style={{ height: hauteur(total) }}>
        {/* Heures, à gauche */}
        <div className="relative w-11 shrink-0 sm:w-14" aria-hidden>
          {heures.map((h) => (
            <span
              key={h}
              className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-muted-foreground"
              style={{ top: hauteur(h - agenda.debut) }}
            >
              {hhmm(h)}
            </span>
          ))}
        </div>

        <div className="relative flex min-w-0 flex-1">
          {/* Lignes des heures */}
          {heures.map((h) => (
            <div
              key={h}
              aria-hidden
              className="pointer-events-none absolute inset-x-0 border-t border-border/60"
              style={{ top: hauteur(h - agenda.debut) }}
            />
          ))}

          {/*
            SPORT-FINDER, SUR TOUTE LA LARGEUR. Les deux terrains y sont loués
            par l'autre outil : rien de ce qui s'y passe n'est dans cette base,
            mais une journée vue d'ici ne doit pas sembler finir à 18h.
          */}
          {agenda.sportFinder && (
            <div
              className="pointer-events-none absolute inset-x-0 z-0 rounded-md bg-white/[0.035]"
              style={{
                top: hauteur(Math.max(agenda.sportFinder.debut, agenda.debut) - agenda.debut),
                height: hauteur(
                  Math.min(agenda.sportFinder.fin, agenda.fin) -
                    Math.max(agenda.sportFinder.debut, agenda.debut)
                ),
              }}
            >
              <p className="px-2 pt-1.5 text-[11px] text-muted-foreground">
                {hhmm(agenda.sportFinder.debut)} – {hhmm(agenda.sportFinder.fin)} · Sport-Finder (
                {agenda.sportFinder.libelle})
              </p>
            </div>
          )}

          {agenda.colonnes.map((c) => (
            <div key={c.espace} className="relative min-w-0 flex-1 border-l border-border/60">
              {c.blocs.map((b) => (
                <Bloc
                  key={`${b.genre}-${b.debut}-${b.voie}`}
                  bloc={b}
                  debutGrille={agenda.debut}
                  jour={jour}
                  selectionne={b.genre === "reservation" && b.reservation.id === selection}
                />
              ))}
            </div>
          ))}

          {maintenant !== null && maintenant >= agenda.debut && maintenant <= agenda.fin && (
            <div
              aria-label={`Il est ${hhmm(maintenant)}`}
              className="pointer-events-none absolute inset-x-0 z-20 border-t-2 border-destructive"
              style={{ top: hauteur(maintenant - agenda.debut) }}
            >
              <span className="absolute -left-1.5 -top-[5px] size-2 rounded-full bg-destructive" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Bloc({
  bloc: b,
  debutGrille,
  jour,
  selectionne,
}: {
  bloc: BlocPlace;
  debutGrille: number;
  jour: string;
  selectionne: boolean;
}) {
  const style = {
    top: hauteur(b.debut - debutGrille) + 1,
    height: Math.max(hauteur(b.fin - b.debut) - 2, 18),
    left: `calc(${(b.voie / b.voies) * 100}% + 2px)`,
    width: `calc(${100 / b.voies}% - 4px)`,
  };
  const horaire = `${hhmm(b.debut)} – ${hhmm(b.fin)}`;
  const base = "absolute z-10 overflow-hidden rounded-lg px-1.5 py-1 text-[11px] leading-tight transition-colors sm:px-2 sm:text-xs";

  if (b.genre === "reservation") {
    const r = b.reservation;
    const aConfirmer = r.statut === "en_attente";
    const qui = r.enfantPrenom
      ? `${r.enfantPrenom}${r.enfantAge ? `, ${r.enfantAge} ans` : ""}`
      : r.clientNom;
    return (
      <Link
        href={`/admin?jour=${jour}&r=${r.id}#fiche`}
        scroll={false}
        style={style}
        aria-label={`${horaire}, ${qui}, ${r.reference}${aConfirmer ? ", à confirmer" : ""}`}
        className={`${base} border ${
          aConfirmer
            ? "border-dashed border-kick/70 bg-kick/10 hover:bg-kick/20"
            : "border-field/60 bg-field/15 hover:bg-field/25"
        } ${selectionne ? "ring-2 ring-field" : ""}`}
      >
        <span className="block tabular-nums text-muted-foreground">{horaire}</span>
        <span className="block truncate font-semibold text-foreground">{qui}</span>
        <span className="block truncate text-muted-foreground">
          {[r.formuleNom, r.nbEnfants ? `${r.nbEnfants} enf.` : null].filter(Boolean).join(" · ")}
        </span>
        {(aConfirmer || r.paiementEnCours) && (
          <span className="mt-0.5 block truncate font-semibold text-kick">
            {r.paiementEnCours ? "Paiement en cours" : "À confirmer"}
          </span>
        )}
      </Link>
    );
  }

  if (b.genre === "devis") {
    return (
      <Link
        href={`/admin/devis?toutes=1#devis-${b.id}`}
        style={style}
        className={`${base} border border-white/30 bg-white/[0.07] hover:bg-white/[0.12]`}
      >
        <span className="block tabular-nums text-muted-foreground">{horaire}</span>
        <span className="block truncate font-semibold text-foreground">Team building</span>
        <span className="block truncate text-muted-foreground">Demande {b.reference}</span>
      </Link>
    );
  }

  if (b.genre === "ferme") {
    return (
      <Link
        href={`/admin/creneaux?jour=${jour}`}
        style={style}
        title="Fermé à la vente — par exemple un anniversaire pris par téléphone"
        className={`${base} border border-border bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,rgba(255,255,255,0.05)_6px,rgba(255,255,255,0.05)_12px)] text-muted-foreground hover:border-white/30`}
      >
        <span className="block tabular-nums">{horaire}</span>
        <span className="block font-semibold text-foreground/80">Fermé</span>
      </Link>
    );
  }

  return (
    <Link
      href={`/admin/creneaux?jour=${jour}`}
      style={style}
      className={`${base} border border-dashed border-white/10 text-muted-foreground/80 hover:border-white/25`}
    >
      <span className="block tabular-nums">{horaire}</span>
      <span className="block">Libre</span>
    </Link>
  );
}
