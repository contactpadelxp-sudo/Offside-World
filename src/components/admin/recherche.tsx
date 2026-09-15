"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Croix } from "@/components/icons";
import { Rotative } from "@/components/admin/retour";

/**
 * Recherche d'une réservation.
 *
 * Un client appelle en citant sa référence, ou juste son nom : il faut pouvoir
 * la retrouver sans faire défiler la liste. La recherche l'emporte sur le
 * filtre courant — une référence se cherche qu'elle soit à venir, passée ou
 * annulée.
 *
 * La navigation passe par l'URL plutôt que par un état local : le résultat est
 * partageable, et le bouton « retour » du navigateur fonctionne.
 */
export function Recherche({
  valeur,
  filtre,
}: {
  valeur: string;
  /** L'onglet affiché avant la recherche, pour y revenir en l'effaçant. */
  filtre?: string;
}) {
  const router = useRouter();
  const [enCours, demarrer] = useTransition();
  const [texte, setTexte] = useState(valeur);

  /*
    EFFACER LA RECHERCHE RAMÈNE OÙ L'ON ÉTAIT.

    Le retour se faisait vers `/admin` tout court, donc toujours vers « À
    venir ». Quelqu'un qui cherchait une référence depuis « À confirmer » et
    touchait la croix repartait dans un autre onglet sans s'en apercevoir — et
    pouvait croire que les réservations à confirmer avaient été traitées.
  */
  const chercher = (q: string) => {
    demarrer(() => {
      if (q.trim()) {
        router.push(`/admin?q=${encodeURIComponent(q.trim())}`);
        return;
      }
      router.push(filtre && filtre !== "a-venir" ? `/admin?filtre=${filtre}` : "/admin");
    });
  };

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        chercher(texte);
      }}
      className="relative flex-1 sm:max-w-xs"
    >
      <label htmlFor="recherche" className="sr-only">
        Rechercher une réservation
      </label>
      <input
        id="recherche"
        type="search"
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder="Référence, nom, e-mail, téléphone…"
        maxLength={80}
        className="h-10 w-full rounded-lg border border-border bg-input/30 px-3 pr-10 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-field/60 sm:h-9"
      />
      <span className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground">
        {enCours ? (
          <Rotative />
        ) : (
          valeur && (
            /*
              La croix faisait 20 px de côté — sous le minimum de 24 px du
              critère 2.5.8 du WCAG 2.2, et à quelques pixels du champ de
              saisie : la rater remettait le clavier à l'écran au lieu d'effacer.
              Le dessin de la croix ne change pas, c'est la zone sensible autour
              qui s'élargit à 32 px.
            */
            <button
              type="button"
              aria-label="Effacer la recherche"
              onClick={() => {
                setTexte("");
                chercher("");
              }}
              className="inline-flex size-8 items-center justify-center rounded hover:text-foreground"
            >
              <Croix className="size-4" />
            </button>
          )
        )}
      </span>
    </form>
  );
}
