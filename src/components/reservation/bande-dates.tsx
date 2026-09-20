"use client";

import { useEffect, useMemo, useRef } from "react";
import { moisDuJour, partiesDuJour } from "@/lib/temps";

export type JourChoisissable = { jour: string; label: string };

/**
 * Le choix de la date, sous forme de bande défilante.
 *
 * CE QUI N'ALLAIT PAS. Les dates étaient des boutons dans un conteneur
 * `flex-wrap`, portant leur libellé long — « Dimanche 20 septembre ». Trois
 * conséquences, qui se cumulent :
 *
 *   1. LES LARGEURS ÉTAIENT TOUTES DIFFÉRENTES. « Mer. 2 sept. » et « Dimanche
 *      20 septembre » n'occupent pas la même place ; les boutons se rangeaient
 *      donc en lignes ragées, deux ici, une là, et la rangée se relisait à
 *      chaque changement de largeur d'écran. C'est ce qui donnait l'impression
 *      que les dates étaient posées au hasard.
 *   2. SEULES DOUZE ÉTAIENT MONTRÉES, le reste derrière un bouton « + 91 autres
 *      dates ». Il y a 103 dates ouvertes sur six mois : le déplier déversait
 *      quatre-vingt-onze boutons de plus dans la même grille, et le choix
 *      devenait illisible au moment précis où l'on cherchait une date lointaine.
 *   3. CHAQUE DATE ÉTAIT UN ARRÊT DE TABULATION. Une fois la liste dépliée, il
 *      fallait 103 tabulations pour atteindre les horaires.
 *
 * CE QUI LES REMPLACE. Des puces de LARGEUR FIXE sur trois lignes — jour de la
 * semaine, numéro, mois —, alignées dans une bande qui défile à l'horizontale
 * avec accrochage. Le numéro devient l'ancre visuelle et la rangée se lit comme
 * un calendrier, pas comme une suite d'accidents. Les 103 dates sont toutes là,
 * sans bouton pour en révéler d'autres.
 *
 * UN FILET À CHAQUE CHANGEMENT DE MOIS : en défilant de septembre à mars, la
 * rupture se voit d'un coup d'œil. Le NOM du mois n'y figure pas — chaque puce
 * le porte déjà en abrégé sous son numéro, et un premier essai qui l'écrivait
 * verticalement donnait 20 px de large pour un corps de 10 px, illisible.
 *
 * C'EST UN `radiogroup`, PAS UNE RANGÉE DE BOUTONS. Choisir une date, c'est
 * choisir UNE valeur parmi plusieurs : le rôle le dit, `aria-checked` donne
 * l'état, et la tabulation traverse le groupe d'un seul coup — les flèches
 * déplacent la sélection à l'intérieur. On passe de 103 arrêts de tabulation à
 * un seul.
 */
