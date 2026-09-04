"use client";

import { useState } from "react";
import { envoyerEmailTest } from "@/lib/actions/admin";
import {
  BOUTON_PRINCIPAL,
  MessageAction,
  Rotative,
  useAction,
} from "@/components/admin/retour";
import { Enveloppe } from "@/components/icons";

/**
 * Envoi d'un e-mail de test.
 *
 * Sert à deux moments : quand on branche le fournisseur pour la première fois,
 * et après chaque changement DNS. Le message emprunte exactement le même chemin
 * qu'un vrai — même expéditeur, même gabarit — pour que le réussir prouve
 * quelque chose.
 */
export function TestEmail({ adresseParDefaut }: { adresseParDefaut: string }) {
  const { enCours, occupe, retour, lancer } = useAction();
  const [adresse, setAdresse] = useState(adresseParDefaut);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <Enveloppe className="size-4 text-field" /> Envoyer un e-mail de test
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Aucune réservation n&apos;est créée. Tant qu&apos;aucun domaine n&apos;est vérifié chez le
        fournisseur, seule l&apos;adresse du titulaire du compte peut recevoir.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          lancer("test", () => envoyerEmailTest(adresse));
        }}
        className="mt-4 flex flex-wrap items-end gap-3"
      >
        <div className="min-w-56 flex-1">
          <label htmlFor="test-dest" className="mb-1 block text-xs text-muted-foreground">
            Adresse de destination
          </label>
          <input
            id="test-dest"
            type="email"
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            maxLength={254}
            required
            className="h-10 w-full rounded-xl border border-border bg-input/30 px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-field/60"
          />
        </div>
        <button type="submit" disabled={enCours} className={`${BOUTON_PRINCIPAL} h-10`}>
          {occupe("test") && <Rotative />}
          {enCours ? "Envoi…" : "Envoyer"}
        </button>
      </form>

      <MessageAction retour={retour} />
    </div>
  );
}
