"use client";

import { useState } from "react";
import {
  annulerReservation,
  confirmerReservation,
  enregistrerNoteReservation,
} from "@/lib/actions/admin";
import type { StatutReservation } from "@/lib/db/backoffice";
import {
  BOUTON_DANGER,
  BOUTON_NEUTRE,
  BOUTON_PRINCIPAL,
  MessageAction,
  useAction,
} from "@/components/admin/retour";
import { Coche, Croix, Document } from "@/components/icons";

/**
 * Commandes d'une réservation.
 *
 * L'annulation demande une confirmation explicite : elle libère le créneau et
 * n'est pas réversible d'un clic. Un bouton isolé, cliqué par erreur sur un
 * téléphone, ne doit pas pouvoir annuler l'anniversaire de quelqu'un.
 */
export function ActionsReservation({
  id,
  statut,
  passee,
  note,
}: {
  id: string;
  statut: StatutReservation;
  passee: boolean;
  note: string | null;
}) {
  const { enCours, retour, lancer } = useAction();
  const [confirmeAnnulation, setConfirmeAnnulation] = useState(false);
  const [noteOuverte, setNoteOuverte] = useState(false);
  const [texteNote, setTexteNote] = useState(note ?? "");

  const active = statut === "en_attente" || statut === "confirmee";

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex flex-wrap items-center gap-2">
        {statut === "en_attente" && !passee && (
          <button
            type="button"
            disabled={enCours}
            onClick={() => lancer(() => confirmerReservation(id))}
            className={BOUTON_PRINCIPAL}
          >
            <Coche className="size-4" /> Confirmer
          </button>
        )}

        {active &&
          (confirmeAnnulation ? (
            <span className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-1.5">
              <span className="text-sm text-destructive">Annuler cette réservation ?</span>
              <button
                type="button"
                disabled={enCours}
                onClick={() => {
                  setConfirmeAnnulation(false);
                  lancer(() => annulerReservation(id));
                }}
                className={BOUTON_DANGER}
              >
                Oui, annuler
              </button>
              <button
                type="button"
                onClick={() => setConfirmeAnnulation(false)}
                className={BOUTON_NEUTRE}
              >
                Non
              </button>
            </span>
          ) : (
            <button
              type="button"
              disabled={enCours}
              onClick={() => setConfirmeAnnulation(true)}
              className={BOUTON_NEUTRE}
            >
              <Croix className="size-4" /> Annuler
            </button>
          ))}

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
          <label htmlFor={`note-${id}`} className="mb-1.5 block text-xs text-muted-foreground">
            Note interne — jamais transmise au client.
          </label>
          <textarea
            id={`note-${id}`}
            value={texteNote}
            onChange={(e) => setTexteNote(e.target.value)}
            maxLength={2000}
            rows={3}
            className="w-full rounded-xl border border-border bg-input/30 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-field/60"
          />
          <button
            type="button"
            disabled={enCours}
            onClick={() => lancer(() => enregistrerNoteReservation(id, texteNote))}
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
