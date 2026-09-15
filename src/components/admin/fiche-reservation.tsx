"use client";

import { useOptimistic, useState } from "react";
import {
  annulerReservation,
  confirmerReservation,
  enregistrerNoteReservation,
  rembourserReservation,
} from "@/lib/actions/admin";
import type { ChoixRemboursement, ReservationAdmin, StatutReservation } from "@/lib/vues";
import { euros, montantLisible } from "@/lib/tarification";
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
  Carte,
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

/*
  Le formatage des montants vient de `lib/tarification.ts`, comme partout
  ailleurs. Cette fiche portait sa propre copie de la fonction — même règle,
  même résultat, mais rien ne garantissait qu'elles le restent, et c'est
  exactement ce qui s'est produit : le total en haut de la fiche ne passait par
  aucune des deux et s'affichait « 245.5€ », avec un point décimal anglais et
  le symbole collé, à côté de montants écrits « 245,50 € » deux lignes plus bas.
*/

/**
 * Les trois manières d'annuler une réservation payée.
 *
 * « Barème » est mis en tête parce que c'est le cas courant — un client qui se
 * désiste. Aucun des trois n'est présélectionné : rendre de l'argent, ou le
 * garder, sont deux décisions, et ni l'une ni l'autre ne doit être prise par
 * défaut. Tant qu'aucune n'est cochée, l'annulation est bloquée.
 */
