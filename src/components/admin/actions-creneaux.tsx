"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  basculerCreneau,
  basculerJournee,
  creerCreneau,
  genererCreneaux,
  supprimerCreneau,
} from "@/lib/actions/admin";
import type { ResultatCreneau } from "@/lib/actions/admin";
import type { CreneauAdmin } from "@/lib/vues";
import {
  BOUTON_NEUTRE,
  BOUTON_PRINCIPAL,
  MessageAction,
  Rotative,
  useAction,
} from "@/components/admin/retour";
import { Cadenas, Coche, Croix, Plus } from "@/components/icons";
import { BUBBLE_DUREE_MINUTES } from "@/data/bubble-team";

/**
 * Ouverture et fermeture des créneaux.
 *
 * Fermer un créneau le retire de la vente sans rien détruire : c'est ce qu'on
 * fait pour un tournoi, un entretien ou un jour de fermeture. Un créneau déjà
 * réservé ne peut pas être fermé — le serveur le refuse et dit quelle
 * réservation l'occupe.
 *
 * La bascule est optimiste : la ligne change d'état au clic, le serveur ne fait
 * que confirmer. En cas de refus, React rétablit l'état précédent.
 */

function LigneCreneau({ c }: { c: CreneauAdmin }) {
  const { enCours, occupe, retour, lancer } = useAction<ResultatCreneau>();
  const [ouvert, projeter] = useOptimistic<boolean, boolean>(c.ouvert, (_a, vise) => vise);
  /** Coché par l'exploitant après un refus Sport-Finder. Voir la case plus bas. */
  const [forcer, setForcer] = useState(false);

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="w-28 shrink-0 font-mono text-sm">
          {c.debut} – {c.fin}
        </span>
        <span className="text-sm text-muted-foreground">{c.espaceNom}</span>
        <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-muted-foreground">
          {c.type === "anniversaire" ? "Anniversaire" : "Bubble Foot"}
        </span>
        {/*
          UN CRÉNEAU « OUVERT » SUR UN ESPACE HORS SERVICE NE SE VEND PAS.

          La Fun zone 3 est désactivée depuis le 19 septembre 2026, et la vue
          `creneaux_disponibles` filtre sur `e.actif` : ses créneaux ne
          partiront jamais à la vente. Cet écran, lui, les affichait « Libre »
          comme les autres — on comptait donc des places qui n'existent pas, et
          la seule façon de s'en apercevoir était de connaître le filtre de la
          vue. On le dit sur la ligne.
        */}
        {!c.espaceActif && (
          <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-muted-foreground">
            Espace hors service — ne se vend pas
          </span>
        )}

        {c.reservePar ? (
          /*
            `reservePar` EST LA RÉFÉRENCE : autant y aller.

            Elle s'affichait en texte mort. Pour savoir qui occupe le créneau —
            la seule chose qu'on veut savoir en voyant « Réservé » — il fallait
            retenir « OW-AZEG8RV6 », ouvrir les réservations et le retaper.
            La recherche du back-office trouve une référence quel que soit
            l'onglet, le lien tombe donc toujours juste.
          */
          <Link
            href={`/admin?q=${encodeURIComponent(c.reservePar)}`}
            className="rounded-md bg-kick/10 px-2 py-0.5 text-xs font-medium text-kick underline underline-offset-2 hover:bg-kick/20"
          >
            Réservé · {c.reservePar}
          </Link>
        ) : ouvert ? (
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
              onClick={() =>
                lancer("bascule", async () => {
                  projeter(!ouvert);
                  /*
                    ROUVRIR PEUT ÊTRE REFUSÉ, ET LE REFUS SE RATTRAPE ICI.

                    Le serveur compare l'horaire aux plages vendues par
                    Sport-Finder et rend `confirmationRequise` plutôt que
                    d'écrire. On ne coche rien à la place de l'exploitant :
                    on lui montre la phrase, qui nomme la plage heurtée, et
                    c'est le second clic qui force. Le premier clic ne peut
                    donc jamais rouvrir par distraction un créneau fermé pour
                    une bonne raison — c'est exactement ce qui pouvait défaire
                    la migration 0028 sans un mot.
                  */
                  const r = await basculerCreneau(c.id, !ouvert, forcer);
                  if (r.confirmationRequise) projeter(ouvert);
                  setForcer(false);
                  return r;
                })
              }
              className={BOUTON_NEUTRE}
            >
              {occupe("bascule") ? (
                <Rotative />
              ) : ouvert ? (
                <Cadenas className="size-4" />
              ) : (
                <Coche className="size-4" />
              )}
              {ouvert ? "Fermer" : "Rouvrir"}
            </button>
          )}
          {/*
            SUPPRIMER N'EST PAS FERMER.

            Fermer retire de la vente en gardant la trace — un tournoi, un jour
            de fermeture. Supprimer efface un créneau qui n'aurait jamais dû
            exister : un horaire généré au jugé, que l'exploitant remplace par
            le sien. Il n'existait aucun moyen de le faire, donc aucun moyen de
            saisir son vrai planning.

            Le bouton n'apparaît pas sur un créneau réservé : le serveur le
            refuserait de toute façon, et proposer une action impossible est
            une promesse en l'air.
          */}
          {!c.reservePar && (
            <button
              type="button"
              disabled={enCours}
              aria-label={`Supprimer le créneau de ${c.debut}`}
              onClick={() => lancer("supprimer", () => supprimerCreneau(c.id))}
              className="ml-2 inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              {occupe("supprimer") ? <Rotative /> : <Croix className="size-4" />}
            </button>
          )}
        </span>
      </div>

      <MessageAction retour={retour} />
      {/*
        LA CASE N'EXISTE QU'APRÈS LE REFUS, ET ELLE NE SURVIT PAS À L'ACTION.

        Proposer de forcer avant d'avoir montré ce qu'on heurte ferait du
        contournement la voie normale. Elle apparaît donc quand le serveur a
        rendu `confirmationRequise`, elle porte le mot « malgré tout », et elle
        est décochée dès que l'action passe : le geste suivant repart protégé.
      */}
      {retour?.confirmationRequise && (
        <label className="mt-2 flex cursor-pointer items-start gap-2 rounded-lg border border-kick/40 bg-kick/5 px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={forcer}
            onChange={(e) => setForcer(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-[var(--color-kick)]"
          />
          <span>
            J&apos;ai fermé cette plage sur Sport-Finder. Ouvrir ce créneau malgré tout.
          </span>
        </label>
      )}
    </li>
  );
}

export function ListeCreneaux({ creneaux }: { creneaux: CreneauAdmin[] }) {
  if (creneaux.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Aucun créneau ce jour-là. Ajoutez-en un ci-dessous, ou ouvrez une période entière.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {creneaux.map((c) => (
        <LigneCreneau key={c.id} c={c} />
      ))}
    </ul>
  );
}

/**
 * Aller directement à une date.
 *
 * La bande de jours n'en montre que sept, et les flèches avancent d'un jour.
 * Pour vérifier un samedi dans trois semaines — la question qu'on se pose
 * vraiment quand on regarde des créneaux — il fallait vingt-et-un clics, ou
 * réécrire l'adresse à la main. Le champ est un `type="date"` natif : sur
 * téléphone il ouvre le sélecteur du système, qu'on sait déjà manipuler.
 */
export function AllerAuJour({ jour }: { jour: string }) {
  const router = useRouter();
  const [enCours, demarrer] = useTransition();

  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      Aller au
      <input
        type="date"
        value={jour}
        disabled={enCours}
        onChange={(e) => {
          const v = e.target.value;
          if (v) demarrer(() => router.push(`/admin/creneaux?jour=${v}`));
        }}
        className="h-9 rounded-lg border border-border bg-input/30 px-2 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-field/60"
      />
      {enCours && <Rotative />}
    </label>
  );
}

