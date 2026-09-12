"use client";

import { useState } from "react";
import { enregistrerDevis, enregistrerNoteDevis, envoyerDevis } from "@/lib/actions/admin";
import type { DevisAdmin } from "@/lib/vues";
import {
  devisPreRempli,
  obstaclesEnvoi,
  totalDevisCents,
  totalLigneCents,
  type LigneDevis,
} from "@/lib/devis";
import { montantLisible } from "@/lib/tarification";
import {
  BOUTON_NEUTRE,
  BOUTON_PRINCIPAL,
  MessageAction,
  Rotative,
  useAction,
} from "@/components/admin/retour";
import { Coche, Croix, Document, Enveloppe, Groupe, Telephone } from "@/components/icons";

/**
 * Une demande de team building, et le devis qu'on lui répond.
 *
 * CE QUI A DISPARU, ET POURQUOI. Cinq boutons d'état — « Prise en charge »,
 * « Devis envoyé », « Acceptée », « Refusée » — que l'exploitant cochait pour
 * se souvenir de ce qu'il avait fait. Le devis, lui, n'existait nulle part : il
 * fallait le rédiger ailleurs, l'envoyer ailleurs, puis revenir cocher.
 *
 * Un état déclaratif ne prouve rien. Rien ne garantissait qu'un devis marqué
 * « envoyé » l'ait été, ni qu'un devis réellement envoyé soit marqué. Ici
 * l'envoi écrit lui-même son horodatage : l'étiquette en haut de la fiche
 * n'est plus un choix, c'est une lecture.
 *
 * LE DEVIS EST PRÉ-REMPLI, PAS INVENTÉ. La ligne reprend la date, la
 * demi-journée et le nombre de participants demandés — mais son prix reste à
 * zéro. Aucun tarif de team building n'existe dans le projet : l'offre est
 * « sur devis », c'est tout l'objet de cet écran. Un montant pré-rempli
 * finirait par partir tel quel.
 */
