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
      `pt-32` (128 px) et non `py-24` (96 px) : la barre fixe de l'en-tête
      descend jusqu'à 104 px et recouvrait le titre quand cet écran remplace une
      page du site.
    */
    <div className="mx-auto max-w-lg px-4 pt-32 pb-12 text-center md:pt-36 md:pb-20">
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