/**
 * FERMER OU ROUVRIR UNE JOURNÉE ENTIÈRE.
 *
 * L'écran annonçait l'usage — « un tournoi, un jour de fermeture » — sans
 * donner le geste correspondant. Fermer un vendredi férié demandait six clics,
 * un samedi douze, et il fallait penser à revenir les rouvrir. Résultat
 * prévisible : le 25 décembre et le 1er janvier étaient encore en vente.
 *
 * LA FERMETURE DEMANDE UNE CONFIRMATION, PAS LA RÉOUVERTURE. Les deux ne
 * coûtent pas la même chose. Retirer une journée de la vente se voit des jours
 * plus tard, quand plus personne ne se souvient du clic ; rouvrir ne fait que
 * remettre en vente ce qui existait déjà. On ne met un obstacle que là où
 * l'erreur est coûteuse — en mettre partout apprend surtout à cliquer sans
 * lire.
 *
 * Le nombre est dans le bouton : « Fermer les 12 créneaux du jour » dit ce qui
 * va se passer mieux que « Fermer la journée », et se relit avant de confirmer.
 */
export function FermerJournee({
  jour,
  ouverts,
  fermes,
}: {
  jour: string;
  /** Créneaux ouverts et non réservés — les seuls que la fermeture peut toucher. */
  ouverts: number;
  fermes: number;
}) {
  const { occupe, retour, lancer } = useAction();
  const [confirme, setConfirme] = useState(false);

  if (ouverts === 0 && fermes === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {ouverts > 0 &&
        (confirme ? (
          <>
            <button
              type="button"
              disabled={occupe("fermer")}
              onClick={() => {
                setConfirme(false);
                lancer("fermer", () => basculerJournee(jour, false));
              }}
              className={`${BOUTON_PRINCIPAL} gap-2`}
            >
              {occupe("fermer") && <Rotative />}
              Confirmer la fermeture
            </button>
            <button type="button" onClick={() => setConfirme(false)} className={BOUTON_NEUTRE}>
              Annuler
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirme(true)}
            className={`${BOUTON_NEUTRE} gap-2`}
          >
            <Cadenas className="size-4" />
            Fermer les {ouverts} créneau{ouverts > 1 ? "x" : ""} du jour
          </button>
        ))}

      {fermes > 0 && !confirme && (
        <button
          type="button"
          disabled={occupe("rouvrir")}
          onClick={() => lancer("rouvrir", () => basculerJournee(jour, true))}
          className={`${BOUTON_NEUTRE} gap-2`}
        >
          {occupe("rouvrir") ? <Rotative /> : <Coche className="size-4" />}
          Rouvrir les {fermes} créneau{fermes > 1 ? "x" : ""} fermé{fermes > 1 ? "s" : ""}
        </button>
      )}

      <MessageAction retour={retour} />
    </div>
  );
}

