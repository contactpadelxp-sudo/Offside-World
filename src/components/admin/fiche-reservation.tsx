"use client";

import { useOptimistic, useState } from "react";
import {
  annulerReservation,
  confirmerReservation,
  effacerDonneesReservation,
  enregistrerNoteReservation,
  rembourserReservation,
  retirerConsentementAllergies,
} from "@/lib/actions/admin";
import type { ChoixRemboursement, ReservationAdmin, StatutReservation } from "@/lib/vues";
import { euros, montantLisible } from "@/lib/tarification";
import {
  decrireConsequence,
  gesteADeuxMontants,
  type Situation,
} from "@/lib/paiement/consequence";
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
  Groupe,
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
  // Ne devrait jamais s'afficher : le team building passe par un devis, pas
  // par une réservation. Nommé quand même, pour qu'une ligne saisie à la main
  // ne se fasse pas passer pour un anniversaire (le repli de `TYPES[r.type]`).
  team_building: { label: "Team building", classe: "bg-kick/10 text-kick", icone: Groupe },
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
  /*
    UN SEUL PANNEAU, DONC UN SEUL ÉTAT D'OUVERTURE.

    Il y en avait deux — l'annulation et le remboursement — chacun avec son
    choix d'argent. Deux portes pour une même décision, et deux occasions de
    rouvrir l'une avec le choix périmé de l'autre.

    Rien n'est présélectionné, et ce n'est pas un détail : l'état partait
    autrefois de « aucun remboursement », si bien qu'annuler une réservation
    payée trois semaines à l'avance gardait les 180 € du client sans que
    personne ait rien décidé. Tant qu'aucune situation n'est choisie, le bouton
    reste inerte.
  */
  const [panneauOuvert, setPanneauOuvert] = useState(false);
  const [situation, setSituation] = useState<Situation | null>(null);
  /** Sous-choix du geste commercial, posé seulement quand deux montants sont possibles. */
  const [montantGeste, setMontantGeste] = useState<ChoixRemboursement | null>(null);
  const [noteOuverte, setNoteOuverte] = useState(false);
  /** Le bouton d’effacement demande une confirmation : voir plus bas. */
  const [effacerArme, setEffacerArme] = useState(false);
  /** Idem pour le retrait du consentement aux allergies : une allergie effacée par mégarde ne se retrouve pas. */
  const [retraitArme, setRetraitArme] = useState(false);
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
    /*
      « PAIEMENT EN COURS » N'EST PAS « NON PAYÉ ».

      Une session Stripe ouverte laisse `paiement` à `null` jusqu'au webhook —
      jusqu'à 30 minutes. La fiche annonçait donc « non payé » sur un client
      qui a la page de paiement sous les yeux. Le serveur ne lève ce drapeau
      que tant que la session vit ; ensuite la fiche repasse à « non payé ».
    */
    if (r.paiementEnCours) return { texte: "paiement en cours", classe: "text-kick" };
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

  const bareme = r.paiement?.baremeCents ?? 0;
  /*
    Le geste commercial n'a deux montants possibles que lorsqu'ils diffèrent
    VRAIMENT. `baremeCents` étant plafonné au reste, l'égalité survient aussi
    bien à plus de 7 jours que sur une réservation déjà partiellement
    remboursée : dans les deux cas, une seule somme est offerte et la
    sous-question ne se pose pas.
  */
  const deuxMontantsPourLeGeste = gesteADeuxMontants(bareme, reste);

  const fermerPanneau = () => {
    setPanneauOuvert(false);
    // Un choix abandonné ne doit pas se retrouver coché à la réouverture : ce
    // sont des décisions sur de l'argent.
    setSituation(null);
    setMontantGeste(null);
  };

  const choisirSituation = (v: Situation) => {
    setSituation(v);
    // Changer de situation invalide le sous-choix : sans ça, un montant coché
    // sous « geste commercial » survivrait à un passage vers « le client se
    // désiste ».
    setMontantGeste(null);
  };

  /*
    QUAND IL N'Y A PAS D'ARGENT, ON NE POSE PAS DE QUESTION D'ARGENT.

    Rien encaissé en ligne, ou tout déjà remboursé : annuler redevient une
    simple confirmation. Ce cas doit être traité à part, et pas seulement par
    souci de concision — avec `reste === 0`, `baremeCents` vaut 0 quelle que
    soit la date, puisqu'il est plafonné au reste. La phrase « à cette date,
    vos conditions d'annulation ne prévoient plus de remboursement » serait
    alors un mensonge : elle n'est vraie que lorsqu'il restait quelque chose à
    rendre et que le barème l'a ramené à zéro.
  */
  const sansArgent = active && reste <= 0;

  /*
    Passée, ou plus active. Voir le bloc « droit à l'effacement » plus bas :
    tant qu'un contrat court, les coordonnées servent à l'exécuter.
  */
  const peutEffacer = r.passee || statut === "annulee" || statut === "expiree";

  /*
    TANT QUE LE CLIENT PAIE, ON NE TOUCHE PAS À SA RÉSERVATION.

    « Confirmer » ferait basculer le statut hors de « en_attente » ; le webhook
    conditionne son écriture à ce statut, ne trouverait plus rien à confirmer,
    et l'e-mail de confirmation ne partirait jamais — argent encaissé, client
    sans trace. « Annuler » rendrait à la vente un créneau en train d'être
    payé, avec la double réservation au bout.

    Aucun des deux ne presse : le drapeau s'éteint tout seul à la fin de la
    session Stripe, réussite ou abandon. Le seul bouton qui reste est la note
    interne, qui n'engage rien.
  */
  const gele = r.paiementEnCours && active;

  const situationsPossibles: { valeur: Situation; titre: string; aide: string }[] = sansArgent
    ? []
    : active
    ? [
        {
          valeur: "desistement",
          titre: "Le client se désiste",
          aide: "C'est lui qui renonce. Vos conditions d'annulation décident de ce qui lui est rendu.",
        },
        {
          valeur: "complexe",
          titre: "C'est nous qui annulons",
          aide: "Terrain indisponible, animateur absent… Il récupère tout, quelle que soit la date.",
        },
        {
          valeur: "geste",
          titre: "Je lui rends de l'argent, mais l'activité a lieu",
          aide: "Geste commercial ou somme payée en trop. Le créneau reste réservé.",
        },
        {
          valeur: "rien",
          titre: "J'annule sans rien lui rendre",
          aide: "Vous pourrez toujours le rembourser plus tard depuis cette fiche.",
        },
      ]
    : [
        // Réservation déjà annulée : il ne reste qu'une question de montant,
        // donc les libellés portent les sommes — ici, c'est la somme qui EST
        // le sens, et les deux ne sont proposées que si elles diffèrent.
        ...(deuxMontantsPourLeGeste
          ? [
              {
                valeur: "remb-partie" as Situation,
                titre: `Ce que prévoient vos conditions d'annulation : ${montantLisible(bareme)}`,
                aide: "Le montant calculé d'après la date de l'activité.",
              },
            ]
          : []),
        {
          valeur: "remb-tout",
          titre: `La totalité de ce qui reste : ${montantLisible(reste)}`,
          aide: "Tout ce qui n'a pas encore été rendu.",
        },
      ];

  const consequence = decrireConsequence(situation, {
    reste,
    bareme,
    montantGeste,
    sansArgent,
    creneau: `le créneau du ${r.jourLabel} à ${r.debut}`,
  });

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
              ? `${r.formuleNom ?? "Formule"} — ${r.nbEnfants ?? "?"} participants${
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
          <div className="mt-2">
            <p className="flex items-start gap-1.5 text-sm font-medium text-kick">
              <AlerteTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                {/*
                  L'ÉTIQUETTE ÉTAIT RÉSERVÉE AUX LECTEURS D'ÉCRAN.
                  La ligne affichait un triangle puis le texte brut, quand la
                  ligne « Remarques : » juste en dessous, moins critique, portait
                  la sienne en clair. Le seul champ qui peut envoyer un enfant à
                  l'hôpital était le seul à ne pas être nommé.
                */}
                <span className="font-semibold">Allergies : </span>
                {r.allergies}
              </span>
            </p>

            {/*
              RETIRER SON CONSENTEMENT DOIT ÊTRE AUSSI SIMPLE QUE DE LE DONNER.

              C'est l'article 7.3 du RGPD, et c'est ce que promet la politique
              de confidentialité. Le donner coûte une case à cocher ; le
              retirer ne peut pas coûter l'effacement de toute la réservation,
              seul outil qui existait — et qui n'apparaît de toute façon que
              sur une réservation passée, annulée ou expirée.

              La commande est ici, sous l'allergie qu'elle efface, et non dans
              la barre d'actions du bas : c'est ce texte-là qui disparaît, et
              c'est en le regardant qu'on décide.
            */}
            {!retraitArme ? (
              <button
                type="button"
                disabled={enCours}
                onClick={() => setRetraitArme(true)}
                className="mt-1 pl-[22px] text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground disabled:opacity-50"
              >
                Le client retire son accord — effacer l&apos;allergie
              </button>
            ) : (
              <div className="mt-1.5 ml-[22px] rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">
                  L&apos;allergie et la date de l&apos;accord seront effacées. La réservation,
                  elle, ne bouge pas. <strong>C&apos;est irréversible</strong> — il faudra la
                  redemander au client.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={enCours}
                    onClick={() =>
                      lancer("retrait-allergies", async () => {
                        const r2 = await retirerConsentementAllergies(r.id);
                        if (r2.ok) setRetraitArme(false);
                        return r2;
                      })
                    }
                    className={BOUTON_DANGER}
                  >
                    {occupe("retrait-allergies") && <Rotative />}
                    Oui, effacer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRetraitArme(false)}
                    className={BOUTON_NEUTRE}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
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
          {gele && (
            <p className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                Un paiement est en cours sur cette réservation.
              </span>{" "}
              Confirmer ou annuler maintenant couperait le paiement en deux.
              Rafraîchissez la page dans quelques minutes : la fiche se débloque dès
              que Stripe a tranché, et au plus tard au bout de 30 minutes.
            </p>
          )}

          {!gele && statut === "en_attente" && !r.passee && (
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

          {/*
            UN SEUL PANNEAU, ET IL PART DE LA SITUATION.

            Il y avait deux boutons concurrents — « Annuler » et
            « Rembourser » — ouvrant chacun sa liste d'options, avec des choix
            qui se recouvraient. Le client a signalé les deux défauts : les
            options se ressemblaient (« j'ai que ces deux choix car on est à
            plus de 7 jours c'est ça ? ») et le second bouton restait opaque
            (« pour le bouton rembourser c'est vraiment pas clair »).

            LE DOUBLON VENAIT DES MONTANTS ÉCRITS DANS LES LIBELLÉS. Mesuré sur
            un paiement de 200 € : à plus de 7 jours, « Barème » et « Intégral »
            affichaient tous deux 200 € ; à moins de 48 h, « Barème » et
            « Aucun » affichaient tous deux 0 €. Deux bandes horaires sur trois
            montraient deux lignes identiques.

            La correction n'est donc pas d'expliquer le doublon, mais de le
            faire disparaître : AUCUN MONTANT DANS LES OPTIONS. On y décrit ce
            qui s'est passé — un fait que l'exploitant connaît avec certitude,
            contrairement à un montant qu'il doit interpréter. Deux situations
            qui donnent aujourd'hui la même somme restent deux situations
            distinctes, et rien à l'écran ne suggère qu'elles font double
            emploi.

            UN SEUL MONTANT SUR TOUT L'ÉCRAN, collé au bouton qui l'engage :
            impossible de choisir le mauvais nombre, puisqu'il n'y en a qu'un.

            ON NE FUSIONNE JAMAIS « barème » EN « intégral », même quand les
            deux valent pareil à l'instant du rendu. Le serveur recalcule à
            partir de la date : sur une page restée ouverte qui franchit le
            seuil des 7 jours, envoyer « intégral » rendrait 100 % là où le
            barème n'en prévoit plus que 50.

            ON NE DÉDUIT JAMAIS LE DÉLAI D'UNE ÉGALITÉ DE MONTANTS. `baremeCents`
            est plafonné au reste (backoffice.ts) : sur une réservation déjà
            partiellement remboursée, « barème = reste » survient aussi à trois
            jours. Les phrases disent donc le RÉSULTAT, jamais le palier.
          */}
          {!gele &&
            (active || reste > 0) &&
            (panneauOuvert ? (
              <div
                className={`w-full rounded-lg border px-3 py-2.5 ${
                  active ? "border-border bg-muted/40" : "border-border bg-muted/40"
                }`}
              >
                {sansArgent ? (
                  <>
                    <p className="text-sm font-medium">Annuler cette réservation ?</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {r.paiement
                        ? "Tout a déjà été remboursé : il ne reste rien à rendre."
                        : "Rien n\u2019a été encaissé en ligne : il n\u2019y a pas d\u2019argent à rendre."}
                    </p>
                  </>
                ) : active ? (
                  <>
                    <p className="text-sm font-medium">Que s&apos;est-il passé ?</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Le montant s&apos;affiche avant que vous validiez.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium">Le client rappelle après coup ?</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      La réservation reste annulée et le créneau ne revient pas. Vous pouvez
                      encore lui rendre de l&apos;argent.
                    </p>
                  </>
                )}

                <fieldset className="mt-2.5" hidden={situationsPossibles.length === 0}>
                  <legend className="sr-only">
                    {active ? "Situation" : "Montant à rendre"}
                  </legend>
                  <div className="flex flex-col gap-1.5">
                    {situationsPossibles.map((sit) => (
                      <label
                        key={sit.valeur}
                        className={`flex min-h-11 cursor-pointer items-start gap-2.5 rounded-lg border px-2.5 py-2 transition-colors ${
                          situation === sit.valeur
                            ? "border-field bg-field/5"
                            : "border-border hover:border-field/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`situation-${r.id}`}
                          value={sit.valeur}
                          checked={situation === sit.valeur}
                          onChange={() => choisirSituation(sit.valeur)}
                          className="mt-0.5 size-4 shrink-0 accent-field"
                        />
                        {/*
                          L'EXPLICATION NE S'AFFICHE QUE SOUS L'OPTION CHOISIE.

                          Les quatre ensemble portaient le panneau à 564 px de
                          haut, mesuré sur un écran de 390 px : le bouton de
                          validation passait sous la ligne de flottaison, et il
                          fallait faire défiler pour lire la conséquence de son
                          propre choix. Les titres se suffisent pour choisir ;
                          la nuance n'est utile qu'une fois qu'on a choisi.

                          Dans un groupe de boutons radio, les flèches
                          déplacent ET sélectionnent : l'explication apparaît
                          donc aussi au clavier, au fur et à mesure.
                        */}
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{sit.titre}</span>
                          {situation === sit.valeur && (
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {sit.aide}
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/*
                  LE SEUL SOUS-CHOIX DE L'ÉCRAN, ET IL N'APPARAÎT QUE S'IL A
                  UN SENS.

                  Combien vaut un geste commercial est la seule décision
                  réellement libre ici : l'interface ne la prend pas à la place
                  de l'exploitant. Elle ne la pose pas non plus quand une seule
                  somme est possible — poser une question à une seule réponse
                  fait douter qu'il y en ait d'autres.
                */}
                {situation === "geste" && deuxMontantsPourLeGeste && (
                  <fieldset className="ml-6 mt-2 border-l border-border pl-3">
                    <legend className="text-xs text-muted-foreground">
                      Combien lui rendez-vous ?
                    </legend>
                    <div className="mt-1 flex flex-col gap-1">
                      {([
                        { v: "bareme" as ChoixRemboursement, t: `Une partie : ${montantLisible(bareme)}` },
                        { v: "integral" as ChoixRemboursement, t: `La totalité : ${montantLisible(reste)}` },
                      ]).map((m) => (
                        <label
                          key={m.v}
                          className="inline-flex min-h-9 cursor-pointer items-center gap-2 text-sm"
                        >
                          <input
                            type="radio"
                            name={`geste-${r.id}`}
                            value={m.v}
                            checked={montantGeste === m.v}
                            onChange={() => setMontantGeste(m.v)}
                            className="size-4 shrink-0 accent-field"
                          />
                          {m.t}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}

                {/*
                  LE SEUL MONTANT DE L'ÉCRAN, ET IL TOUCHE LE BOUTON.

                  `aria-live` pour qu'il soit annoncé quand il change ; collé
                  au bouton pour que la somme et le geste se lisent d'un même
                  regard, même après avoir fait défiler.
                */}
                {consequence && (
                  <p
                    aria-live="polite"
                    className="mt-2.5 rounded-lg bg-background px-2.5 py-2 text-sm"
                  >
                    <span className="block text-xs text-muted-foreground">En validant :</span>
                    {consequence.phrase}
                  </p>
                )}

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={enCours || !consequence}
                    onClick={() => {
                      if (!consequence) return;
                      const { action, choix } = consequence;
                      fermerPanneau();
                      lancer(action === "annuler" ? "annuler" : "rembourser", async () => {
                        if (action === "annuler") {
                          projeter("annulee");
                          return annulerReservation(r.id, choix);
                        }
                        return rembourserReservation(r.id, choix);
                      });
                    }}
                    className={consequence?.action === "annuler" ? BOUTON_DANGER : BOUTON_PRINCIPAL}
                  >
                    {consequence ? consequence.bouton : "Valider"}
                  </button>
                  {/*
                    « Fermer » et jamais « Annuler » : le bouton qui annule la
                    RÉSERVATION du client est juste à côté, dans le même style.
                  */}
                  <button type="button" onClick={fermerPanneau} className={BOUTON_NEUTRE}>
                    Fermer
                  </button>
                </div>

                {!consequence && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {active
                      ? "Choisissez d\u2019abord ce qui s\u2019est passé."
                      : "Choisissez d\u2019abord le montant."}
                  </p>
                )}
              </div>
            ) : (
              <button
                type="button"
                disabled={enCours}
                onClick={() => setPanneauOuvert(true)}
                className={BOUTON_NEUTRE}
              >
                {occupe("annuler") || occupe("rembourser") ? (
                  <Rotative />
                ) : active ? (
                  <Croix className="size-4" />
                ) : (
                  <Carte className="size-4" />
                )}
                {/*
                  Le libellé dit ce qui est possible ici et maintenant, au lieu
                  de proposer deux portes dont on ne sait pas laquelle pousser.
                */}
                {!active
                  ? "Rendre de l\u2019argent"
                  : reste > 0
                    ? "Annuler ou rembourser\u2026"
                    : "Annuler la réservation"}
              </button>
            ))}

          {/*
            LE DROIT À L'EFFACEMENT, ATTEIGNABLE.

            La politique de confidentialité le promet ; il n'existait nulle part
            ailleurs que dans du SQL écrit à la main.

            QUAND IL EST POSSIBLE. Sur une réservation PASSÉE, ou ANNULÉE ou
            EXPIRÉE même à venir : dans les deux cas il n'y a plus de contrat à
            exécuter, et l'article 17.1.a s'applique — les données ne sont plus
            nécessaires à la finalité pour laquelle elles ont été collectées.

            QUAND IL NE L'EST PAS, et pourquoi ce n'est pas un refus du droit.
            Sur une réservation À VENIR et toujours active, les coordonnées
            servent encore à exécuter le contrat : sans elles, le client se
            présenterait à une réservation sans nom, et le complexe ne pourrait
            plus le joindre si le créneau change. L'article 17.3.b réserve
            précisément ce cas. La marche à suivre est d'annuler d'abord, ce qui
            met fin au contrat — et le bouton apparaît alors.

            Le premier état le disait en NE MONTRANT RIEN, ce qui laissait
            croire à un oubli. Il l'écrit maintenant.
          */}
          {!peutEffacer && !r.passee && (
            <span className="text-xs text-muted-foreground">
              Effacement possible une fois la réservation passée ou annulée.
            </span>
          )}
          {peutEffacer && !effacerArme && (
            <button
              type="button"
              disabled={enCours}
              onClick={() => setEffacerArme(true)}
              className={BOUTON_NEUTRE}
            >
              Effacer les données du client
            </button>
          )}
          {peutEffacer && effacerArme && (
            <div className="w-full rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5">
              <p className="text-sm font-medium">Effacer définitivement les données de ce client ?</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Nom, e-mail, téléphone, prénom et âge de la personne fêtée, allergies, remarques
                et note interne. Le montant et la date restent, sans personne derrière, pour la
                comptabilité. <strong>C&apos;est irréversible.</strong>
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={enCours}
                  onClick={() =>
                    lancer("effacer", async () => {
                      const r2 = await effacerDonneesReservation(r.id);
                      if (r2.ok) setEffacerArme(false);
                      return r2;
                    })
                  }
                  className={BOUTON_DANGER}
                >
                  {occupe("effacer") && <Rotative />}
                  Oui, effacer
                </button>
                <button type="button" onClick={() => setEffacerArme(false)} className={BOUTON_NEUTRE}>
                  Fermer
                </button>
              </div>
            </div>
          )}

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
