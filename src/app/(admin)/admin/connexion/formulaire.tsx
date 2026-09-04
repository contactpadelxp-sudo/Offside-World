"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { seConnecter, type EtatConnexion } from "@/lib/actions/session";
import { AlerteCercle, Cadenas } from "@/components/icons";

function Bouton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-field font-semibold text-[#0a0a0b] transition-colors hover:bg-field-dark disabled:opacity-50"
    >
      <Cadenas className="size-4" />
      {pending ? "Connexion…" : "Se connecter"}
    </button>
  );
}

export function FormulaireConnexion({ suite }: { suite: string }) {
  const [etat, action] = useActionState<EtatConnexion, FormData>(seConnecter, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="suite" value={suite} />

      <div>
        <label htmlFor="utilisateur" className="mb-1.5 block text-sm font-medium">
          Identifiant
        </label>
        <input
          id="utilisateur"
          name="utilisateur"
          autoComplete="username"
          required
          maxLength={200}
          autoFocus
          className="h-11 w-full rounded-xl border border-border bg-input/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-field/60"
        />
      </div>

      <div>
        <label htmlFor="motDePasse" className="mb-1.5 block text-sm font-medium">
          Mot de passe
        </label>
        <input
          id="motDePasse"
          name="motDePasse"
          type="password"
          autoComplete="current-password"
          required
          maxLength={200}
          className="h-11 w-full rounded-xl border border-border bg-input/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-field/60"
        />
      </div>

      {etat.erreur && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlerteCercle className="mt-0.5 size-4 shrink-0" />
          {etat.erreur}
        </p>
      )}

      <Bouton />
    </form>
  );
}