export function BandeDates({
  jours,
  choisi,
  onChoisir,
}: {
  jours: JourChoisissable[];
  choisi: string;
  onChoisir: (jour: string) => void;
}) {
  const refs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const bande = useRef<HTMLDivElement>(null);

  /*
    LA DATE RETENUE EST RAMENÉE DANS LE CHAMP DE VISION.

    Sans cela, revenir à cette étape après avoir choisi le 12 février laisse la
    bande au 20 septembre : la sélection existe, elle est simplement hors de
    l'écran, et on croit l'avoir perdue.

    `block: "nearest"` est indispensable : la valeur par défaut fait aussi
    défiler la PAGE verticalement pour centrer l'élément, ce qui arracherait le
    visiteur au titre de l'étape à chaque changement de date.
  */
  useEffect(() => {
    refs.current.get(choisi)?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [choisi]);

  const auClavier = (e: React.KeyboardEvent, index: number) => {
    const cible =
      e.key === "ArrowRight" ? Math.min(index + 1, jours.length - 1)
      : e.key === "ArrowLeft" ? Math.max(index - 1, 0)
      : e.key === "Home" ? 0
      : e.key === "End" ? jours.length - 1
      : null;
    if (cible === null) return;
    e.preventDefault();
    const jour = jours[cible].jour;
    onChoisir(jour);
    refs.current.get(jour)?.focus();
  };

  /*
    LES RUPTURES DE MOIS SONT CALCULÉES AVANT LE RENDU, ET NON EN LE
    PARCOURANT.

    La version précédente gardait le dernier mois vu dans une variable qu'elle
    réassignait dans le `map`. Le compilateur React le refuse, et il a raison :
    un rendu peut être abandonné en cours de route, et la variable garderait
    alors l'état d'un passage qui n'a jamais abouti — au rendu suivant, le
    premier séparateur manquerait.

    Ici chaque entrée porte sa propre réponse, calculée à partir de sa voisine.
    Rien ne dépend de l'ordre dans lequel React parcourt la liste.
  */
  const avecMois = useMemo(
    () =>
      jours.map((j, i) => {
        const mois = moisDuJour(j.jour);
        return {
          ...j,
          mois,
          nouveauMois: i === 0 || mois !== moisDuJour(jours[i - 1].jour),
          parties: partiesDuJour(j.jour),
        };
      }),
    [jours]
  );

  return (
    /*
      `-mx-4 px-4` : la bande déborde volontairement des marges du tunnel, pour
      qu'une puce coupée soit visible au bord de l'écran. C'est ce qui dit
      qu'elle défile — une bande qui s'arrête pile sur la marge a l'air
      complète. Le rembourrage rendu à l'intérieur garde la première puce
      alignée sur le reste du formulaire.

      `scrollbar-mince` masque la barre sur les systèmes qui en affichent une en
      permanence, sans jamais empêcher le défilement lui-même.
    */
    <div
      ref={bande}
      role="radiogroup"
      aria-label="Date de la réservation"
      className="scrollbar-mince -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2"
    >
      {avecMois.map((j, i) => {
        const { nouveauMois } = j;
        const { semaine, numero, mois: moisCourt } = j.parties;
        const actif = j.jour === choisi;

        return (
          <div key={j.jour} className="flex shrink-0 items-stretch gap-2">
            {nouveauMois && i > 0 && (
              /*
                UN FILET, ET NON LE NOM DU MOIS.

                Le premier essai écrivait « Octobre 2026 » verticalement entre
                deux puces. Mesuré : 20 px de large pour un corps de 10 px —
                illisible —, et le séparateur de septembre tombait à x = −28,
                donc hors du champ, parce qu'il précédait la toute première
                puce. Un repère qu'on ne peut ni lire ni voir n'est pas un
                repère.

                Chaque puce porte déjà son mois en abrégé sous le numéro : le
                nom n'a pas à être répété, seule la RUPTURE manquait. Un filet
                la donne, et il se voit d'un coup d'œil en faisant défiler.

                `i > 0` : il n'y a rien à séparer avant la première date.
                `aria-hidden` : les puces annoncent leur date complète, un
                lecteur d'écran n'a que faire d'une barre décorative.
              */
              <span aria-hidden className="my-3 w-px shrink-0 self-stretch bg-white/15" />
            )}
            <button
              ref={(el) => {
                if (el) refs.current.set(j.jour, el);
                else refs.current.delete(j.jour);
              }}
              type="button"
              role="radio"
              aria-checked={actif}
              /*
                Le libellé long reste l'étiquette accessible : la puce montre
                « Dim / 20 / sept », un lecteur d'écran annonce « Dimanche 20
                septembre ». L'abréviation est un raccourci visuel, pas une
                information amoindrie.
              */
              aria-label={j.label}
              tabIndex={actif ? 0 : -1}
              onClick={() => onChoisir(j.jour)}
              onKeyDown={(e) => auClavier(e, i)}
              className={`flex w-16 shrink-0 snap-start flex-col items-center justify-center rounded-2xl border-2 py-2.5 transition-colors duration-300 ${
                actif
                  ? "border-field bg-field/10 text-field"
                  : "border-muted text-muted-foreground hover:border-field/40"
              }`}
            >
              <span className="text-[11px] font-medium uppercase tracking-wide">{semaine}</span>
              <span
                className={`text-xl font-bold leading-tight ${actif ? "text-field" : "text-foreground"}`}
              >
                {numero}
              </span>
              <span className="text-[11px] font-medium">{moisCourt}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
