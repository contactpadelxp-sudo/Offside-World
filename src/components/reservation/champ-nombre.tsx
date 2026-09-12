"use client";

import { Label } from "@/components/ui/label";
import { ChevronBas } from "@/components/icons";

/**
 * Choix d'un nombre dans une plage fermée.
 *
 * POURQUOI UNE LISTE ET NON UN CHAMP À REMPLIR. Les quatre champs numériques du
 * tunnel étaient des `<input type="number">`. On pouvait donc y taper « 11,4 »,
 * et l'écran calculait alors « 1.4000000000000004 enfants supplémentaires —
 * +14.000000000000004 € ». Le serveur, lui, refusait bien la réservation
 * (`Number.isInteger`), donc rien n'aurait été facturé de travers — mais le
 * client voyait un prix absurde et n'apprenait le refus qu'après avoir tout
 * rempli.
 *
 * Une liste fermée ne valide pas la saisie : elle rend la saisie fautive
 * IMPOSSIBLE. C'est une différence de nature. Il ne reste ni virgule, ni valeur
 * hors bornes, ni champ vide, ni collage de texte — donc plus rien à rattraper
 * en aval.
 *
 * `<select>` NATIF, et non le composant `Select` du projet. Ce dernier existe
 * mais n'est utilisé nulle part, et il faudrait l'essuyer ici. Surtout, pour
 * une liste de nombres, le natif est meilleur : sur téléphone il ouvre le
 * sélecteur du système — la roulette sur iOS — bien plus rapide qu'un menu
 * déroulant maison. Il est navigable au clavier et annoncé correctement sans
 * qu'on écrive une ligne pour ça.
 *
 * `colorScheme: "dark"` n'est pas cosmétique : sans lui, le menu déroulant
 * s'ouvre en clair sur un site sombre, avec parfois du texte blanc sur fond
 * blanc selon le système.
 */
export function ChampNombre({
  id,
  label,
  min,
  max,
  valeur,
  onChange,
  aide,
  suffixe,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  valeur: number;
  onChange: (n: number) => void;
  /** Phrase d'aide sous le champ. */
  aide?: string;
  /** Mot ajouté après le nombre dans la liste, par exemple « ans ». */
  suffixe?: string;
}) {
  // `max` vient parfois de la base (capacité d'un espace, maximum d'une
  // formule) : on se protège d'une plage vide plutôt que de rendre une liste
  // sans option, qu'on ne pourrait plus quitter.
  const haut = Math.max(min, max);
  const valeurs = Array.from({ length: haut - min + 1 }, (_, i) => min + i);

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <select
          id={id}
          value={valeur}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ colorScheme: "dark" }}
          className="h-10 w-full min-w-0 appearance-none rounded-lg border border-input bg-transparent px-2.5 py-1 pr-9 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
        >
          {valeurs.map((n) => (
            <option key={n} value={n}>
              {suffixe ? `${n} ${suffixe}` : n}
            </option>
          ))}
        </select>
        <ChevronBas
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>
      {aide && <p className="mt-1 text-xs text-muted-foreground">{aide}</p>}
    </div>
  );
}