export function FicheDevis({ d }: { d: DevisAdmin }) {
  const { enCours, occupe, retour, lancer } = useAction();
  const [noteOuverte, setNoteOuverte] = useState(false);
  const [texteNote, setTexteNote] = useState(d.noteInterne ?? "");

  // Un devis déjà rédigé est repris tel quel ; sinon on part du pré-rempli.
  const [lignes, setLignes] = useState<LigneDevis[]>(
    d.devis.lignes.length > 0 ? d.devis.lignes : devisPreRempli(d.brut).lignes
  );
  const [mot, setMot] = useState(d.devis.message);
  const [validite, setValidite] = useState(d.devis.validite);
  const [envoye, setEnvoye] = useState(d.devis.envoyeLe);

  const devis = { lignes, message: mot, validite };
  const obstacles = obstaclesEnvoi(devis);
  const total = totalDevisCents(lignes);

  const majLigne = (i: number, champ: keyof LigneDevis, v: string) =>
    setLignes((prev) =>
      prev.map((l, j) =>
        j !== i
          ? l
          : champ === "designation"
            ? { ...l, designation: v }
            : champ === "quantite"
              ? { ...l, quantite: Math.max(0, Math.trunc(Number(v) || 0)) }
              : // Saisi en euros, stocké en centimes — comme partout ailleurs.
                { ...l, prixUnitaireCents: Math.max(0, Math.round((Number(v) || 0) * 100)) }
      )
    );

  return (
    <article
      className={`rounded-2xl border border-border bg-card p-5 transition-opacity duration-200 ${
        enCours ? "opacity-70" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {/*
              L'étiquette est une LECTURE, plus un choix. Elle dit ce que la
              base sait de l'envoi réel.
            */}
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                envoye ? "bg-field/15 text-field" : "bg-kick/15 text-kick"
              }`}
            >
              {envoye ? `Devis envoyé le ${envoye}` : "À traiter"}
            </span>
            <span className="font-mono text-xs text-muted-foreground">{d.reference}</span>
          </div>
          <h2 className="mt-2 font-bold">{d.entreprise}</h2>
          <p className="text-sm text-muted-foreground">{d.contactNom}</p>
        </div>

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

      {/* ── Le devis ── */}
      <div className="mt-4 border-t border-border pt-4">
        <p className="mb-3 text-xs text-muted-foreground">
          Le devis ci-dessous part tel quel au client. Les montants sont TVAC.
        </p>

        <div className="space-y-2">
          {lignes.map((l, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2 sm:flex-nowrap">
              <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                <label htmlFor={`des-${d.id}-${i}`} className="mb-1 block text-xs text-muted-foreground">
                  Désignation
                </label>
                <input
                  id={`des-${d.id}-${i}`}
                  value={l.designation}
                  onChange={(e) => majLigne(i, "designation", e.target.value)}
                  maxLength={200}
                  className="w-full rounded-lg border border-border bg-input/30 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-field/60"
                />
              </div>
              <div className="w-20">
                <label htmlFor={`qte-${d.id}-${i}`} className="mb-1 block text-xs text-muted-foreground">
                  Qté
                </label>
                <input
                  id={`qte-${d.id}-${i}`}
                  type="number"
                  min={0}
                  step={1}
                  value={l.quantite}
                  onChange={(e) => majLigne(i, "quantite", e.target.value)}
                  className="w-full rounded-lg border border-border bg-input/30 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-field/60"
                />
              </div>
              <div className="w-28">
                <label htmlFor={`pu-${d.id}-${i}`} className="mb-1 block text-xs text-muted-foreground">
                  Prix unit. €
                </label>
                <input
                  id={`pu-${d.id}-${i}`}
                  type="number"
                  min={0}
                  step="0.01"
                  value={l.prixUnitaireCents / 100}
                  onChange={(e) => majLigne(i, "prixUnitaireCents", e.target.value)}
                  className="w-full rounded-lg border border-border bg-input/30 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-field/60"
                />
              </div>
              <div className="w-24 pb-2 text-right text-sm font-semibold">
                {montantLisible(totalLigneCents(l))}
              </div>
              <button
                type="button"
                aria-label={`Retirer la ligne ${i + 1}`}
                onClick={() => setLignes((prev) => prev.filter((_, j) => j !== i))}
                className="mb-1 inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
              >
                <Croix className="size-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            setLignes((prev) => [...prev, { designation: "", quantite: 1, prixUnitaireCents: 0 }])
          }
          className={`mt-2 ${BOUTON_NEUTRE}`}
        >
          Ajouter une ligne
        </button>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="font-bold">Total TVAC</span>
          <span className="text-lg font-bold text-field">{montantLisible(total)}</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`val-${d.id}`} className="mb-1 block text-xs text-muted-foreground">
              Valable jusqu&apos;au
            </label>
            <input
              id={`val-${d.id}`}
              type="date"
              value={validite}
              onChange={(e) => setValidite(e.target.value)}
              style={{ colorScheme: "dark" }}
              className="w-full rounded-lg border border-border bg-input/30 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-field/60"
            />
          </div>
          <div>
            <label htmlFor={`mot-${d.id}`} className="mb-1 block text-xs text-muted-foreground">
              Mot d&apos;introduction (facultatif)
            </label>
            <textarea
              id={`mot-${d.id}`}
              value={mot}
              onChange={(e) => setMot(e.target.value)}
              maxLength={2000}
              rows={2}
              className="w-full rounded-lg border border-border bg-input/30 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-field/60"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={enCours || obstacles.length > 0}
            onClick={() =>
              lancer("envoyer", async () => {
                const r = await envoyerDevis(d.id, devis);
                if (r.ok) setEnvoye("à l'instant");
                return r;
              })
            }
            className={BOUTON_PRINCIPAL}
          >
            {occupe("envoyer") ? <Rotative /> : <Enveloppe className="size-4" />}
            {envoye ? "Renvoyer le devis" : "Envoyer le devis"}
          </button>

          <button
            type="button"
            disabled={enCours}
            onClick={() => lancer("brouillon", () => enregistrerDevis(d.id, devis))}
            className={BOUTON_NEUTRE}
          >
            {occupe("brouillon") ? <Rotative /> : <Coche className="size-4" />}
            Enregistrer sans envoyer
          </button>

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

        {/*
          CE QUI MANQUE, DIT AVANT LE CLIC. Même correctif que sur le bouton de
          réservation du tunnel : un bouton désactivé qui ne dit pas pourquoi
          oblige à deviner.
        */}
        {obstacles.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Pour envoyer, il manque {obstacles.join(", ")}.
          </p>
        )}

        {envoye && (
          <p className="mt-2 text-xs text-muted-foreground">
            Un renvoi expédie à nouveau le devis au client, avec les montants actuellement affichés.
          </p>
        )}

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
                className={BOUTON_NEUTRE}
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
                Fermer
              </button>
            </div>
          </div>
        )}

        <MessageAction retour={retour} />
      </div>
    </article>
  );
}