/**
 * AJOUTER UN CRÉNEAU, UN PAR UN.
 *
 * C'est l'outil qui manquait. Il n'existait que « ouvrir une période », qui
 * génère des dizaines de créneaux d'après des règles écrites dans le SQL —
 * celles posées faute de connaître les vrais horaires du complexe. On pouvait
 * donc régénérer NOTRE planning, jamais saisir CELUI de l'exploitant.
 *
 * Les valeurs restent en place après un ajout réussi : on saisit rarement un
 * seul créneau. Seule l'heure est vidée, parce que c'est la seule qui change
 * d'une ligne à l'autre quand on remplit une journée.
 */
const CHAMP_CRENEAU =
  "h-10 rounded-xl border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-field/60";

type TypeCreneau = "anniversaire" | "bubble";

/**
 * Durée proposée d'office selon l'activité.
 *
 * LE FORMULAIRE PROPOSAIT 2 h DANS TOUS LES CAS. C'est la durée d'une formule
 * anniversaire, mais le Bubble Foot se vend à l'heure : chaque créneau Bubble
 * créé sans penser à toucher la liste ouvrait à la vente deux heures de terrain
 * au prix d'une. La création n'échoue pas en silence pour autant — si le
 * créneau suivant chevauche, le serveur répond « Un créneau ouvert occupe déjà
 * cet horaire dans cet espace », et l'exclusion vaut par espace, pas
 * globalement.
 *
 * LE CHIFFRE VIENT DE LÀ OÙ IL EST DÉJÀ ÉCRIT. `BUBBLE_DUREE_MINUTES` est la
 * durée annoncée au client dans le tunnel : la recopier ici en ferait une
 * seconde vérité, et passer le Bubble à 90 minutes afficherait « 90 minutes »
 * au client pendant que ce formulaire continuerait d'en proposer 60.
 */
const DUREE_PAR_DEFAUT: Record<TypeCreneau, number> = {
  anniversaire: 120,
  bubble: BUBBLE_DUREE_MINUTES,
};

