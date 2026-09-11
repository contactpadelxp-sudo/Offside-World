"use client";

import Link from "next/link";
import { Photo } from "@/components/photo";
import { FlecheDroite, Ballon } from "@/components/icons";
import { usePhoto } from "@/components/photos-provider";
import { BOUNCE_PARK } from "@/data/bounce-park";
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
  const planParc = usePhoto("bounce-park");

  return (
    /*
      `mt-6` et non `mt-8` : la quatrième carte ajoute une ligne sur téléphone,
      et chaque pixel repris ici est un pixel qui la garde au-dessus de la
      ligne de flottaison. Voir la mesure dans le commentaire du hero.
    */
    <div className="mt-6">
      {/*
        ── Téléphone : quatre lignes, les quatre au-dessus de la ligne ──

        Le rembourrage est à `py-2` et non `py-2.5`, et le `min-h-13` ne mord
        pas : la hauteur réelle d'une ligne vient de son contenu, pas du
        minimum. C'est la mesure au navigateur qui l'a montré — baisser le
        `min-h` de 56 à 52 n'a rien changé du tout, les lignes faisaient 58 px
        dans les deux cas. Avec `py-2` elles en font 54.

        La cible tactile reste très au-dessus du minimum de 24 px exigé par le
        critère 2.5.8 du WCAG 2.2.
      */}
      <ul className="flex flex-col gap-1.5 text-left sm:hidden">
        {activites.map((a) => (
          <li key={a.id}>
            <Link
              href={a.href}
              className={`flex min-h-13 items-center gap-3 rounded-2xl border bg-white/[0.05] px-3 py-2 backdrop-blur-sm transition-colors duration-300 ${a.border}`}
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

        {/*
          LE TEASER N'EST PAS UN LIEN, sur mobile comme ailleurs. Un <li> qui
          contient un <div> n'entre pas dans l'ordre de tabulation et n'est pas
          annoncé comme cliquable : un lecteur d'écran dira « Bounce Park,
          bientôt », et s'arrêtera là. C'est exactement ce qu'on veut d'une
          annonce.
        */}
        <li>
          <div className="flex min-h-13 items-center gap-3 rounded-2xl border border-dashed border-white/25 bg-white/[0.03] px-3 py-2 backdrop-blur-sm">
            <span className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white/10 p-2 text-foreground/70">
              <Ballon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold leading-tight text-foreground/85">
                {BOUNCE_PARK.titre}
              </span>
              <span className="block text-xs font-medium text-muted-foreground">
                {BOUNCE_PARK.tag}
              </span>
            </span>
          </div>
        </li>
      </ul>

      {/* ── À partir de 640 px : quatre cartes ── */}
      {/*
        QUATRE COLONNES DÈS 640 PX, et non deux puis quatre.

        La version à deux colonnes semblait prudente : des cartes plus larges,
        des photos plus lisibles. Mesurée, elle coûtait beaucoup trop cher —
        sur une tablette en portrait (768 px), les quatre cartes passaient sur
        DEUX rangées et le hero montait à 1178 px contre 849 px sur ordinateur.
        Les trois chiffres et l'indicateur de défilement tombaient tous les deux
        sous la ligne de flottaison, et un seul pixel de largeur (1023 -> 1024)
        retirait 558 px à la hauteur de la page.

        Quatre colonnes tiennent sur une rangée à toutes les largeurs. Le prix à
        payer est un titre plus petit dans la bande intermédiaire, ce qui est
        très peu cher comparé à un hero qui double de hauteur.
      */}
      <div className="hidden gap-3 text-left sm:grid sm:grid-cols-4">
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
                  /*
                    `alt` VIDE, et c'est volontaire. Le titre est déjà écrit en
                    toutes lettres dans le même lien : le répéter ici faisait
                    annoncer « Anniversaire Dès 180 € Anniversaire » dans la
                    liste des liens d'un lecteur d'écran. Une image qui
                    n'ajoute rien au texte qui l'accompagne doit être
                    transparente (technique H67 du WCAG).
                  */
                  alt=""
                  /*
                    Décrit la grille RÉELLE. Il annonçait encore « 33vw », soit
                    trois colonnes, alors que la grille en a quatre : le
                    navigateur choisissait un fichier calibré pour une carte
                    une fois et demie trop large.
                  */
                  sizes="(max-width: 1024px) 25vw, 240px"
                  differe
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
                className={`absolute left-3 top-3 inline-flex items-center rounded-full bg-black/80 px-2.5 py-1 text-xs font-semibold ring-1 ring-white/15 backdrop-blur-md ${a.accentText}`}
              >
                {a.tag}
              </div>
            </div>

            {/*
              EMPILÉ SOUS 1024 PX, EN LIGNE AU-DELÀ.

              Mesuré à 640 px : la carte fait 143 px, dont 32 de rembourrage,
              32 d'icône et 16 de flèche — il restait 53 px pour le titre, et
              « Bubble Foot & Team Building » y partait sur CINQ lignes, ce qui
              déséquilibrait toute la rangée. Empilé, le titre dispose de la
              largeur entière.

              La flèche disparaît dans cette bande : la carte entière est déjà
              un lien, elle ne faisait que le rappeler — et elle le rappelait au
              prix du titre.
            */}
            <div className="flex flex-col gap-1.5 px-3 pb-3 pt-1 lg:flex-row lg:items-center lg:gap-2.5 lg:px-4 lg:pb-4">
              <span
                className={`inline-flex w-fit shrink-0 items-center justify-center rounded-xl p-2 ${a.iconBg} transition-transform duration-500 group-hover:scale-110`}
              >
                <a.icone className="size-4" />
              </span>
              <span className="min-w-0 flex-1 text-[13px] font-bold leading-tight lg:text-[15px]">{a.titre}</span>
              <FlecheDroite
                className={`hidden size-4 shrink-0 lg:block ${a.accentText} transition-transform duration-300 group-hover:translate-x-0.5`}
              />
            </div>
          </Link>
        ))}

        {/*
          LA CARTE DU BOUNCE PARK — UN <div>, PAS UN <a>.

          Il n'y a rien au bout : ni page, ni créneau, ni tarif. Un lien mort
          est pire qu'une carte inerte, parce qu'il promet une réponse qu'il
          n'a pas — et le visiteur qui clique pour rien ne reclique pas sur les
          trois autres.

          Le trait discontinu et l'absence de flèche disent la même chose que la
          pastille « Bientôt » : ceci s'annonce, ne se réserve pas. Trois signaux
          qui vont dans le même sens, parce qu'un seul se rate.
        */}
        <div className="block h-full overflow-hidden rounded-2xl border-2 border-dashed border-white/20 bg-card/60 backdrop-blur-sm">
          <div className="relative aspect-[3/2] overflow-hidden">
            {planParc ? (
              <Photo
                src={planParc}
                alt=""
                sizes="(max-width: 1024px) 25vw, 240px"
                differe
                className="object-cover object-center opacity-80"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div aria-hidden className="absolute inset-0 dot-grid fade-mask-radial opacity-70" />
                <div
                  aria-hidden
                  className="absolute left-1/2 top-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl"
                />
                <Ballon className="relative size-10 text-foreground/25" />
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-card" />
            <div className="absolute left-3 top-3 inline-flex items-center rounded-full bg-black/65 px-2.5 py-1 text-xs font-semibold text-foreground/80 ring-1 ring-white/15 backdrop-blur-md">
              {BOUNCE_PARK.tag}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 px-3 pb-3 pt-1 lg:flex-row lg:items-center lg:gap-2.5 lg:px-4 lg:pb-4">
            <span className="inline-flex w-fit shrink-0 items-center justify-center rounded-xl bg-white/10 p-2 text-foreground/70">
              <Ballon className="size-4" />
            </span>
            <span className="min-w-0 flex-1 text-[13px] font-bold leading-tight text-foreground/85 lg:text-[15px]">
              {BOUNCE_PARK.titre}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
