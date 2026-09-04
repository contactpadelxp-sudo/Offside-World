"use client";

import { useOptimistic, useState } from "react";
import { changerStatutDevis, enregistrerNoteDevis } from "@/lib/actions/admin";
import type { DevisAdmin, StatutDevis } from "@/lib/vues";
import {
  BOUTON_NEUTRE,
  BOUTON_PRINCIPAL,
  MessageAction,
  Rotative,
  useAction,
} from "@/components/admin/retour";
import { Document, Enveloppe, Groupe, Telephone } from "@/components/icons";

/** Étapes d'une demande de devis, dans l'ordre où elles surviennent. */
const ETAPES: { valeur: StatutDevis; label: string; classe: string }[] = [
  { valeur: "nouvelle", label: "Nouvelle", classe: "bg-kick/15 text-kick" },
  { valeur: "traitee", label: "Prise en charge", classe: "bg-white/10 text-foreground" },
  { valeur: "devis_envoye", label: "Devis envoyé", classe: "bg-field/15 text-field" },
  { valeur: "acceptee", label: "Acceptée", classe: "bg-field/15 text-field" },
  { valeur: "refusee", label: "Refusée", classe: "bg-destructive/15 text-destructive" },
];

export function FicheDevis({ d }: { d: DevisAdmin }) {
  const { enCours, occupe, retour, lancer } = useAction();
  const [statut, projeter] = useOptimistic<StatutDevis, StatutDevis>(
    d.statut,
    (_actuel, vise) => vise
  );
  const [noteOuverte, setNoteOuverte] = useState(false);
  const [texteNote, setTexteNote] = useState(d.noteInterne ?? "");

  const badge = ETAPES.find((e) => e.valeur === statut) ?? ETAPES[0];

  return (
    <article
      className={`rounded-2xl border border-border bg-card p-5 transition-opacity duration-200 ${
        enCours ? "opacity-70" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold transition-colors duration-200 ${badge.classe}`}
            >
              {badge.label}
            </span>
            <span className="font-mono text-xs text-muted-foreground">{d.reference}</span>
          </div>
          <h2 className="mt-2 font-bold">{d.entreprise}</h2>
          <p className="text-sm text-muted-foreground">{d.contactNom}</p>
        </div>

        {/*
          Sur téléphone, trois lignes alignées à droite dessinent un escalier :
          chaque ligne démarre à un retrait différent. On les met donc sur une
          seule ligne, alignée à gauche comme le reste ; l'alignement à droite
          ne reprend qu'à partir de deux colonnes.
        */}
        <div className="flex flex-wrap items-center gap-x-2 text-sm sm:block sm:text-right">
          {d.dateSouhaitee && <span className="font-medium">{d.dateSouhaitee}</span>}
          {d.periode && (
            <span className="text-muted-foreground">
              <span className="sm:hidden">· </span>
              {d.periode}
            </span>
          )}
          {d.nbParticipants && (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground sm:flex sm:justify-end">
              <span className="sm:hidden">·</span>
              <Groupe className="size-3.5" />
              {d.nbParticipants} participants
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-muted/60 p-3">
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
          <a href={`tel:${d.contactTelephone}`} className="inline-flex min-h-8 items-center gap-1.5 py-0.5 hover:text-field">
            <Telephone className="size-3.5 text-muted-foreground" />
            {d.contactTelephone}
          </a>
          <a href={`mailto:${d.contactEmail}`} className="inline-flex min-h-8 items-center gap-1.5 py-0.5 hover:text-field">
            <Enveloppe className="size-3.5 text-muted-foreground" />
            {d.contactEmail}
          </a>
        </div>
        {d.message && <p className="mt-2 text-sm">{d.message}</p>}
        {d.noteInterne && !noteOuverte && (
          <p className="mt-2 border-t border-border pt-2 text-sm">
            <span className="text-muted-foreground">Note interne : </span>
            {d.noteInterne}
          </p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">Reçue le {d.recuLe}</p>
      </div>

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
                onClick={() =>
                  lancer(e.valeur, async () => {
                    projeter(e.valeur);
                    return changerStatutDevis(d.id, e.valeur);
                  })
                }
                aria-pressed={actuel}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 active:scale-[0.97] disabled:cursor-default ${
                  actuel
                    ? "bg-field/15 text-field ring-1 ring-field/40"
                    : "border border-border text-muted-foreground hover:border-field/40 hover:text-foreground disabled:opacity-60"
                }`}
              >
                {occupe(e.valeur) && <Rotative />}
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
            {d.noteInterne ? "Modifier la note" : "Note interne"}
          </button>
        </div>

        {noteOuverte && (
          <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <label htmlFor={`note-devis-${d.id}`} className="mb-1.5 block text-xs text-muted-foreground">
              Note interne — jamais transmise au client.
            </label>
            <textarea
              id={`note-devis-${d.id}`}
              value={texteNote}
              onChange={(e) => setTexteNote(e.target.value)}
              maxLength={2000}
              rows={3}
              autoFocus
              className="w-full rounded-xl border border-border bg-input/30 px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-field/60"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={enCours}
                onClick={() =>
                  lancer("note", async () => {
                    const r = await enregistrerNoteDevis(d.id, texteNote);
                    if (r.ok) setNoteOuverte(false);
                    return r;
                  })
                }
                className={BOUTON_PRINCIPAL}
              >
                {occupe("note") && <Rotative />}
                Enregistrer la note
              </button>
              <button
                type="button"
                onClick={() => {
                  setTexteNote(d.noteInterne ?? "");
                  setNoteOuverte(false);
                }}
                className={BOUTON_NEUTRE}
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        <MessageAction retour={retour} />
      </div>
    </article>
  );
}
