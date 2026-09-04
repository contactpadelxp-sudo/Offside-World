"use client";

import { useState } from "react";
import { changerStatutDevis, enregistrerNoteDevis } from "@/lib/actions/admin";
import type { StatutDevis } from "@/lib/db/backoffice";
import {
  BOUTON_NEUTRE,
  BOUTON_PRINCIPAL,
  MessageAction,
  useAction,
} from "@/components/admin/retour";
import { Document } from "@/components/icons";

/** Étapes d'une demande de devis, dans l'ordre où elles surviennent. */
const ETAPES: { valeur: StatutDevis; label: string }[] = [
  { valeur: "nouvelle", label: "Nouvelle" },
  { valeur: "traitee", label: "Prise en charge" },
  { valeur: "devis_envoye", label: "Devis envoyé" },
  { valeur: "acceptee", label: "Acceptée" },
  { valeur: "refusee", label: "Refusée" },
];

export function ActionsDevis({
  id,
  statut,
  note,
}: {
  id: string;
  statut: StatutDevis;
  note: string | null;
}) {
  const { enCours, retour, lancer } = useAction();
  const [noteOuverte, setNoteOuverte] = useState(false);
  const [texteNote, setTexteNote] = useState(note ?? "");

  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="mb-2 text-xs text-muted-foreground">Où en est cette demande ?</p>
      <div className="flex flex-wrap items-center gap-2">
        {ETAPES.map((e) => {
          const actuel = e.valeur === statut;
          return (
            <button
              key={e.valeur}
              type="button"
              disabled={enCours || actuel}
              onClick={() => lancer(() => changerStatutDevis(id, e.valeur))}
              aria-pressed={actuel}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-default ${
                actuel
                  ? "bg-field/15 text-field ring-1 ring-field/40"
                  : "border border-border text-muted-foreground hover:border-field/40 hover:text-foreground disabled:opacity-50"
              }`}
            >
              {e.label}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setNoteOuverte((v) => !v)}
          className={BOUTON_NEUTRE}
          aria-expanded={noteOuverte}
        >
          <Document className="size-4" />
          {note ? "Modifier la note" : "Note interne"}
        </button>
      </div>

      {noteOuverte && (
        <div className="mt-3">
          <label htmlFor={`note-devis-${id}`} className="mb-1.5 block text-xs text-muted-foreground">
            Note interne — jamais transmise au client.
          </label>
          <textarea
            id={`note-devis-${id}`}
            value={texteNote}
            onChange={(e) => setTexteNote(e.target.value)}
            maxLength={2000}
            rows={3}
            className="w-full rounded-xl border border-border bg-input/30 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-field/60"
          />
          <button
            type="button"
            disabled={enCours}
            onClick={() => lancer(() => enregistrerNoteDevis(id, texteNote))}
            className={`${BOUTON_PRINCIPAL} mt-2`}
          >
            {enCours ? "Enregistrement…" : "Enregistrer la note"}
          </button>
        </div>
      )}

      <MessageAction retour={retour} />
    </div>
  );
}
