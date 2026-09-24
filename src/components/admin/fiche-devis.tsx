"use client";

import { useOptimistic, useState } from "react";
import {
  changerStatutDevis,
  enregistrerDevis,
  enregistrerNoteDevis,
  envoyerDevis,
  rouvrirDemandeDevis,
} from "@/lib/actions/admin";
import type { DevisAdmin, StatutDevis } from "@/lib/vues";
import {
  devisPreRempli,
  montantsDevis,
  obstaclesEnvoi,
  reservesDevis,
  totalLigneCents,
  type LigneDevis,
} from "@/lib/devis";
import { montantLisible } from "@/lib/tarification";
import { TVA_TAUX_DEFAUT } from "@/data/reglement";
import {
  BOUTON_NEUTRE,
  BOUTON_PRINCIPAL,
  MessageAction,
  Rotative,
  useAction,
} from "@/components/admin/retour";
import { AlerteTriangle, Coche, Croix, Document, Enveloppe, Groupe, Telephone } from "@/components/icons";

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
/**
 * L'état d'une demande, en français.
 *
 * `devis_envoye` est le seul que l'exploitant ne peut pas poser à la main :
 * il s'écrit tout seul quand le devis part réellement. Les autres constatent
 * ce qu'a répondu le client, ou rangent une demande traitée par téléphone —
 * ce qui est le cas courant en team building.
 */
const ETAT_DEVIS: Record<StatutDevis, { label: string; classe: string }> = {
  nouvelle: { label: "Nouvelle demande", classe: "bg-kick/15 text-kick" },
  traitee: { label: "Prise en charge", classe: "bg-white/10 text-foreground" },
  devis_envoye: { label: "Devis envoyé", classe: "bg-field/15 text-field" },
  acceptee: { label: "Acceptée", classe: "bg-field/15 text-field" },
  refusee: { label: "Refusée", classe: "bg-destructive/15 text-destructive" },
};