const CHOIX_REMBOURSEMENT: {
  valeur: ChoixRemboursement;
  libelle: (paye: number, bareme: number) => string;
}[] = [
  { valeur: "bareme", libelle: (_p, b) => `Barème d'annulation (${montantLisible(b)})` },
  { valeur: "integral", libelle: (p) => `Remboursement intégral (${montantLisible(p)})` },
  { valeur: "aucun", libelle: () => "Aucun remboursement" },
];

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
  /*
    `null` AU DÉPART, ET C'EST LE CŒUR DE LA CORRECTION.

    L'état partait de `"aucun"`, ce qui cochait « Aucun remboursement » à
    l'ouverture du bloc. Brahim pouvait donc annuler une réservation payée trois
    semaines à l'avance et garder les 180 € du client sans avoir rien décidé —
    il suffisait de ne pas remarquer les trois options. Le commentaire du code
    affirmait l'inverse (« AUCUN n'est présélectionné »), ce qui est précisément
    la manière dont ce genre de piège survit à une relecture.

    Tant qu'il reste de l'argent à rendre, le bouton « Oui, annuler » est
    maintenant inerte : on ne peut pas annuler sans avoir dit ce qu'on fait de
    la somme.
  */
  const [remboursement, setRemboursement] = useState<ChoixRemboursement | null>(null);
  /*
    Le remboursement HORS ANNULATION a son propre état : c'est une autre
    décision, prise à un autre moment, et mélanger les deux ferait qu'ouvrir
    l'un préremplirait l'autre.
  */
  const [remboursementOuvert, setRemboursementOuvert] = useState(false);
  const [choixRemb, setChoixRemb] = useState<ChoixRemboursement | null>(null);
  const [noteOuverte, setNoteOuverte] = useState(false);
  const [texteNote, setTexteNote] = useState(r.noteInterne ?? "");

  const type = TYPES[r.type] ?? TYPES.anniversaire;
  const badge = STATUTS[statut];
  const Icone = type.icone;
  const active = statut === "en_attente" || statut === "confirmee";
  // Ce qu'il resterait à rendre. Zéro quand rien n'a été payé en ligne, ou
  // quand tout a déjà été remboursé : dans les deux cas l'annulation ne pose
  // aucune question d'argent.
  const reste = r.paiement ? r.paiement.montantCents - r.paiement.rembourseCents : 0;

  /*
    Ce que la fiche dit de l'argent, en une ligne. On ne répète le montant que
    lorsqu'il diffère du prix affiché juste au-dessus — c'est-à-dire presque
    jamais, sauf si le tarif a changé depuis la réservation.
  */
  const etatArgent = (() => {
    if (!r.paiement) return { texte: "non payé", classe: "text-muted-foreground" };
    const memeMontant = Math.round(r.total * 100) === r.paiement.montantCents;
    if (r.paiement.rembourseCents <= 0) {
      return {
        texte: memeMontant ? "payé" : `payé ${montantLisible(r.paiement.montantCents)}`,
        classe: "text-field",
      };
    }
    if (reste <= 0) return { texte: "remboursé en entier", classe: "text-destructive" };
    return {
      texte: `remboursé ${montantLisible(r.paiement.rembourseCents)} · reste ${montantLisible(reste)}`,
      classe: "text-destructive",
    };
  })();

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

        {/*
          Aligné à droite sur téléphone, ce bloc dessinait un escalier : montant,
          date, horaire et espace n'ont pas la même longueur, donc chaque ligne
          démarrait à un retrait différent, juste sous un nom de client aligné à
          gauche. On repasse à gauche, sur une seule ligne quand ça tient ;
          l'alignement à droite ne reprend que là où il y a deux colonnes.
          Même correction que sur la fiche de devis.
        */}
        <div className="flex flex-wrap items-baseline gap-x-2 sm:block sm:text-right">
          <p className="text-lg font-bold text-field">{euros(r.total)}</p>
          {/*
            L'ÉTAT DE L'ARGENT EST COLLÉ AU PRIX, et il n'apparaît que s'il
            apprend quelque chose.

            Il vivait sur une ligne à part, sous le bloc de coordonnées :
            « Payé 200 € » répétait donc le « 200 € » affiché trois lignes plus
            haut, sans rien ajouter. Et sur une réservation NON payée — un
            paiement abandonné, ou une réservation antérieure à Stripe — la
            fiche ne disait rien du tout : Brahim ne pouvait pas distinguer
            « réglée » de « pas réglée » sans ouvrir Stripe.

            Quatre états, une ligne, jamais de redondance : non payé, payé,
            remboursé en partie, remboursé en entier.
          */}
          <p className={`text-xs font-medium ${etatArgent.classe}`}>{etatArgent.texte}</p>
          <p className="mt-1 text-sm font-medium">{r.jourLabel}</p>
          <p className="text-sm text-muted-foreground">
            {r.debut} – {r.fin}
          </p>
          {r.espaceNom && <p className="text-xs text-muted-foreground">{r.espaceNom}</p>}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-muted/60 p-3">
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
          <a href={`tel:${r.clientTelephone}`} className="inline-flex min-h-8 items-center gap-1.5 py-0.5 hover:text-field">
            <Telephone className="size-3.5 text-muted-foreground" />
            {r.clientTelephone}
          </a>
          {/*
            L'ADRESSE EST ENVELOPPÉE, ET C'EST NÉCESSAIRE.

            `overflow-wrap: break-word`, posé sur le corps du document, ne
            traverse pas un conteneur `inline-flex` : le texte nu y devient un
            élément flex anonyme dont la largeur minimale vaut son contenu, et
            une adresse de 40 caractères refuse alors de se couper. Mesuré à
            280 px — l'écran de couverture d'un Galaxy Fold —, elle sortait de
            26 px et emportait la page entière avec elle. Le `<span>` lui rend
            le droit de se replier ; `break-all` autorise la coupure ailleurs
            qu'aux tirets, seul moyen de découper une adresse e-mail.
          */}
          <a href={`mailto:${r.clientEmail}`} className="inline-flex min-h-8 min-w-0 items-center gap-1.5 py-0.5 hover:text-field">
            <Enveloppe className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 break-all">{r.clientEmail}</span>
          </a>
          {r.options.length > 0 && (
            <span>
              <span className="text-muted-foreground">Options : </span>
              {r.options.join(", ")}
            </span>
          )}
        </div>

        {/*
          DEUX CHAMPS, DEUX BLOCS. Les allergies et les remarques étaient
          recollées en une seule phrase, sous le triangle d'alerte et en orange :
          « Allergie aux arachides — Merci de prévoir une table pour le gâteau »
          se lisait comme un seul avertissement sanitaire. Le client les a saisies
          dans deux champs distincts parce qu'elles ne pèsent pas pareil : l'une
          peut envoyer un enfant à l'hôpital, l'autre demande une table. Signaler
          les deux au même niveau finit par n'en signaler aucune.
        */}
        {r.allergies && (
          <p className="mt-2 flex items-start gap-1.5 text-sm font-medium text-kick">
            <AlerteTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              <span className="sr-only">Allergies : </span>
              {r.allergies}
            </span>
          </p>
        )}

        {r.remarques && (
          <p className="mt-2 text-sm">
            <span className="text-muted-foreground">Remarques : </span>
            {r.remarques}
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
              <div className="w-full rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5">
                <p className="text-sm text-destructive">
                  Annuler cette réservation ?
                  {reste > 0 && " Choisissez ce qui est rendu au client."}
                </p>

                {/*
                  LE MONTANT N'EST PAS SAISI ICI, ET CE N'EST PAS UN OUBLI.
                  Les trois choix couvrent les trois situations réelles — le
                  client se désiste, le complexe annule, ou la somme reste
                  acquise —, et le serveur recalcule lui-même ce qu'il envoie
                  chez Stripe. Un champ libre ferait de cet écran une commande
                  de virement, à un chiffre de trop près.
                */}
                {/*
                  Les trois choix sont EMPILÉS, un par ligne, et non alignés en
                  rangée : c'est une décision sur de l'argent, pas une barre
                  d'outils. Chacun porte la somme qu'il engage, calculée sur le
                  paiement réel.
                */}
                {reste > 0 && (
                  <fieldset className="mt-2">
                    <legend className="sr-only">Remboursement</legend>
                    <div className="flex flex-col gap-1">
                      {CHOIX_REMBOURSEMENT.map((c) => (
                        <label
                          key={c.valeur}
                          className="inline-flex min-h-9 cursor-pointer items-center gap-2 text-sm"
                        >
                          <input
                            type="radio"
                            name={`remb-${r.id}`}
                            value={c.valeur}
                            checked={remboursement === c.valeur}
                            onChange={() => setRemboursement(c.valeur)}
                            className="size-4 shrink-0 accent-destructive"
                          />
                          {c.libelle(reste, r.paiement?.baremeCents ?? 0)}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={enCours || (reste > 0 && remboursement === null)}
                    onClick={() => {
                      const choix = remboursement ?? "aucun";
                      setConfirmeAnnulation(false);
                      setRemboursement(null);
                      lancer("annuler", async () => {
                        projeter("annulee");
                        return annulerReservation(r.id, choix);
                      });
                    }}
                    className={BOUTON_DANGER}
                  >
                    Oui, annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmeAnnulation(false);
                      // Sans ça, un choix fait puis abandonné resterait coché à
                      // la réouverture du bloc, sur une décision d'argent.
                      setRemboursement(null);
                    }}
                    className={BOUTON_NEUTRE}
                  >
                    Non
                  </button>
                </div>

                {reste > 0 && remboursement === null && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Choisissez ce qui est rendu au client pour pouvoir annuler.
                  </p>
                )}
              </div>
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

          {/*
            REMBOURSER SANS ANNULER — le cas qui manquait.

            Rendre de l'argent n'était possible qu'à la seconde exacte de
            l'annulation. Passé ce moment, plus aucun bouton : Brahim qui avait
            coché « aucun remboursement » puis dont le client rappelait n'avait
            plus que Stripe — où le montant serait parti sans jamais être écrit
            chez nous, laissant la fiche affirmer « 0 € remboursé ».

            Le bouton apparaît dès qu'il reste quelque chose à rendre, quel que
            soit le statut. Sur une réservation encore active, il ne l'annule
            pas : le créneau reste réservé, et le bloc le dit en toutes lettres
            pour qu'on ne s'en serve pas par erreur à la place d'« Annuler ».
          */}
          {reste > 0 &&
            (remboursementOuvert ? (
              <div className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                <p className="text-sm font-medium">
                  Rembourser {montantLisible(reste)} au maximum
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {active
                    ? "La réservation N'EST PAS annulée : le créneau reste réservé au client."
                    : "La réservation reste annulée. Seul l'argent est rendu."}
                </p>

                <fieldset className="mt-2">
                  <legend className="sr-only">Montant à rembourser</legend>
                  <div className="flex flex-col gap-1">
                    {CHOIX_REMBOURSEMENT.filter((c) => c.valeur !== "aucun").map((c) => (
                      <label
                        key={c.valeur}
                        className="inline-flex min-h-9 cursor-pointer items-center gap-2 text-sm"
                      >
                        <input
                          type="radio"
                          name={`remb-hors-${r.id}`}
                          value={c.valeur}
                          checked={choixRemb === c.valeur}
                          onChange={() => setChoixRemb(c.valeur)}
                          className="size-4 shrink-0 accent-field"
                        />
                        {c.libelle(reste, r.paiement?.baremeCents ?? 0)}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={enCours || choixRemb === null}
                    onClick={() => {
                      const choix = choixRemb;
                      if (!choix) return;
                      setRemboursementOuvert(false);
                      setChoixRemb(null);
                      lancer("rembourser", () => rembourserReservation(r.id, choix));
                    }}
                    className={BOUTON_PRINCIPAL}
                  >
                    {occupe("rembourser") ? <Rotative /> : <Coche className="size-4" />}
                    Rembourser
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRemboursementOuvert(false);
                      setChoixRemb(null);
                    }}
                    className={BOUTON_NEUTRE}
                  >
                    Annuler
                  </button>
                </div>

                {choixRemb === null && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Choisissez un montant pour pouvoir rembourser.
                  </p>
                )}
              </div>
            ) : (
              <button
                type="button"
                disabled={enCours}
                onClick={() => setRemboursementOuvert(true)}
                className={BOUTON_NEUTRE}
              >
                {occupe("rembourser") ? <Rotative /> : <Carte className="size-4" />}
                Rembourser
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
                className={BOUTON_NEUTRE}
              >
                {occupe("note") && <Rotative />}
                Enregistrer la note
              </button>
              {/*
                Ce bouton s'appelait « Annuler », comme celui qui annule la
                réservation du client, avec exactement le même style et à
                quelques centimètres de distance. « Fermer » lève l'ambiguïté :
                une des deux actions est irréversible et prévient un client.
              */}
              <button
                type="button"
                onClick={() => {
                  setTexteNote(r.noteInterne ?? "");
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
