"use client";

import { useState } from "react";
import { modifierFormule, modifierOption } from "@/lib/actions/admin";
import type { FormuleAdmin, OptionAdmin } from "@/lib/vues";
import {
  BOUTON_NEUTRE,
  BOUTON_PRINCIPAL,
  MessageAction,
  Rotative,
  useAction,
} from "@/components/admin/retour";

/**
 * Modification d'un tarif.
 *
 * Ce qui est écrit ici est ce qui sera facturé : c'est la même table que celle
 * relue par le serveur au moment d'enregistrer une réservation. Le formulaire
 * ne se contente donc pas d'un affichage optimiste — il attend la réponse et
 * réaffiche ce que la base a réellement accepté.
 *
 * Les réservations déjà prises ne changent pas : leur montant a été figé au
 * moment de l'écriture. Un changement de tarif ne vaut que pour la suite.
 */

const CHAMP =
  "w-full rounded-xl border border-border bg-input/30 px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-field/60";
const ETIQUETTE = "mb-1 block text-xs text-muted-foreground";

function Interrupteur({
  actif,
  onChange,
  libelle,
}: {
  actif: boolean;
  onChange: (v: boolean) => void;
  libelle: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={actif}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-[var(--color-field)]"
      />
      {libelle}
    </label>
  );
}

