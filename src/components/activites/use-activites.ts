"use client";

import { usePhoto } from "@/components/photos-provider";
import { Gateau, Groupe, Trophee, type IconType } from "@/components/icons";
import { BUBBLE_PRIX_PAR_PERSONNE } from "@/data/bubble-team";
import { hrefActivite, type ActiviteId } from "@/data/activites";
import type { FormuleVue } from "@/lib/vues";

/**
 * Les trois activités, décrites une seule fois.
 *
 * CE QUE ÇA RÉPARE. Les mêmes trois activités étaient décrites à deux endroits
 * — les cartes de `/reservation` et la section « activités » de l'accueil — et
 * les deux avaient déjà divergé sans que personne s'en aperçoive : « Anniversaire »
 * d'un côté, « Anniversaires » de l'autre, deux descriptions concurrentes, et
 * surtout deux photos différentes pour la même activité, dont une écrite en dur
 * (`/images/foot.jpeg`) hors du système d'emplacements. Cette dernière est un
 * vrai défaut : le système existe pour que Brahim change une photo en déposant
 * un fichier dans `public/images`, et cette carte-là ne l'écoutait pas.
 *
 * Le hero en ajoutait une troisième. Trois copies d'une même chose divergent
 * plus vite que deux.
 *
 * POURQUOI UN HOOK ET NON UN TABLEAU CONSTANT. Deux des douze champs ne peuvent
 * pas être figés :
 *   - la PHOTO passe par `usePhoto()`, qui lit un contexte React alimenté au
 *     build par la résolution des fichiers de `public/images` ;
 *   - le PRIX D'APPEL des anniversaires vient de la base, via les formules que
 *     la page serveur passe en props, parce que Brahim le modifie depuis
 *     `/admin/tarifs`.
 * Un tableau constant aurait donc menti dès son premier changement de tarif, ou
 * dès la première photo déposée. C'est exactement ce que le reste du projet
 * s'interdit.
 *
 * CE QUI RESTE VOLONTAIREMENT DEHORS : la mise en forme. Les cartes de
 * `/reservation` et celles du hero n'ont pas la même forme et n'ont pas à
 * l'avoir. Ce qui doit être commun, c'est ce qu'on dit — pas comment on le
 * dessine.
 */

export interface ActiviteVue {
  id: ActiviteId;
  icone: IconType;
  titre: string;
  description: string;
  /** Lien profond vers le tunnel, déjà ouvert sur cette activité. */
  href: string;
  /** Photo résolue, ou `null` tant qu'aucun fichier ne correspond. */
  img: string | null;
  /** Cadrage dans le cadre (utile pour les portraits recadrés en paysage). */
  imgPosition?: string;
  /** Pastille affichée sur la photo : prix d'appel, ou nature de la réservation. */
  tag: string;
  accentText: string;
  accentBadge: string;
  iconBg: string;
  border: string;
  glow: string;
}

/**
 * Prix d'appel des anniversaires, lu dans les formules de la base.
 *
 * Il était écrit « Dès 180 € » en dur, alors que l'en-tête de
 * `reservation-flow.tsx` promet précisément le contraire : aucun tarif ne doit
 * être figé côté navigateur, pour qu'un prix affiché soit toujours celui que le
 * serveur facturera.
 *
 * `null` quand aucune formule n'a de prix exploitable — la carte affiche alors
 * « Sur mesure », ce qui est vrai, plutôt qu'un montant inventé.
 */
function prixDAppel(formules: FormuleVue[]): number | null {
  const prix = formules.map((f) => f.prixBase).filter((n) => Number.isFinite(n) && n > 0);
  return prix.length ? Math.min(...prix) : null;
}

export function useActivites(formules: FormuleVue[]): ActiviteVue[] {
  const depuis = prixDAppel(formules);
  const photoAnniv = usePhoto("anniversaire-carte");
  const photoBallon = usePhoto("ballon-terrain");
  const photoBubble = usePhoto("bubble-portrait");

  return [
    {
      id: "anniversaire",
      icone: Gateau,
      titre: "Anniversaire",
      description: "Deux formules 100 % foot — Kick-Off et Bubble — jusqu'à 10 enfants.",
      href: hrefActivite("anniversaire"),
      img: photoAnniv,
      // Espace insécable : le montant ne doit pas se séparer de son symbole.
      tag: depuis === null ? "Sur mesure" : `Dès\u00a0${depuis}\u00a0€`,
      accentText: "text-kick",
      accentBadge: "bg-kick/15 text-kick",
      iconBg: "bg-kick/15 text-kick",
      border: "border-kick/20 hover:border-kick/60",
      glow: "bg-kick/25",
    },
    {
      id: "foot",
      icone: Trophee,
      titre: "Louer un terrain",
      description: "Réservez un terrain privé entre amis, à l'heure.",
      href: hrefActivite("foot"),
      img: photoBallon,
      tag: "Réservation en ligne",
      accentText: "text-field",
      accentBadge: "bg-field/15 text-field",
      iconBg: "bg-field/15 text-field",
      border: "border-field/20 hover:border-field/60",
      glow: "bg-field/25",
    },
    {
      id: "groupes",
      icone: Groupe,
      titre: "Bubble Foot & Team Building",
      description: `Bubble Foot à ${BUBBLE_PRIX_PAR_PERSONNE}\u00a0€/personne, ou privatisation à la demi-journée.`,
      href: hrefActivite("groupes"),
      img: photoBubble,
      // Les bulles sont à ~54 % de la hauteur de la photo.
      imgPosition: "object-[center_54%]",
      tag: `Dès\u00a0${BUBBLE_PRIX_PAR_PERSONNE}\u00a0€/pers.`,
      accentText: "text-kick",
      accentBadge: "bg-kick/15 text-kick",
      iconBg: "bg-kick/15 text-kick",
      // Volontairement `field` et non `kick` : c'est la valeur qui était en
      // place sur la carte de /reservation, et la geler telle quelle est la
      // condition pour que cette page ne bouge pas d'un pixel.
      border: "border-field/20 hover:border-field/60",
      glow: "bg-kick/20",
    },
  ];
}