export function FicheDevis({ d }: { d: DevisAdmin }) {
  const { enCours, occupe, retour, lancer } = useAction();
  const [noteOuverte, setNoteOuverte] = useState(false);
  const [texteNote, setTexteNote] = useState(d.noteInterne ?? "");
  /*
    L'état bascule tout de suite à l'écran, le serveur ne fait que confirmer.
    Sans ça, marquer une demande « refusée » laissait l'étiquette inchangée
    jusqu'au rechargement, et on recliquait.
  */
  const [statut, projeterStatut] = useOptimistic<StatutDevis, StatutDevis>(
    d.statut,
    (_a, vise) => vise
  );

  // Un devis déjà rédigé est repris tel quel ; sinon on part du pré-rempli.
  const [lignes, setLignes] = useState<LigneDevis[]>(
    d.devis.lignes.length > 0 ? d.devis.lignes : devisPreRempli(d.brut).lignes
  );
  const [mot, setMot] = useState(d.devis.message);
  const [validite, setValidite] = useState(d.devis.validite);
  const [envoye, setEnvoye] = useState(d.devis.envoyeLe);
  /*
    LE JETON DE CONCURRENCE, PAS UN AFFICHAGE.

    Il part avec chaque envoi : le serveur refuse si la base porte un autre
    horodatage, c'est-à-dire si un autre écran a envoyé le devis entre-temps.
    Sans ça, deux onglets ouverts sur la même demande expédiaient deux PDF
    portant la même référence et des montants différents.

    On le remet à jour depuis la réponse du serveur plutôt que depuis les
    propriétés rafraîchies : sinon un second envoi légitime, fait depuis CET
    onglet, se ferait refuser comme périmé le temps que la revalidation
    redescende.
  */
  const [jetonEnvoi, setJetonEnvoi] = useState(d.devis.envoyeLeExact);
  /*
    `??` et non `||` : un taux de 0 % est un choix valable — une exonération se
    saisit ainsi — et `||` le remplacerait par 6. Seul un taux ABSENT prend la
    valeur proposée.
  */
  const [tva, setTva] = useState<number | null>(d.devis.tvaPourcent ?? TVA_TAUX_DEFAUT);
  const [adresse, setAdresse] = useState(d.client.adresse);
  const [tvaClient, setTvaClient] = useState(d.client.tva);

  const devis = {
    lignes,
    message: mot,
    validite,
    tvaPourcent: tva,
    clientAdresse: adresse,
    clientTva: tvaClient,
  };
  /*
    CE QUI N'EST PAS ENCORE ENREGISTRÉ, DIT À L'ÉCRAN.

    Un devis se rédige : des lignes, des montants, un mot d'introduction, une
    adresse de facturation. Tout cela vit dans cet écran tant qu'on n'a pas
    cliqué. Rien ne le signalait, et rien ne retenait quand on partait — un
    onglet fermé, un retour en arrière, et le travail était perdu sans un mot.

    Les tarifs et les articles de blog ont reçu le même avertissement. Un devis
    le mérite au moins autant : c'est un document qui engage un prix.

    On compare des empreintes plutôt que champ par champ, parce que les lignes
    sont un tableau d'objets ; l'ordre des clés est fixé par la construction
    ci-dessus, donc la comparaison est stable.
  */
  const empreinte = JSON.stringify(devis);
  const [empreinteEnregistree, setEmpreinteEnregistree] = useState(empreinte);
  const modifie = empreinte !== empreinteEnregistree;

  const obstacles = obstaclesEnvoi(devis);
  const reserves = reservesDevis({ tvaPourcent: tva, clientAdresse: adresse, clientTva: tvaClient });
  const m = montantsDevis(lignes, tva);

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
      // Ancre visée par la ligne d'un créneau tenu, au back-office Créneaux.
      id={`devis-${d.id}`}
      className={`scroll-mt-24 rounded-2xl border border-border bg-card p-5 transition-opacity duration-200 ${
        enCours ? "opacity-70" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {/*
              L'ÉTIQUETTE DIT L'ÉTAT DE LA DEMANDE, PAS L'ENVOI DU DEVIS.

              Elle ne lisait que `devis_envoye_le`. Une demande acceptée par
              téléphone, sans devis envoyé depuis le site, s'affichait donc
              « À traiter » — y compris dans la liste des demandes CLOSES, où
              elle figure parce que son statut vaut « acceptée ». Deux notions
              différentes montrées comme une seule : c'est exactement ce que le
              client a vu et trouvé bizarre.

              L'envoi reste affiché, mais à sa place : en dessous, comme un
              fait daté, et non comme l'état de la demande.
            */}
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${ETAT_DEVIS[statut].classe}`}
            >
              {ETAT_DEVIS[statut].label}
            </span>
            <span className="font-mono text-xs text-muted-foreground">{d.reference}</span>
            {/*
              À côté de l'étiquette d'état, et non en bas près des boutons :
              une fiche de devis est longue, et les boutons sont hors de l'écran
              dès qu'on saisit une ligne sur un téléphone.
            */}
            {modifie && (
              <span className="inline-flex items-center rounded-md bg-kick/15 px-2 py-0.5 text-xs font-semibold text-kick">
                non enregistré
              </span>
            )}
          </div>
          <h2 className="mt-2 font-bold">{d.entreprise}</h2>
          <p className="text-sm text-muted-foreground">{d.contactNom}</p>
          {/*
            Après un envoi réussi, l'horodatage passe à « à l'instant » : on
            n'ajoute « le » que devant une vraie date, sans quoi le gabarit
            écrivait « Devis envoyé le à l'instant ».
          */}
          {envoye && (
            <p className="mt-0.5 text-xs text-field">
              {envoye === "à l'instant" ? "Devis envoyé à l'instant" : `Devis envoyé le ${envoye}`}
            </p>
          )}
        </div>

        {/*
          `sm:block` SUR CHAQUE LIGNE, et pas seulement sur le conteneur.

          Le conteneur passait bien en `block` à partir de `sm:`, mais ses
          enfants restaient des `span` en ligne : la date et la période se
          collaient l'une à l'autre, et l'écran affichait « Jeudi 15 octobre
          2026Après-midi ». Le séparateur « · » ne rattrapait rien, puisqu'il
          est justement masqué à cette taille — il n'existe que pour la version
          téléphone, où tout tient sur une ligne.
        */}
        <div className="flex flex-wrap items-center gap-x-2 text-sm sm:block sm:text-right">
          {d.dateSouhaitee && <span className="font-medium sm:block">{d.dateSouhaitee}</span>}
          {d.periode && (
            <span className="text-muted-foreground sm:block">
              <span className="sm:hidden">· </span>
              {d.periode}
            </span>
          )}
          {d.nbParticipants && (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground sm:flex sm:justify-end">
              <span className="sm:hidden">·</span>
              <Groupe className="size-3.5" />
              {d.nbParticipants} participant{d.nbParticipants > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/*
        LE CRÉNEAU QUE LA DEMANDE TIENT — OU A TENU.

        Depuis la migration 0036, une demande réserve sa Fun zone dès l'envoi.
        Brahim doit voir laquelle : c'est le terrain à préparer, et c'est ce
        qu'une autre entreprise ne peut plus demander. Barré quand la demande a
        été refusée : la place est rendue à la vente, mais on garde la trace de
        ce qui avait été choisi.

        L'AVERTISSEMENT SPORT-FINDER est posé ici et pas ailleurs, parce que
        c'est ici que se prend la décision. Un après-midi de team building tombe
        dans les heures où Sport-Finder loue les mêmes terrains : accepter la
        demande sans fermer la plage là-bas, c'est vendre le terrain deux fois.
      */}
      {d.creneaux.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {d.creneaux.map((c) => (
            <p key={c.libelle} className="text-sm">
              {c.actif ? (
                <span className="font-medium text-field">Réservé pour cette demande · </span>
              ) : (
                <span className="text-muted-foreground">Rendu à la vente · </span>
              )}
              <span className={c.actif ? "" : "text-muted-foreground line-through"}>{c.libelle}</span>
            </p>
          ))}
          {d.creneaux.some((c) => c.actif && c.heurteSportFinder) && (
            <p className="flex items-start gap-1.5 rounded-lg border border-kick/40 bg-kick/5 px-3 py-2 text-xs text-kick">
              <AlerteTriangle className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Cet horaire est aussi vendu sur Sport-Finder. Si vous acceptez cette demande,
                fermez la plage correspondante sur Sport-Finder.
              </span>
            </p>
          )}
        </div>
      )}

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
          Le devis ci-dessous part au client, en PDF joint à l&apos;e-mail.
        </p>

        {/*
          COORDONNÉES DE FACTURATION DU CLIENT. Le formulaire public ne les
          demande pas — réclamer une adresse complète et un numéro de TVA à un
          prospect qui n'a pas encore vu un prix ferait fuir des demandes. Elles
          se saisissent ici, au moment où l'exploitant est de toute façon en
          contact avec la société.
        */}
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`adr-${d.id}`} className="mb-1 block text-xs text-muted-foreground">
              Adresse du client
            </label>
            <input
              id={`adr-${d.id}`}
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              maxLength={300}
              placeholder="Rue, numéro, code postal, ville"
              className="w-full rounded-lg border border-border bg-input/30 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-field/60"
            />
          </div>
          <div>
            <label htmlFor={`tvac-${d.id}`} className="mb-1 block text-xs text-muted-foreground">
              N° de TVA du client
            </label>
            <input
              id={`tvac-${d.id}`}
              value={tvaClient}
              onChange={(e) => setTvaClient(e.target.value)}
              maxLength={40}
              placeholder="BE 0123.456.789"
              className="w-full rounded-lg border border-border bg-input/30 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-field/60"
            />
          </div>
        </div>

        <div className="space-y-2">
          {lignes.map((l, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2 sm:flex-nowrap">
              <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                <label htmlFor={`des-${d.id}-${i}`} className="mb-1 block text-xs text-muted-foreground">
                  Désignation
                </label>
                {/*
                  UN CHAMP QUI SE REPLIE, PAS UN CHAMP QUI DÉFILE.

                  La désignation est pré-remplie — « Team building —
                  privatisation, jeudi 15 octobre 2026, après-midi,
                  42 participants ». Dans un <input> d'une ligne sur un écran de
                  375 px, il en manquait 146 : Brahim relisait « Team building —
                  privatisation, Jeudi 15 oct » et devait faire défiler à
                  l'horizontale, à l'aveugle, un texte qui part chez un client
                  sur un document engageant. Mesuré à 320 px, il en manquait 201.

                  Un <textarea> de deux lignes le montre en entier. `rows` est un
                  minimum : le champ se replie au-delà si la ligne est longue,
                  et le retour à la ligne est neutralisé plus bas puisque la
                  désignation d'une ligne de devis reste une seule phrase.
                */}
                <textarea
                  id={`des-${d.id}-${i}`}
                  value={l.designation}
                  onChange={(e) => majLigne(i, "designation", e.target.value.replace(/\s*\n\s*/g, " "))}
                  onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                  maxLength={200}
                  rows={2}
                  className="w-full resize-y rounded-lg border border-border bg-input/30 px-3 py-2 text-sm leading-snug outline-none focus-visible:ring-2 focus-visible:ring-field/60"
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

        <div className="mt-4 space-y-1 border-t border-border pt-3">
          {m.tvaCents === null ? (
            <div className="flex items-center justify-between">
              <span className="font-bold">Total</span>
              <span className="text-lg font-bold text-field">{montantLisible(m.totalCents)}</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Total HTVA</span>
                <span>{montantLisible(m.baseCents)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>TVA {tva} %</span>
                <span>{montantLisible(m.tvaCents)}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="font-bold">Total TVAC</span>
                <span className="text-lg font-bold text-field">{montantLisible(m.totalCents)}</span>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            {/*
              AUCUN TAUX PAR DÉFAUT. Le taux applicable à une privatisation de
              complexe sportif n'est pas une évidence, et un défaut silencieux
              finirait par partir tel quel sur un document comptable.
            */}
            <label htmlFor={`tva-${d.id}`} className="mb-1 block text-xs text-muted-foreground">
              TVA
            </label>
            <select
              id={`tva-${d.id}`}
              value={tva === null ? "" : String(tva)}
              onChange={(e) => setTva(e.target.value === "" ? null : Number(e.target.value))}
              style={{ colorScheme: "dark" }}
              className="w-full rounded-lg border border-border bg-input/30 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-field/60"
            >
              <option value="">Non renseignée</option>
              <option value="21">21 % — taux normal</option>
              <option value="6">6 % — taux réduit</option>
              <option value="0">0 % — exonéré</option>
            </select>
          </div>
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
                const r = await envoyerDevis(d.id, devis, jetonEnvoi);
                if (r.ok) {
                  setEnvoye("à l'instant");
                  if (r.envoyeLe) setJetonEnvoi(r.envoyeLe);
                  // L'envoi enregistre aussi : ce qui vient de partir au client
                  // devient la nouvelle référence.
                  setEmpreinteEnregistree(empreinte);
                }
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
            onClick={() =>
              lancer("brouillon", async () => {
                const r = await enregistrerDevis(d.id, devis);
                if (r.ok) setEmpreinteEnregistree(empreinte);
                return r;
              })
            }
            className={BOUTON_NEUTRE}
          >
            {occupe("brouillon") ? <Rotative /> : <Coche className="size-4" />}
            Enregistrer sans envoyer
          </button>

          {/*
            L'APERÇU OUVRE LE PDF RÉELLEMENT GÉNÉRÉ, pas une imitation en HTML.
            Il passe par la même fonction que l'envoi : ce que Brahim voit est
            exactement ce que le client recevra, y compris la mise en page et
            les arrondis. Un aperçu qui ne serait pas le document lui-même ne
            servirait qu'à rassurer à tort.

            La forme est un formulaire plutôt qu'un lien : les montants en cours
            de saisie ne sont pas encore en base, et les faire transiter par une
            URL les exposerait dans l'historique du navigateur et les journaux
            du serveur.
          */}
          <form action={`/admin/devis/${d.id}/apercu`} method="POST" target="_blank" className="contents">
            <input type="hidden" name="devis" value={JSON.stringify(devis)} />
            <button type="submit" className={BOUTON_NEUTRE}>
              <Document className="size-4" />
              Voir le PDF
            </button>
          </form>

          {/*
            CLORE UNE DEMANDE — CE QUI ÉTAIT IMPOSSIBLE.

            Le seul changement d'état était l'envoi du devis. Un client qui
            refuse, ou qui ne répond jamais, laissait sa demande dans la liste
            active pour toujours : elle proposait pourtant « voir aussi les
            demandes closes », alors que rien ne pouvait en clore une.

            Une demande close redevient ouverte d'un clic : ranger quelque
            chose ne doit jamais être un aller simple.
          */}
          {statut === "acceptee" || statut === "refusee" ? (
            <button
              type="button"
              disabled={enCours}
              onClick={() =>
                lancer("statut", async () => {
                  /*
                    La projection et l'écriture suivent désormais LA MÊME
                    RÈGLE. La fiche affichait « Devis envoyé » pendant que le
                    serveur écrivait « traitee » : la pastille reculait vers
                    « Prise en charge » une seconde plus tard, et la fiche
                    perdait l'information la plus utile de l'écran. Le serveur
                    tranche maintenant seul, d'après `devis_envoye_le`.
                  */
                  projeterStatut(d.devis.envoyeLe ? "devis_envoye" : "nouvelle");
                  return rouvrirDemandeDevis(d.id);
                })
              }
              className={BOUTON_NEUTRE}
            >
              {occupe("statut") && <Rotative />}
              Rouvrir la demande
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={enCours}
                onClick={() =>
                  lancer("statut", async () => {
                    projeterStatut("acceptee");
                    return changerStatutDevis(d.id, "acceptee");
                  })
                }
                className={BOUTON_NEUTRE}
              >
                {occupe("statut") ? <Rotative /> : <Coche className="size-4" />}
                Le client accepte
              </button>
              <button
                type="button"
                disabled={enCours}
                onClick={() =>
                  lancer("statut", async () => {
                    projeterStatut("refusee");
                    return changerStatutDevis(d.id, "refusee");
                  })
                }
                className={BOUTON_NEUTRE}
              >
                <Croix className="size-4" />
                Le client refuse
              </button>
            </>
          )}

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

        {obstacles.length === 0 && reserves.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Envoyable, mais il manque {reserves.join(", ")}. Le devis partira sans.
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
