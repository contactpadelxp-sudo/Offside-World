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
export function Recherche({ valeur }: { valeur: string }) {
  const router = useRouter();
  const [enCours, demarrer] = useTransition();
  const [texte, setTexte] = useState(valeur);

  const chercher = (q: string) => {
    demarrer(() => {
      router.push(q.trim() ? `/admin?q=${encodeURIComponent(q.trim())}` : "/admin");
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
        className="h-9 w-full rounded-lg border border-border bg-input/30 px-3 pr-9 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-field/60"
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
        {enCours ? (
          <Rotative />
        ) : (
          valeur && (
            <button
              type="button"
              aria-label="Effacer la recherche"
              onClick={() => {
                setTexte("");
                chercher("");
              }}
              className="inline-flex size-5 items-center justify-center rounded hover:text-foreground"
            >
              <Croix className="size-4" />
            </button>
          )
        )}
      </span>
    </form>
  );
}
