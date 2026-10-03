"use client";

import Link from "next/link";
import { useState } from "react";
import type { PointJour } from "@/lib/db/audience";
import { capitaliser } from "@/lib/temps";

/**
 * Visites par jour — le graphique interactif de la page Analyse.
 *
 * Demandé par Mathis le 3 octobre 2026 : le graphique ne faisait que montrer
 * des barres, et leur valeur ne se lisait qu'au survol d'une infobulle native
 * — invisible sur téléphone, où Brahim consulte le back-office.
 *
 * CE QU'IL FAIT MAINTENANT.
 *
 *   - Survoler une barre, ou la toucher, affiche le détail du jour dans le
 *     bandeau au-dessus : visites, pages vues et réservations. La valeur est en
 *     gras, la date en retrait — on sait déjà quel jour on vise, on cherche le
 *     nombre.
 *   - Toucher une barre la SÉLECTIONNE : le détail reste affiché quand le doigt
 *     se lève ou que la souris s'en va. « Voir ce jour » ouvre alors toute la
 *     page Analyse sur cette seule journée.
 *   - Au clavier, chaque barre est un bouton : Tab pour passer de l'une à
 *     l'autre, le détail suit le focus.
 *
 * LA ZONE SENSIBLE EST LA COLONNE ENTIÈRE, pas la barre peinte. Une journée à
 * une visite fait 4 px de haut : personne ne la vise au doigt.
 *
 * UNE SEULE SÉRIE, UNE SEULE TEINTE (voir l'en-tête de la page) : pas de
 * légende, le titre de la carte la nomme. Les pages vues et les réservations
 * ne sont pas dessinées — ce sont d'autres échelles, et deux axes dans un même
 * graphique se lisent toujours de travers. Elles vivent dans le détail.
 */

const JOUR_LONG = new Intl.DateTimeFormat("fr-BE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const JOUR_COURT = new Intl.DateTimeFormat("fr-BE", { day: "numeric", month: "short", timeZone: "UTC" });

/** `jour` est un jour (« 2026-10-03 ») : lu à midi UTC, il ne bascule jamais à la veille. */
function date(jour: string): Date {
  return new Date(`${jour}T12:00:00Z`);
}

function pluriel(n: number, mot: string): string {
  return `${n} ${mot}${n > 1 ? "s" : ""}`;
}

/**
 * Le haut de l'axe : le maximum arrondi au-dessus, par pas de 5, 10, 50…
 * Un plafond trop large (50 pour un maximum de 30) écrasait les barres dans
 * le bas du graphique.
 */
function plafond(max: number): number {
  if (max <= 4) return Math.max(1, max);
  const puissance = 10 ** Math.floor(Math.log10(max));
  const pas = max / puissance < 5 ? puissance / 2 : puissance;
  return Math.ceil(max / pas) * pas;
}

export function GraphiqueVisites({ points }: { points: PointJour[] }) {
  const [survol, setSurvol] = useState<number | null>(null);
  const [choisi, setChoisi] = useState<number | null>(null);
  const actif = survol ?? choisi;
  const p = actif !== null ? points[actif] : null;

  const haut = plafond(Math.max(0, ...points.map((x) => x.visites)));
  const graduations = haut >= 2 ? [haut, haut / 2, 0] : [haut, 0];
  const serre = points.length > 60;

  return (
    <div>
      {/* Le détail du jour visé — une ligne de hauteur fixe, pour que rien ne saute. */}
      <div
        aria-live="polite"
        className="mb-3 flex min-h-12 flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-white/[0.04] px-3 py-2 text-sm"
      >
        {p ? (
          <>
            <span className="text-muted-foreground">{capitaliser(JOUR_LONG.format(date(p.jour)))}</span>
            <span className="font-bold text-foreground">{pluriel(p.visites, "visite")}</span>
            <span className="text-muted-foreground">{p.pagesVues} page{p.pagesVues > 1 ? "s" : ""} vue{p.pagesVues > 1 ? "s" : ""}</span>
            <span className="text-muted-foreground">{pluriel(p.reservations, "réservation")}</span>
            <Link
              href={`/admin/analyse?du=${p.jour}&au=${p.jour}`}
              className="ml-auto font-medium text-field underline-offset-4 hover:underline"
            >
              Voir ce jour →
            </Link>
          </>
        ) : (
          <span className="text-muted-foreground">
            Survolez ou touchez une barre pour voir le détail du jour.
          </span>
        )}
      </div>

      <div className="flex">
        {/* Graduations, à gauche : discrètes, elles situent sans compter. */}
        <div className="relative mr-2 h-36 w-6 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground" aria-hidden>
          {graduations.map((g) => (
            <span key={g} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - g / haut) * 100}%` }}>
              {Math.round(g)}
            </span>
          ))}
        </div>

        <div className="relative h-36 min-w-0 flex-1">
          {graduations.map((g) => (
            <div
              key={g}
              aria-hidden
              className="pointer-events-none absolute inset-x-0 border-t border-border/50"
              style={{ top: `${(1 - g / haut) * 100}%` }}
            />
          ))}

          <div
            className={`relative flex h-full items-end ${serre ? "gap-0" : "gap-[2px]"}`}
            onPointerLeave={() => setSurvol(null)}
          >
            {points.map((pt, i) => {
              const hauteur = (pt.visites / haut) * 100;
              const allume = actif === i;
              const etiquette = `${JOUR_LONG.format(date(pt.jour))} : ${pluriel(pt.visites, "visite")}`;
              return (
                <button
                  key={pt.jour}
                  type="button"
                  aria-label={etiquette}
                  aria-pressed={choisi === i}
                  onPointerEnter={(e) => {
                    // Au doigt, le survol n'existe pas : c'est le toucher qui choisit.
                    if (e.pointerType === "mouse") setSurvol(i);
                  }}
                  onFocus={() => setSurvol(i)}
                  onBlur={() => setSurvol(null)}
                  onClick={() => setChoisi((c) => (c === i ? null : i))}
                  className="group flex h-full min-w-0 flex-1 cursor-pointer items-end outline-none"
                >
                  <span
                    className={`block w-full rounded-t-[4px] transition-[opacity,filter] ${
                      pt.visites > 0 ? "bg-field" : "bg-field/40"
                    } ${actif !== null && !allume ? "opacity-45" : "opacity-100"} ${
                      allume ? "brightness-110 ring-2 ring-foreground/70 ring-offset-2 ring-offset-card" : ""
                    } group-focus-visible:ring-2 group-focus-visible:ring-field`}
                    style={{ height: pt.visites > 0 ? `max(${hauteur}%, 4px)` : "2px" }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-2 ml-8 flex justify-between text-xs text-muted-foreground">
        <span>{JOUR_COURT.format(date(points[0].jour))}</span>
        <span>{JOUR_COURT.format(date(points[points.length - 1].jour))}</span>
      </div>
    </div>
  );
}