export function AjouterCreneau({
  jour,
  espaces,
}: {
  jour: string;
  espaces: { id: string; nom: string }[];
}) {
  const { enCours, occupe, retour, lancer } = useAction<ResultatCreneau>();
  const [heure, setHeure] = useState("");
  const [type, setType] = useState<TypeCreneau>("anniversaire");
  const [duree, setDuree] = useState(DUREE_PAR_DEFAUT.anniversaire);
  const [espaceId, setEspaceId] = useState(espaces[0]?.id ?? "");
  /** Coché par l'exploitant après un refus Sport-Finder. Voir la case plus bas. */
  const [forcer, setForcer] = useState(false);

  if (espaces.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <Plus className="size-4 text-field" /> Ajouter un créneau
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {/*
          « RÉSERVABLE AUSSITÔT » ÉTAIT VRAI ET RASSURAIT À TORT.

          C'était la seule phrase de l'écran, et elle ne disait que le confort.
          Rien n'avertissait qu'un créneau ouvert pendant les heures de
          Sport-Finder part à la vente sur un terrain déjà loué ailleurs — les
          deux systèmes ne se voient pas. La phrase dit maintenant les deux :
          l'effet immédiat, et la seule chose qu'il faut vérifier avant.
        */}
        Il s&apos;ajoute au jour affiché ci-dessus et devient réservable aussitôt.
        Les heures vendues par Sport-Finder — le foot et le Bubble, sur ces mêmes
        terrains — sont refusées : les deux systèmes ne se voient pas.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          lancer("ajouter", async () => {
            const r = await creerCreneau({
              jour,
              heure,
              dureeMinutes: duree,
              espaceId,
              type,
              confirme: forcer,
            });
            if (r.ok) {
              setHeure("");
              setForcer(false);
            }
            return r;
          });
        }}
        className="mt-4 flex flex-wrap items-end gap-3"
      >
        <div>
          <label htmlFor="c-heure" className="mb-1 block text-xs text-muted-foreground">
            Heure de début
          </label>
          <input
            id="c-heure"
            type="time"
            required
            value={heure}
            onChange={(e) => setHeure(e.target.value)}
            style={{ colorScheme: "dark" }}
            className={CHAMP_CRENEAU}
          />
        </div>

        <div>
          <label htmlFor="c-duree" className="mb-1 block text-xs text-muted-foreground">
            Durée
          </label>
          <select
            id="c-duree"
            value={duree}
            onChange={(e) => setDuree(Number(e.target.value))}
            style={{ colorScheme: "dark" }}
            className={CHAMP_CRENEAU}
          >
            <option value={60}>1 h</option>
            <option value={90}>1 h 30</option>
            <option value={120}>2 h</option>
            <option value={150}>2 h 30</option>
            <option value={180}>3 h</option>
          </select>
        </div>

        <div>
          <label htmlFor="c-espace" className="mb-1 block text-xs text-muted-foreground">
            Espace
          </label>
          <select
            id="c-espace"
            value={espaceId}
            onChange={(e) => setEspaceId(e.target.value)}
            style={{ colorScheme: "dark" }}
            className={CHAMP_CRENEAU}
          >
            {espaces.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="c-type" className="mb-1 block text-xs text-muted-foreground">
            Activité
          </label>
          <select
            id="c-type"
            value={type}
            onChange={(e) => {
              const nouveau = e.target.value as TypeCreneau;
              /*
                On ne réécrit la durée que si elle est encore celle proposée
                d'office pour l'activité précédente : une durée choisie à la
                main est une décision de l'exploitant, changer d'activité ne
                doit pas l'effacer sous ses yeux.
              */
              setDuree((actuelle) =>
                actuelle === DUREE_PAR_DEFAUT[type] ? DUREE_PAR_DEFAUT[nouveau] : actuelle,
              );
              setType(nouveau);
            }}
            style={{ colorScheme: "dark" }}
            className={CHAMP_CRENEAU}
          >
            <option value="anniversaire">Anniversaire</option>
            <option value="bubble">Bubble Foot</option>
          </select>
        </div>

        <button type="submit" disabled={enCours} className={`${BOUTON_PRINCIPAL} h-10`}>
          {occupe("ajouter") ? <Rotative /> : <Plus className="size-4" />}
          Ajouter
        </button>
      </form>

      <MessageAction retour={retour} />
      {/*
        LA CASE N'EXISTE QU'APRÈS LE REFUS, ET ELLE NE SURVIT PAS À L'ACTION.

        Proposer de forcer avant d'avoir montré ce qu'on heurte ferait du
        contournement la voie normale. Elle apparaît donc quand le serveur a
        rendu `confirmationRequise`, elle porte le mot « malgré tout », et elle
        est décochée dès que l'action passe : le geste suivant repart protégé.
      */}
      {retour?.confirmationRequise && (
        <label className="mt-2 flex cursor-pointer items-start gap-2 rounded-lg border border-kick/40 bg-kick/5 px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={forcer}
            onChange={(e) => setForcer(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-[var(--color-kick)]"
          />
          <span>
            J&apos;ai fermé cette plage sur Sport-Finder. Ouvrir ce créneau malgré tout.
          </span>
        </label>
      )}
    </div>
  );
}

/**
 * Prolonge l'horizon de réservation. L'opération est sans risque : les
 * fonctions de génération ignorent les créneaux qui existent déjà.
 */
export function OuvrirPeriode({
  debutParDefaut,
  finParDefaut,
}: {
  debutParDefaut: string;
  finParDefaut: string;
}) {
  const { enCours, occupe, retour, lancer } = useAction();
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
            className="h-10 rounded-xl border border-border bg-input/30 px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-field/60"
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
            className="h-10 rounded-xl border border-border bg-input/30 px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-field/60"
          />
        </div>
        <button
          type="button"
          disabled={enCours}
          onClick={() => lancer("ouvrir", () => genererCreneaux(du, au))}
          className={`${BOUTON_PRINCIPAL} h-10`}
        >
          {occupe("ouvrir") && <Rotative />}
          {enCours ? "Ouverture…" : "Ouvrir"}
        </button>
      </div>

      <MessageAction retour={retour} />
    </div>
  );
}
