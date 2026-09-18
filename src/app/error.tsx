"use client";

import { useEffect } from "react";
import { AlerteTriangle } from "@/components/icons";
import { EMAIL } from "@/data/entreprise";

/**
 * Filet de sécurité de la racine.
 *
 * Les deux coquilles ont déjà leur écran d'erreur — `(site)/error.tsx` et
 * `(admin)/admin/(protege)/error.tsx`. Restaient sans aucune barrière les
 * routes qui ne sont dans ni l'une ni l'autre : la page 404 (`not-found.tsx`,
 * à la racine) et l'écran de connexion au back-office. Une erreur y renvoyait
 * l'écran par défaut de Next, en anglais et bavard sur la pile d'appel.
 *
 * Volontairement sans en-tête ni pied de page : cet écran peut s'afficher sur
 * `/admin/connexion`, et aucun lien ne doit mener du back-office vers le site
 * (voir `app/layout.tsx`). On ne propose donc que réessayer, ou nous écrire.
 */
export default function ErreurRacine({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Racine :", error);
  }, [error]);

  return (
    /*
      Un espacement simple, sans réserve pour une barre fixe.

      Il avait été porté à `pt-32` par alignement avec les pages du site, au
      motif que la barre de navigation recouvrait le titre. Ce motif ne vaut
      pas ici : cet écran n'a précisément aucun en-tête — c'est ce que dit le
      bloc ci-dessus — et réserver 128 px pour une barre absente laissait un
      vide en haut d'une page qui tient en six lignes.
    */
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-kick/15 text-kick">
        <AlerteTriangle className="size-7" />
      </span>
      <h1 className="mt-6 font-[family-name:var(--font-heading)] text-2xl font-bold md:text-3xl">
        Quelque chose s&apos;est mal passé
      </h1>
      <p className="mt-3 text-muted-foreground">
        Cette page n&apos;a pas pu s&apos;afficher. Réessayez dans un instant.
      </p>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="btn-glass-field inline-flex h-12 items-center justify-center rounded-2xl px-6 font-semibold text-[#0a0a0b]"
        >
          Réessayer
        </button>
        <a
          href={`mailto:${EMAIL}`}
          className="btn-outline-light inline-flex h-12 items-center justify-center rounded-2xl px-6"
        >
          Nous écrire
        </a>
      </div>
    </div>
  );
}