export function FicheFormule({ f }: { f: FormuleAdmin }) {
  const { enCours, occupe, retour, lancer } = useAction();
  const [v, setV] = useState({
    nom: f.nom,
    accroche: f.accroche,
    description: f.description,
    prixBase: String(f.prixBase),
    enfantsInclus: f.enfantsInclus,
    prixEnfantSup: String(f.prixEnfantSup),
    enfantsMax: f.enfantsMax,
    dureeMinutes: f.dureeMinutes,
    inclus: f.inclus.join("\n"),
    actif: f.actif,
  });

  const modifie =
    v.nom !== f.nom ||
    v.accroche !== f.accroche ||
    v.description !== f.description ||
    v.prixBase !== String(f.prixBase) ||
    v.enfantsInclus !== f.enfantsInclus ||
    v.prixEnfantSup !== String(f.prixEnfantSup) ||
    v.enfantsMax !== f.enfantsMax ||
    v.dureeMinutes !== f.dureeMinutes ||
    v.inclus !== f.inclus.join("\n") ||
    v.actif !== f.actif;

  return (
    <article
      className={`rounded-2xl border border-border bg-card p-5 transition-opacity ${
        enCours ? "opacity-70" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold">{f.nom}</h3>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground">{f.id}</span>
          <Interrupteur
            actif={v.actif}
            onChange={(actif) => setV({ ...v, actif })}
            libelle="Proposée sur le site"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={ETIQUETTE} htmlFor={`nom-${f.id}`}>Nom</label>
          <input id={`nom-${f.id}`} className={CHAMP} value={v.nom} maxLength={60}
            onChange={(e) => setV({ ...v, nom: e.target.value })} />
        </div>
        <div>
          <label className={ETIQUETTE} htmlFor={`accroche-${f.id}`}>Accroche</label>
          <input id={`accroche-${f.id}`} className={CHAMP} value={v.accroche} maxLength={120}
            onChange={(e) => setV({ ...v, accroche: e.target.value })} />
        </div>
      </div>

      <div className="mt-4">
        <label className={ETIQUETTE} htmlFor={`desc-${f.id}`}>Description</label>
        <textarea id={`desc-${f.id}`} className={CHAMP} rows={2} value={v.description} maxLength={800}
          onChange={(e) => setV({ ...v, description: e.target.value })} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className={ETIQUETTE} htmlFor={`prix-${f.id}`}>Prix du forfait (€)</label>
          <input id={`prix-${f.id}`} className={CHAMP} inputMode="decimal" value={v.prixBase}
            onChange={(e) => setV({ ...v, prixBase: e.target.value })} />
        </div>
        <div>
          <label className={ETIQUETTE} htmlFor={`inclus-nb-${f.id}`}>Enfants compris dans le forfait</label>
          <input id={`inclus-nb-${f.id}`} className={CHAMP} type="number" min={1} max={100} value={v.enfantsInclus}
            onChange={(e) => setV({ ...v, enfantsInclus: Number(e.target.value) })} />
        </div>
        <div>
          <label className={ETIQUETTE} htmlFor={`sup-${f.id}`}>Par enfant supplémentaire (€)</label>
          <input id={`sup-${f.id}`} className={CHAMP} inputMode="decimal" value={v.prixEnfantSup}
            onChange={(e) => setV({ ...v, prixEnfantSup: e.target.value })} />
        </div>
        <div>
          <label className={ETIQUETTE} htmlFor={`max-${f.id}`}>Enfants maximum</label>
          <input id={`max-${f.id}`} className={CHAMP} type="number" min={1} max={100} value={v.enfantsMax}
            onChange={(e) => setV({ ...v, enfantsMax: Number(e.target.value) })} />
        </div>
        <div>
          <label className={ETIQUETTE} htmlFor={`duree-${f.id}`}>Durée (minutes)</label>
          <input id={`duree-${f.id}`} className={CHAMP} type="number" min={15} max={600} step={15} value={v.dureeMinutes}
            onChange={(e) => setV({ ...v, dureeMinutes: Number(e.target.value) })} />
        </div>
      </div>

      <div className="mt-4">
        <label className={ETIQUETTE} htmlFor={`liste-${f.id}`}>
          Ce qui est compris — une ligne par élément, affiché tel quel sur le site
        </label>
        <textarea id={`liste-${f.id}`} className={CHAMP} rows={6} value={v.inclus}
          onChange={(e) => setV({ ...v, inclus: e.target.value })} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={enCours || !modifie}
          onClick={() => lancer("formule", () => modifierFormule(f.id, v))}
          className={BOUTON_PRINCIPAL}
        >
          {occupe("formule") && <Rotative />}
          Enregistrer
        </button>
        {modifie && (
          <button
            type="button"
            onClick={() =>
              setV({
                nom: f.nom,
                accroche: f.accroche,
                description: f.description,
                prixBase: String(f.prixBase),
                enfantsInclus: f.enfantsInclus,
                prixEnfantSup: String(f.prixEnfantSup),
                enfantsMax: f.enfantsMax,
                dureeMinutes: f.dureeMinutes,
                inclus: f.inclus.join("\n"),
                actif: f.actif,
              })
            }
            className={BOUTON_NEUTRE}
          >
            Annuler les modifications
          </button>
        )}
      </div>

      <MessageAction retour={retour} />
    </article>
  );
}

export function FicheOption({ o }: { o: OptionAdmin }) {
  const { enCours, occupe, retour, lancer } = useAction();
  const [v, setV] = useState({
    libelle: o.libelle,
    description: o.description,
    prix: String(o.prix),
    actif: o.actif,
  });

  const modifie =
    v.libelle !== o.libelle ||
    v.description !== o.description ||
    v.prix !== String(o.prix) ||
    v.actif !== o.actif;

  return (
    <article
      className={`rounded-2xl border border-border bg-card p-5 transition-opacity ${
        enCours ? "opacity-70" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold">{o.libelle}</h3>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground">{o.id}</span>
          <Interrupteur
            actif={v.actif}
            onChange={(actif) => setV({ ...v, actif })}
            libelle="Proposée sur le site"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div>
          <label className={ETIQUETTE} htmlFor={`lib-${o.id}`}>Libellé</label>
          <input id={`lib-${o.id}`} className={CHAMP} value={v.libelle} maxLength={80}
            onChange={(e) => setV({ ...v, libelle: e.target.value })} />
        </div>
        <div>
          <label className={ETIQUETTE} htmlFor={`prixopt-${o.id}`}>Prix (€)</label>
          <input id={`prixopt-${o.id}`} className={CHAMP} inputMode="decimal" value={v.prix}
            onChange={(e) => setV({ ...v, prix: e.target.value })} />
        </div>
      </div>

      <div className="mt-4">
        <label className={ETIQUETTE} htmlFor={`descopt-${o.id}`}>Description</label>
        <input id={`descopt-${o.id}`} className={CHAMP} value={v.description} maxLength={300}
          onChange={(e) => setV({ ...v, description: e.target.value })} />
      </div>

      <div className="mt-4">
        <button
          type="button"
          disabled={enCours || !modifie}
          onClick={() => lancer("option", () => modifierOption(o.id, v))}
          className={BOUTON_PRINCIPAL}
        >
          {occupe("option") && <Rotative />}
          Enregistrer
        </button>
      </div>

      <MessageAction retour={retour} />
    </article>
  );
}
