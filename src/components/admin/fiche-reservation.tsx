"use client";

import { useOptimistic, useState } from "react";
import {
  annulerReservation,
  confirmerReservation,
  enregistrerNoteReservation,
} from "@/lib/actions/admin";
import type { ReservationAdmin, StatutReservation } from "@/lib/vues";
import {
  BOUTON_DANGER,
  BOUTON_NEUTRE,
  BOUTON_PRINCIPAL,
  MessageAction,
  Rotative,
  useAction,
} from "@/components/admin/retour";
import {
  AlerteTriangle,
  Ballon,
  Coche,
  Croix,
  Document,
  Enveloppe,
  Gateau,
  Telephone,
  type IconType,
} from "@/components/icons";

/**
 * Fiche d'une réservation, commandes comprises.
 *
 * Composant navigateur, et non serveur, pour une seule raison : l'affichage
 * bascule dans l'état demandé DÈS LE CLIC (`useOptimistic`), sans attendre le
 * serveur. Confirmer une réservation change immédiatement l'étiquette et les
 * boutons ; si le serveur refuse, React rétablit l'état précédent tout seul et
 * le message d'erreur explique pourquoi.
 */

const TYPES: Record<string, { label: string; classe: string; icone: IconType }> = {
  anniversaire: { label: "Anniversaire", classe: "bg-kick/10 text-kick", icone: Gateau },
  bubble: { label: "Bubble Foot", classe: "bg-field/10 text-field", icone: Ballon },
};

const STATUTS: Record<StatutReservation, { label: string; classe: string }> = {
  en_attente: { label: "À confirmer", classe: "bg-white/10 text-foreground" },
  confirmee: { label: "Confirmée", classe: "bg-field/15 text-field" },
  annulee: { label: "Annulée", classe: "bg-destructive/15 text-destructive" },
  expiree: { label: "Expirée", classe: "bg-white/5 text-muted-foreground" },
};

function Etiquette({ children, classe }: { children: React.ReactNode; classe: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold transition-colors duration-200 ${classe}`}
    >
      {children}
    </span>
  );
}

export function FicheReservation({ r }: { r: ReservationAdmin }) {
  const { enCours, occupe, retour, lancer } = useAction();
  const [statut, projeter] = useOptimistic<StatutReservation, StatutReservation>(
    r.statut,
    (_actuel, vise) => vise
  );
  const [confirmeAnnulation, setConfirmeAnnulation] = useState(false);
  const [noteOuverte, setNoteOuverte] = useState(false);
  const [texteNote, setTexteNote] = useState(r.noteInterne ?? "");

  const type = TYPES[r.type] ?? TYPES.anniversaire;
  const badge = STATUTS[statut];
  const Icone = type.icone;
  const active = statut === "en_attente" || statut === "confirmee";

  return (
    <article
      className={`rounded-2xl border border-border bg-card p-5 transition-opacity duration-200 ${
        enCours ? "opacity-70" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Etiquette classe={type.classe}>
              <Icone className="size-3" />
              {type.label}
            </Etiquette>
            <Etiquette classe={badge.classe}>{badge.label}</Etiquette>
            <span className="font-mono text-xs text-muted-foreground">{r.reference}</span>
          </div>

          <h3 className="mt-2 font-bold">{r.clientNom}</h3>
          <p className="text-sm text-muted-foreground">
            {r.type === "anniversaire"
              ? `${r.formuleNom ?? "Formule"} — ${r.nbEnfants ?? "?"} enfants${
                  r.enfantPrenom
                    ? ` (${r.enfantPrenom}${r.enfantAge ? `, ${r.enfantAge} ans` : ""})`
                    : ""
                }`
              : `Bubble Foot — ${r.nbPersonnes ?? "?"} personnes`}
          </p>
        </div>

        <div className="text-right">
          <p className="text-lg font-bold text-field">{r.total}€</p>
          <p className="text-sm font-medium">{r.jourLabel}</p>
          <p className="text-sm text-muted-foreground">
            {r.debut} – {r.fin}
          </p>
          {r.espaceNom && <p className="text-xs text-muted-foreground">{r.espaceNom}</p>}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-muted/60 p-3">
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
          <a href={`tel:${r.clientTelephone}`} className="flex items-center gap-1.5 hover:text-field">
            <Telephone className="size-3.5 text-muted-foreground" />
            {r.clientTelephone}
          </a>
          <a href={`mailto:${r.clientEmail}`} className="flex items-center gap-1.5 hover:text-field">
            <Enveloppe className="size-3.5 text-muted-foreground" />
            {r.clientEmail}
          </a>
          {r.options.length > 0 && (
            <span>
              <span className="text-muted-foreground">Options : </span>
              {r.options.join(", ")}
            </span>
          )}
        </div>

        {(r.allergies || r.remarques) && (
          <p className="mt-2 flex items-start gap-1.5 text-sm font-medium text-kick">
            <AlerteTriangle className="mt-0.5 size-4 shrink-0" />
            {[r.allergies, r.remarques].filter(Boolean).join(" — ")}
          </p>
        )}

        {r.noteInterne && !noteOuverte && (
          <p className="mt-2 border-t border-border pt-2 text-sm">
            <span className="text-muted-foreground">Note interne : </span>
            {r.noteInterne}
          </p>
        )}
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <div className="flex flex-wrap items-center gap-2">
          {statut === "en_attente" && !r.passee && (
            <button
              type="button"
              disabled={enCours}
              onClick={() =>
                lancer("confirmer", async () => {
                  projeter("confirmee");
                  return confirmerReservation(r.id);
                })
              }
              className={BOUTON_PRINCIPAL}
            >
              {occupe("confirmer") ? <Rotative /> : <Coche className="size-4" />}
              Confirmer
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
                    lancer("annuler", async () => {
                      projeter("annulee");
                      return annulerReservation(r.id);
                    });
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
                {occupe("annuler") ? <Rotative /> : <Croix className="size-4" />}
                Annuler
              </button>
            ))}

          <button
            type="button"
            onClick={() => setNoteOuverte((v) => !v)}
            className={BOUTON_NEUTRE}
            aria-expanded={noteOuverte}
          >
            <Document className="size-4" />
            {r.noteInterne ? "Modifier la note" : "Note interne"}
          </button>
        </div>

        {noteOuverte && (
          <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <label htmlFor={`note-${r.id}`} className="mb-1.5 block text-xs text-muted-foreground">
              Note interne — jamais transmise au client.
            </label>
            <textarea
              id={`note-${r.id}`}
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
                    const r2 = await enregistrerNoteReservation(r.id, texteNote);
                    if (r2.ok) setNoteOuverte(false);
                    return r2;
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
                  setTexteNote(r.noteInterne ?? "");
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
