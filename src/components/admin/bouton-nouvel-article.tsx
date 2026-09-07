"use client";

import { creerArticle } from "@/lib/actions/blog";
import { BOUTON_PRINCIPAL, Rotative, useAction } from "@/components/admin/retour";

/**
 * Crée un brouillon vide et l'ouvre aussitôt.
 *
 * Pas de boîte de dialogue demandant un titre : réclamer un titre avant
 * d'avoir écrit la première ligne est le meilleur moyen de ne jamais
 * commencer. Le titre se corrige ensuite, l'adresse suit.
 */
export function BoutonNouvelArticle() {
  const { enCours, occupe, lancer } = useAction();
  return (
    <button
      type="button"
      disabled={enCours}
      onClick={() => lancer("creer", () => creerArticle())}
      className={BOUTON_PRINCIPAL}
    >
      {occupe("creer") && <Rotative />}
      Nouvel article
    </button>
  );
}
