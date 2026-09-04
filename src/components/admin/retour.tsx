"use client";

import { useEffect, useState, useTransition } from "react";
import type { Resultat } from "@/lib/actions/admin";
import { AlerteCercle, Coche } from "@/components/icons";

/**
 * Socle commun aux commandes du back-office.
 *
 * Une action passe par le serveur : il y a forcément un délai. Ce qui compte
 * est qu'il ne soit jamais silencieux. Trois choses s'en chargent :
 *   - le bouton cliqué affiche son propre indicateur, et lui seul ;
 *   - l'affichage bascule tout de suite dans l'état attendu (voir `useOptimistic`
 *     dans les fiches), le serveur ne fait que confirmer ;
 *   - un message de retour dit ce qui s'est passé, et s'efface tout seul quand
 *     c'est un succès — un message d'erreur, lui, reste.
 */

export function useAction() {
  const [enCours, demarrer] = useTransition();
  const [retour, setRetour] = useState<Resultat | null>(null);
  /** Quel bouton a été cliqué : permet de n'animer que celui-là. */
  const [encours, setEncours] = useState<string | null>(null);

  const lancer = (nom: string, action: () => Promise<Resultat>) => {
    setRetour(null);
    setEncours(nom);
    demarrer(async () => {
      const r = await action();
      setRetour(r);
      setEncours(null);
    });
  };

  return {
    enCours,
    /** Vrai si c'est CE bouton qui travaille. */
    occupe: (nom: string) => encours === nom,
    retour,
    lancer,
  };
}

/** Anneau tournant, dessiné en CSS : pas d'icône supplémentaire à charger. */
export function Rotative({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}

export function MessageAction({ retour }: { retour: Resultat | null }) {
  /**
   * On retient QUEL retour a été masqué, plutôt qu'un booléen remis à zéro à
   * chaque changement : un nouveau retour est un autre objet, il redevient donc
   * visible tout seul, sans écrire d'état pendant le rendu de l'effet.
   */
  const [masque, setMasque] = useState<Resultat | null>(null);

  // Un succès s'efface de lui-même : le résultat est déjà visible à l'écran,
  // le message n'a plus rien à apprendre. Une erreur reste tant qu'on ne l'a
  // pas traitée.
  useEffect(() => {
    if (!retour?.ok) return;
    const t = setTimeout(() => setMasque(retour), 4000);
    return () => clearTimeout(t);
  }, [retour]);

  if (!retour?.message || masque === retour) return null;

  return (
    <p
      role="status"
      className={`mt-3 flex animate-in fade-in slide-in-from-top-1 items-start gap-2 rounded-lg px-3 py-2 text-sm duration-200 ${
        retour.ok
          ? "bg-field/10 text-field"
          : "border border-destructive/30 bg-destructive/10 text-destructive"
      }`}
    >
      {retour.ok ? (
        <Coche className="mt-0.5 size-4 shrink-0" />
      ) : (
        <AlerteCercle className="mt-0.5 size-4 shrink-0" />
      )}
      {retour.message}
    </p>
  );
}

/** Classes partagées par les boutons de commande, pour rester homogène. */
export const BOUTON =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60";
export const BOUTON_PRINCIPAL = `${BOUTON} bg-field text-[#0a0a0b] hover:bg-field-dark`;
export const BOUTON_NEUTRE = `${BOUTON} border border-border text-muted-foreground hover:border-field/40 hover:text-foreground`;
export const BOUTON_DANGER = `${BOUTON} border border-destructive/40 text-destructive hover:bg-destructive/10`;
