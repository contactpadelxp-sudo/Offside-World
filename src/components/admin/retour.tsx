"use client";

import { useState, useTransition } from "react";
import type { Resultat } from "@/lib/actions/admin";
import { AlerteCercle, Coche } from "@/components/icons";

/**
 * Petit socle commun aux commandes du back-office.
 *
 * Chaque action serveur renvoie un `Resultat` ; ce crochet garde le dernier
 * message et l'état « en cours », pour que chaque bouton dise ce qui s'est
 * passé au lieu de laisser l'écran se recharger sans explication.
 */
export function useAction() {
  const [enCours, demarrer] = useTransition();
  const [retour, setRetour] = useState<Resultat | null>(null);

  const lancer = (action: () => Promise<Resultat>) => {
    setRetour(null);
    demarrer(async () => setRetour(await action()));
  };

  return { enCours, retour, lancer, effacer: () => setRetour(null) };
}

export function MessageAction({ retour }: { retour: Resultat | null }) {
  if (!retour?.message) return null;
  return (
    <p
      role="status"
      className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
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
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
export const BOUTON_PRINCIPAL = `${BOUTON} bg-field text-[#0a0a0b] hover:bg-field-dark`;
export const BOUTON_NEUTRE = `${BOUTON} border border-border text-muted-foreground hover:border-field/40 hover:text-foreground`;
export const BOUTON_DANGER = `${BOUTON} border border-destructive/40 text-destructive hover:bg-destructive/10`;
