"use client";

import { useState } from "react";
import { basculerCreneau, genererCreneaux } from "@/lib/actions/admin";
import type { CreneauAdmin } from "@/lib/db/backoffice";
import {
  BOUTON_NEUTRE,
  BOUTON_PRINCIPAL,
  MessageAction,
  useAction,
} from "@/components/admin/retour";
import { Cadenas, Coche } from "@/components/icons";

/**
 * Ouverture et fermeture des créneaux.
 *
 * Fermer un créneau le retire de la vente sans rien détruire : c'est ce qu'on
 * fait pour un tournoi, un entretien ou un jour férié. Un créneau déjà réservé
 * ne peut pas être fermé — le serveur le refuse et dit quelle réservation
 * l'occupe.
 */
export function ListeCreneaux({ creneaux }: { creneaux: CreneauAdmin[] }) {
  const { enCours, retour, lancer } = useAction();

  if (creneaux.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Aucun créneau ce jour-là. Utilisez « Ouvrir une période » pour en générer.
      </p>
    );
  }

  return (
    <div>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {creneaux.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
            <span className="w-28 shrink-0 font-mono text-sm">
              {c.debut} – {c.fin}
            </span>
            <span className="text-sm text-muted-foreground">{c.espaceNom}</span>
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-muted-foreground">
              {c.type === "anniversaire" ? "Anniversaire" : "Bubble Foot"}
            </span>

            {c.reservePar ? (
              <span className="rounded-md bg-kick/10 px-2 py-0.5 text-xs font-medium text-kick">
                Réservé · {c.reservePar}
              </span>
            ) : c.ouvert ? (
              <span className="text-xs text-muted-foreground">Libre</span>
            ) : (
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium">Fermé</span>
            )}

            <span className="ml-auto">
              {c.reservePar ? (
                <span className="text-xs text-muted-foreground">
                  Annulez la réservation pour libérer
                </span>
              ) : (
                <button
                  type="button"
                  disabled={enCours}
                  onClick={() => lancer(() => basculerCreneau(c.id, !c.ouvert))}
                  className={BOUTON_NEUTRE}
                >
                  {c.ouvert ? (
                    <>
                      <Cadenas className="size-4" /> Fermer
                    </>
                  ) : (
                    <>
                      <Coche className="size-4" /> Rouvrir
                    </>
                  )}
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>

      <MessageAction retour={retour} />
    </div>
  );
}

/**
 * Prolonge l'horizon de réservation. L'opération est sans risque : les
 * fonctions de génération ignorent les créneaux qui existent déjà.
 */
export function OuvrirPeriode({ debutParDefaut, finParDefaut }: { debutParDefaut: string; finParDefaut: string }) {
  const { enCours, retour, lancer } = useAction();
  const [du, setDu] = useState(debutParDefaut);
  const [au, setAu] = useState(finParDefaut);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-semibold">Ouvrir une période</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Crée les créneaux manquants sur la période choisie, selon les jours et horaires convenus.
        Rien n&apos;est écrasé : les créneaux existants sont laissés tels quels.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="du" className="mb-1 block text-xs text-muted-foreground">
            Du
          </label>
          <input
            id="du"
            type="date"
            value={du}
            onChange={(e) => setDu(e.target.value)}
            className="h-10 rounded-xl border border-border bg-input/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-field/60"
          />
        </div>
        <div>
          <label htmlFor="au" className="mb-1 block text-xs text-muted-foreground">
            Au
          </label>
          <input
            id="au"
            type="date"
            value={au}
            onChange={(e) => setAu(e.target.value)}
            className="h-10 rounded-xl border border-border bg-input/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-field/60"
          />
        </div>
        <button
          type="button"
          disabled={enCours}
          onClick={() => lancer(() => genererCreneaux(du, au))}
          className={`${BOUTON_PRINCIPAL} h-10`}
        >
          {enCours ? "Ouverture…" : "Ouvrir"}
        </button>
      </div>

      <MessageAction retour={retour} />
    </div>
  );
}
