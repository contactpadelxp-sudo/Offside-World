"use client";

import Link from "next/link";
import { Photo } from "@/components/photo";
import { FlecheDroite } from "@/components/icons";
import type { ActiviteVue } from "@/components/activites/use-activites";

/**
 * Les trois activités, présentées dans le hero de la page d'accueil.
 *
 * POURQUOI CE N'EST PAS LA CARTE DE `/reservation` RECOPIÉE. La demande était
 * de mettre « les 3 types de réservations » à la place de la photo du hero, en
 * laissant la page Réserver telle quelle. Reprendre son JSX aurait été le plus
 * flatteur à raconter, et le plus mauvais à l'usage : ces cartes sont en 4/5,
 * format portrait, pensées pour une page où elles sont le seul contenu. Empilées
 * dans un hero qui porte déjà un titre, un sous-titre, deux boutons et trois
 * chiffres, elles poussaient tout le reste hors de l'écran sur un téléphone.
 *
 * Ce qui doit être commun entre les deux endroits, c'est CE QU'ON DIT — titres,
 * descriptions, prix, photos — et c'est `useActivites()` qui s'en charge. La
 * mise en forme, elle, a le droit de différer, parce que le contexte diffère.
 *
 * DEUX RENDUS, ET C'EST LE CŒUR DU COMPOSANT.
 *
 *   - Sous 640 px : TROIS LIGNES compactes. Le visiteur voit les trois
 *     activités d'un seul coup d'œil, sans défiler ni deviner qu'il faut
 *     balayer. Un carrousel aurait montré une carte et demie — donc caché le
 *     Bubble Foot, qui est justement ce que le hero ne mentionne nulle part
 *     ailleurs.
 *   - À partir de 640 px : trois vraies cartes, photo en 3/2. Le paysage plutôt
 *     que le portrait de `/reservation` : la place perdue en hauteur est
 *     exactement celle que le hero n'a pas.
 *
 * AUCUNE IMAGE N'EST PRÉCHARGÉE ICI. `Photo` force déjà `loading="eager"` ; y
 * ajouter `preload` sur trois images ferait se concurrencer trois candidats LCP,
 * ce que la documentation de `next/image` déconseille explicitement pour
 * plusieurs images susceptibles d'être l'élément le plus grand selon la taille
 * d'écran. Le `sizes` est en revanche ajusté au format réel des cartes, sans
 * quoi le navigateur téléchargerait des images calibrées pour la pleine largeur.
 */
export function ActivitesHero({ activites }: { activites: ActiviteVue[] }) {
  return (
    <div className="mt-8">
      {/* ── Téléphone : trois lignes, les trois visibles ── */}
      <ul className="flex flex-col gap-2 text-left sm:hidden">
        {activites.map((a) => (
          <li key={a.id}>
            <Link
              href={a.href}
              className={`flex min-h-14 items-center gap-3 rounded-2xl border bg-white/[0.05] px-3 py-2.5 backdrop-blur-sm transition-colors duration-300 ${a.border}`}
            >
              <span
                className={`inline-flex shrink-0 items-center justify-center rounded-xl p-2 ${a.iconBg}`}
              >
                <a.icone className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold leading-tight">
                  {a.titre}
                </span>
                <span className={`block text-xs font-medium ${a.accentText}`}>{a.tag}</span>
              </span>
              <FlecheDroite className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>

      {/* ── À partir de 640 px : trois cartes ── */}
      <div className="hidden gap-4 text-left sm:grid sm:grid-cols-3">
        {activites.map((a) => (
          <Link
            key={a.id}
            href={a.href}
            /*
              `block` n'est pas décoratif. Un <a> est `display: inline` par
              défaut, et un élément inline ignore `h-full` : sans cette classe,
              les trois cartes ne s'alignent plus en bas dès que l'une d'elles a
              un titre sur deux lignes — ce qui est le cas de « Bubble Foot &
              Team Building ». Le <button> de /reservation n'avait pas ce
              problème, étant `inline-block`.
            */
            className={`group block h-full overflow-hidden rounded-2xl border-2 bg-card/80 backdrop-blur-sm transition-all duration-500 ${a.border}`}
          >
            <div className="relative aspect-[3/2] overflow-hidden">
              {a.img ? (
                <Photo
                  src={a.img}
                  alt={a.titre}
                  sizes="(max-width: 1024px) 33vw, 320px"
                  className={`object-cover ${a.imgPosition ?? "object-center"} transition-transform duration-700 group-hover:scale-105`}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div aria-hidden className="absolute inset-0 dot-grid fade-mask-radial opacity-70" />
                  <div
                    aria-hidden
                    className={`absolute left-1/2 top-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl ${a.glow}`}
                  />
                  <a.icone className="relative size-10 text-foreground/25" />
                </div>
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-card" />
              <div
                className={`absolute left-3 top-3 inline-flex items-center rounded-full bg-black/65 px-2.5 py-1 text-xs font-semibold ring-1 ring-white/15 backdrop-blur-md ${a.accentText}`}
              >
                {a.tag}
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-4 pb-4 pt-1">
              <span
                className={`inline-flex shrink-0 items-center justify-center rounded-xl p-2 ${a.iconBg} transition-transform duration-500 group-hover:scale-110`}
              >
                <a.icone className="size-4" />
              </span>
              <span className="min-w-0 flex-1 text-[15px] font-bold leading-tight">{a.titre}</span>
              <FlecheDroite
                className={`size-4 shrink-0 ${a.accentText} transition-transform duration-300 group-hover:translate-x-0.5`}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
