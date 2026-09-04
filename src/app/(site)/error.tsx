"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlerteTriangle } from "@/components/icons";
import { TELEPHONE, TELEPHONE_TEL } from "@/data/entreprise";

/**
 * Écran d'erreur du site public.
 *
 * Un visiteur qui tombe là voulait probablement réserver : on lui donne le
 * téléphone plutôt que de le laisser sur un cul-de-sac. Aucun détail technique
 * n'est affiché — il ne lui servirait à rien, et l'énoncer ne ferait
 * qu'inquiéter.
 */
export default function ErreurSite({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Site :", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center md:py-32">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-kick/15 text-kick">
        <AlerteTriangle className="size-7" />
      </span>
      <h1 className="mt-6 font-[family-name:var(--font-heading)] text-2xl font-bold md:text-3xl">
        Quelque chose s&apos;est mal passé
      </h1>
      <p className="mt-3 text-muted-foreground">
        Cette page n&apos;a pas pu s&apos;afficher. Réessayez dans un instant — et si vous vouliez
        réserver, appelez-nous, c&apos;est encore plus rapide.
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
          href={`tel:${TELEPHONE_TEL}`}
          className="btn-outline-light inline-flex h-12 items-center justify-center rounded-2xl px-6"
        >
          Appeler le {TELEPHONE}
        </a>
      </div>

      <Link href="/" className="mt-8 inline-block text-sm text-muted-foreground underline">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
