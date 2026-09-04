"use client";

import { useEffect } from "react";
import { BOUTON_NEUTRE, BOUTON_PRINCIPAL } from "@/components/admin/retour";
import { AlerteTriangle } from "@/components/icons";

/**
 * Écran d'erreur du back-office.
 *
 * Sans ce fichier, une requête qui échoue affichait la page d'erreur brute de
 * Next : fond blanc, texte anglais, aucune issue. Ici, la barre de navigation
 * reste en place et on peut réessayer sans perdre sa session.
 *
 * Le message technique n'est pas affiché. Next le remplace déjà par un texte
 * générique en production, mais il reste `digest` — un identifiant qui permet
 * de retrouver la trace exacte dans les journaux du serveur. C'est ce qu'il
 * faut nous transmettre, pas une capture d'écran.
 */
export default function ErreurBackOffice({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Back-office :", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
        <AlerteTriangle className="size-6" />
      </span>
      <h1 className="mt-5 font-[family-name:var(--font-heading)] text-xl font-bold">
        Cette page n&apos;a pas pu se charger
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Rien n&apos;a été modifié. Réessayez : si l&apos;erreur persiste, la base de données est
        probablement injoignable.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={reset} className={BOUTON_PRINCIPAL}>
          Réessayer
        </button>
        <a href="/admin" className={BOUTON_NEUTRE}>
          Retour aux réservations
        </a>
      </div>

      {error.digest && (
        <p className="mt-6 text-xs text-muted-foreground">
          Référence à nous transmettre : <span className="font-mono">{error.digest}</span>
        </p>
      )}
    </div>
  );
}
