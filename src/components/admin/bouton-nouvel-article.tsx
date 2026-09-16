"use client";

import { creerArticle } from "@/lib/actions/blog";
import {
  BOUTON_PRINCIPAL,
  MessageAction,
  Rotative,
  useAction,
} from "@/components/admin/retour";

/**
 * Crée un brouillon vide et l'ouvre aussitôt.
 *
 * Pas de boîte de dialogue demandant un titre : réclamer un titre avant
 * d'avoir écrit la première ligne est le meilleur moyen de ne jamais
 * commencer. Le titre se corrige ensuite, l'adresse suit.
 *
 * UN ÉCHEC ÉTAIT INVISIBLE. En temps normal `creerArticle` ne revient jamais :
 * elle redirige vers le nouvel article, et la redirection passe par une
 * exception que Next intercepte. Mais si la création échoue AVANT — base
 * injoignable, session expirée — la fonction renvoie bel et bien un message
 * d'erreur… que personne n'affichait. Le bouton tournait, s'arrêtait, et rien
 * ne se passait : on recliquait, sans jamais savoir pourquoi.
 */
export function BoutonNouvelArticle() {
  const { enCours, occupe, retour, lancer } = useAction();
  return (
    // Le message se place sous le bouton et la colonne est alignée à droite,
    // comme le bouton dans l'en-tête où ce composant est posé.
    <div className="flex flex-col items-end">
      <button
        type="button"
        disabled={enCours}
        onClick={() => lancer("creer", () => creerArticle())}
        className={BOUTON_PRINCIPAL}
      >
        {occupe("creer") && <Rotative />}
        Nouvel article
      </button>
      <MessageAction retour={retour} />
    </div>
  );
}
