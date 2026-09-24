import "server-only";
import type { Message } from "@/lib/email/envoi";
import { adresseComplexe } from "@/lib/email/envoi";
import { urlAbsolue } from "@/lib/site";
import {
  ADRESSE_LIGNE,
  BCE,
  RAISON_SOCIALE,
  EMAIL,
  NOM_COMMERCIAL,
  TVA,
} from "@/data/entreprise";
import { RESUME_ANNULATION } from "@/data/reglement";
import { jourLisibleCap } from "@/lib/temps";
import { montantLisible } from "@/lib/tarification";
import { montantsDevis, totalLigneCents, type LigneDevis } from "@/lib/devis";

/**
 * Messages transactionnels.
 *
 * QUATRE PARTIS PRIS
 *
 * 1. RIEN N'EST INVENTÉ. Ces e-mails ne promettent que ce que le complexe
 *    tient réellement : une demande enregistrée est présentée comme une
 *    demande, un paiement encaissé comme un paiement. Pas de consigne
 *    d'arrivée, pas de QR code, et surtout pas de « paiement reçu » quand rien
 *    n'a été reçu — l'e-mail lit l'état réel du paiement en base plutôt que de
 *    faire confiance à celui qui le déclenche.
 *
 * 2. LE CONTENU DES ALLERGIES NE PARTIT PAS PAR E-MAIL. L'avis interne signale
 *    qu'une allergie a été renseignée et renvoie au back-office ; il n'en
 *    recopie pas le détail. C'est une donnée de santé concernant un enfant :
 *    la dupliquer dans une boîte aux lettres, souvent partagée et rarement
 *    chiffrée au repos, n'apporte rien que le back-office ne donne déjà.
 *
 * 3. HTML SOBRE ET LISIBLE PARTOUT. Fond clair — un e-mail sombre passe mal
 *    dans la moitié des clients de messagerie —, styles en ligne, aucune image
 *    distante, et une version texte complète pour ceux qui refusent le HTML.
 *
 * 4. L'E-MAIL EST LE SUPPORT DURABLE. Quand une réservation est payée, le
 *    contrat est conclu à distance : l'article VI.46 § 7 du Code de droit
 *    économique impose d'en confirmer les termes « sur un support durable ».
 *    Une page web ne l'est pas — elle change sans laisser de trace, et le
 *    client n'en garde rien. Cet e-mail, lui, reste dans sa boîte. Il doit
 *    donc porter lui-même l'identité du vendeur, le montant payé, l'absence de
 *    droit de rétractation et le barème d'annulation, et pas seulement un lien
 *    vers des pages qui les contiennent.
 */

const ACCENT = "#b67c12";
const ENCRE = "#1a1a1c";
const GRIS = "#5b5b62";

/** Échappe le texte inséré dans le HTML : ces valeurs viennent des clients. */
function ech(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface Ligne {
  cle: string;
  valeur: string;
}

/**
 * Identité du vendeur, telle qu'elle doit figurer sur le support durable.
 *
 * Les champs encore inconnus sont OMIS, pas remplacés par « [à compléter] ».
 * Les pages du site affichent ce marqueur, et c'est voulu : il s'adresse à
 * nous. Un client, lui, ne doit pas recevoir un e-mail qui a l'air cassé. Le
 * jour où le numéro d'entreprise sera renseigné dans `data/entreprise.ts`, il
 * apparaîtra ici sans qu'on touche à ce fichier.
 */
function identiteVendeur(): string[] {
  const lignes = [
    RAISON_SOCIALE && RAISON_SOCIALE !== NOM_COMMERCIAL
      ? `${RAISON_SOCIALE} (${NOM_COMMERCIAL})`
      : NOM_COMMERCIAL,
    ADRESSE_LIGNE,
  ];
  if (BCE) lignes.push(`Numéro d'entreprise : ${BCE}`);
  if (TVA) lignes.push(`TVA : BE ${TVA}`);
  return lignes;
}

/** Pied de page légal, en HTML. */
function piedLegal(): string {
  const identite = identiteVendeur().map(ech).join("<br>");
  const lien = (chemin: string, libelle: string) =>
    `<a href="${urlAbsolue(chemin)}" style="color:${ACCENT};">${libelle}</a>`;
  return `${identite}<br>
    <a href="mailto:${ech(EMAIL)}" style="color:${ACCENT};">${ech(EMAIL)}</a><br>
    ${lien("/cgv", "Conditions générales de vente")} ·
    ${lien("/mentions-legales", "Mentions légales")} ·
    ${lien("/confidentialite", "Vie privée")}`;
}

/** Le même pied, en texte brut : les URL sont écrites en toutes lettres. */
function piedLegalTexte(): string {
  return [
    ...identiteVendeur(),
    EMAIL,
    `Conditions générales de vente : ${urlAbsolue("/cgv")}`,
    `Mentions légales : ${urlAbsolue("/mentions-legales")}`,
    `Vie privée : ${urlAbsolue("/confidentialite")}`,
  ].join("\n");
}

function enveloppe(
  titre: string,
  intro: string,
  lignes: Ligne[],
  apres: string[],
  legal = false
): string {
  const rangs = lignes
    .map(
      (l) => `<tr>
        <td style="padding:6px 0;color:${GRIS};font-size:14px;">${ech(l.cle)}</td>
        <td style="padding:6px 0;text-align:right;font-size:14px;font-weight:600;color:${ENCRE};">${ech(l.valeur)}</td>
      </tr>`
    )
    .join("");

  const paragraphes = apres
    .map((p) => `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:${GRIS};">${p}</p>`)
    .join("");

  return `<!doctype html>
<html lang="fr"><body style="margin:0;padding:24px 12px;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;border:1px solid #e6e6e3;">
    <tr><td style="height:4px;background:${ACCENT};border-radius:14px 14px 0 0;"></td></tr>
    <tr><td style="padding:28px 28px 8px;">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${ACCENT};font-weight:700;">${ech(NOM_COMMERCIAL)}</p>
      <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:${ENCRE};">${ech(titre)}</h1>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:${ENCRE};">${intro}</p>
    </td></tr>
    ${
      rangs
        ? `<tr><td style="padding:0 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #ececea;border-bottom:1px solid #ececea;">${rangs}</table>
          </td></tr>`
        : ""
    }
    <tr><td style="padding:18px 28px 4px;">${paragraphes}</td></tr>
    <tr><td style="padding:8px 28px 26px;border-top:1px solid #ececea;">
      <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:${GRIS};">
        ${
          legal
            ? piedLegal()
            : `${ech(NOM_COMMERCIAL)} — ${ech(ADRESSE_LIGNE)}<br>
        <a href="mailto:${ech(EMAIL)}" style="color:${ACCENT};">${ech(EMAIL)}</a>`
        }
      </p>
    </td></tr>
  </table>
</body></html>`;
}

function versTexte(
  titre: string,
  intro: string,
  lignes: Ligne[],
  apres: string[],
  legal = false
): string {
  const bloc = lignes.map((l) => `${l.cle} : ${l.valeur}`).join("\n");
  const sansBalises = (v: string) => v.replace(/<[^>]+>/g, "");
  return [
    NOM_COMMERCIAL.toUpperCase(),
    "",
    titre,
    "",
    sansBalises(intro),
    bloc ? `\n${bloc}\n` : "",
    ...apres.map(sansBalises),
    "",
    legal ? piedLegalTexte() : `${NOM_COMMERCIAL} — ${ADRESSE_LIGNE}\n${EMAIL}`,
  ]
    .filter((l) => l !== "")
    .join("\n");
}

function composer(
  destinataire: string,
  sujet: string,
  titre: string,
  intro: string,
  lignes: Ligne[],
  apres: string[],
  repondreA?: string,
  /** Ajoute l'identité complète du vendeur et les liens légaux au pied. */
  legal = false
): Message {
  return {
    destinataire,
    sujet,
    texte: versTexte(titre, intro, lignes, apres, legal),
    html: enveloppe(titre, intro, lignes, apres, legal),
    repondreA,
  };
}

// ── Données transmises aux modèles ───────────────────────────────────────────

export interface RecapEmail {
  reference: string;
  activite: string;
  jourLabel: string;
  debut: string;
  fin: string;
  espaceNom?: string | null;
  /**
   * En CENTIMES, comme partout ailleurs dans le projet. Ce champ était en
   * euros : c'était le seul montant du code à ne pas l'être, et il forçait un
   * aller-retour par un flottant juste avant d'être écrit à un client.
   */
  totalCents: number;
  clientNom: string;
  clientEmail: string;
  clientTelephone: string;
  detail?: string | null;
  options?: string[];
  /** Vrai si une allergie a été renseignée. Le contenu reste au back-office. */
  allergieSignalee?: boolean;
  remarques?: string | null;
  /**
   * Paiement encaissé, s'il y en a un. `null` tant que rien n'a été payé en
   * ligne — c'est le cas de toutes les réservations confirmées à la main.
   */
  paiement?: {
    montantCents: number;
    /** Cumul déjà rendu au client. Zéro tant que rien n'a été remboursé. */
    rembourseCents: number;
    methode: string | null;
  } | null;
}

export interface DevisEmail {
  reference: string;
  entreprise: string;
  contactNom: string;
  contactEmail: string;
  contactTelephone: string;
  dateSouhaitee: string;
  periode: string;
  nbParticipants: number;
  message?: string | null;
  /**
   * Le créneau tenu tombe dans les heures où Sport-Finder loue les mêmes
   * terrains. Plus aucun ne le fait depuis le 24 septembre 2026 — le foot
   * ouvre à 18h, quand l'après-midi finit — mais la règle reste en place pour
   * le jour où les horaires bougeront. Le site le retient, mais Sport-Finder peut
   * l'avoir déjà loué ou le louer d'ici la réponse : on ne peut donc pas le
   * dire « réservé » au client, seulement « retenu », et le complexe doit
   * fermer la plage là-bas dès réception.
   */
  heurteSportFinder?: boolean;
}

function lignesReservation(r: RecapEmail): Ligne[] {
  const lignes: Ligne[] = [
    { cle: "Référence", valeur: r.reference },
    { cle: "Activité", valeur: r.activite },
  ];
  if (r.detail) lignes.push({ cle: "Détail", valeur: r.detail });
  lignes.push(
    { cle: "Date", valeur: r.jourLabel },
    { cle: "Horaire", valeur: `${r.debut} – ${r.fin}` }
  );
  if (r.espaceNom) lignes.push({ cle: "Espace", valeur: r.espaceNom });
  if (r.options?.length) lignes.push({ cle: "Options", valeur: r.options.join(", ") });
  // « TVAC » et non « TTC » : c'est la mention belge, et le client doit lire
  // sans ambiguïté que le prix affiché est celui qu'il paie.
  lignes.push({ cle: "Montant", valeur: `${montantLisible(r.totalCents)} TVAC` });
  if (r.paiement) {
    lignes.push({
      cle: "Payé",
      valeur: r.paiement.methode
        ? `${montantLisible(r.paiement.montantCents)} par ${r.paiement.methode}`
        : montantLisible(r.paiement.montantCents),
    });
    if (r.paiement.rembourseCents > 0) {
      lignes.push({ cle: "Remboursé", valeur: montantLisible(r.paiement.rembourseCents) });
    }
  }
  return lignes;
}

/**
 * Pourquoi il n'y a pas de délai de rétractation, dit une fois pour toutes.
 *
 * Ce n'est pas une clause qu'on s'accorde : c'est une exception légale, et
 * elle ne joue que parce que la prestation est fournie à une date convenue.
 * L'écrire en citant l'article permet au client de vérifier, et à l'exploitant
 * de ne pas avoir à l'inventer au téléphone.
 */
const SANS_RETRACTATION =
  "<strong>Pas de droit de rétractation.</strong> Les activités de loisirs " +
  "fournies à une date déterminée en sont exclues par la loi (Code de droit " +
  "économique, art. VI.53, 12°). L'annulation reste possible aux conditions " +
  "ci-dessous.";

// ── Messages au client ───────────────────────────────────────────────────────

export function auClientReservationEnregistree(r: RecapEmail): Message {
  return composer(
    r.clientEmail,
    `Votre demande de réservation ${r.reference} — ${NOM_COMMERCIAL}`,
    "Nous avons bien reçu votre demande",
    `Bonjour ${ech(r.clientNom)}, votre créneau est retenu. Nous vous recontactons rapidement pour le confirmer et convenir du règlement.`,
    lignesReservation(r),
    [
      "<strong>Ce n'est pas encore une confirmation.</strong> Le créneau vous est réservé en attendant notre appel.",
      SANS_RETRACTATION,
      `<strong>Annulation :</strong> ${ech(RESUME_ANNULATION)}`,
      "Une erreur dans ce récapitulatif ? Répondez simplement à cet e-mail.",
    ],
    EMAIL,
    true
  );
}

/**
 * Confirmation de réservation — le support durable du contrat.
 *
 * Ce message part de deux endroits : le webhook Stripe, quand le paiement est
 * encaissé, et le back-office, quand l'exploitant confirme une réservation
 * réglée autrement. Le paragraphe sur le règlement suit ce que dit la base, pas
 * l'appelant.
 *
 * Il porte l'ensemble de ce que l'article VI.46 § 7 du Code de droit économique
 * exige qu'on confirme : ce qui est vendu, à quelle date, pour quel montant
 * TVAC, qui vend (pied de page), à quelles conditions on annule, et pourquoi il
 * n'y a pas de rétractation.
 */
export function auClientReservationConfirmee(r: RecapEmail): Message {
  const apres: string[] = [];

  if (r.paiement) {
    apres.push(
      `<strong>Paiement reçu.</strong> ${montantLisible(r.paiement.montantCents)} TVAC` +
        `${r.paiement.methode ? ` réglés par ${ech(r.paiement.methode)}` : " réglés"}. ` +
        "Rien ne reste à payer sur place."
    );
  }

  apres.push(
    SANS_RETRACTATION,
    `<strong>Annulation :</strong> ${ech(RESUME_ANNULATION)}` +
      (r.paiement
        ? " Le remboursement éventuel revient sur le moyen de paiement utilisé."
        : ""),
    `Le détail figure dans nos <a href="${urlAbsolue("/cgv")}" style="color:${ACCENT};">conditions générales de vente</a>, que vous avez acceptées en réservant.`,
    "Une question d'ici là ? Répondez simplement à cet e-mail."
  );

  return composer(
    r.clientEmail,
    `Réservation confirmée ${r.reference} — ${NOM_COMMERCIAL}`,
    "Votre réservation est confirmée",
    `Bonjour ${ech(r.clientNom)}, c'est noté : nous vous attendons.`,
    lignesReservation(r),
    apres,
    EMAIL,
    true
  );
}

/**
 * Annulation.
 *
 * CE MESSAGE DOIT PARLER D'ARGENT. Un client qui a payé et qu'on prévient de
 * l'annulation sans un mot sur son remboursement écrit dans l'heure pour
 * demander où passe son argent — et il a raison de le demander. Trois cas, trois
 * phrases différentes, aucune promesse qui ne corresponde à un mouvement réel :
 * le montant annoncé est celui qui a effectivement été renvoyé chez Stripe.
 */
export function auClientReservationAnnulee(r: RecapEmail): Message {
  const apres: string[] = [];

  if (r.paiement) {
    const rendu = r.paiement.rembourseCents;
    if (rendu >= r.paiement.montantCents) {
      apres.push(
        `<strong>Vous êtes remboursé intégralement</strong> : ${montantLisible(rendu)}. ` +
          "Le montant revient sur le moyen de paiement utilisé, sous quelques jours ouvrables selon votre banque."
      );
    } else if (rendu > 0) {
      apres.push(
        `<strong>Remboursement : ${montantLisible(rendu)}</strong> sur les ` +
          `${montantLisible(r.paiement.montantCents)} réglés, en application du barème d'annulation ` +
          "rappelé ci-dessous. Le montant revient sur le moyen de paiement utilisé, sous quelques " +
          "jours ouvrables selon votre banque."
      );
    } else {
      /*
        ON N'INVOQUE PAS LE BARÈME ICI, et c'est délibéré. L'exploitant a pu
        choisir « aucun remboursement » sur une réservation où le barème, lui,
        en prévoyait un — pour un no-show, un litige, ou par erreur. Écrire
        « en application du barème » ferait alors dire à cet e-mail quelque
        chose de faux, sur de l'argent, par écrit. On énonce le fait et on
        ouvre la porte.
      */
      apres.push(
        "<strong>Aucun remboursement n'accompagne cette annulation.</strong> Si vous pensez que " +
          "ce n'est pas justifié, répondez à cet e-mail en nous expliquant votre situation : " +
          "nous la regarderons."
      );
    }
    apres.push(`<strong>Barème d'annulation :</strong> ${ech(RESUME_ANNULATION)}`);
  }

  apres.push(
    `Nous joindre : <a href="mailto:${ech(EMAIL)}" style="color:${ACCENT};">${ech(EMAIL)}</a>.`
  );

  return composer(
    r.clientEmail,
    `Réservation annulée ${r.reference} — ${NOM_COMMERCIAL}`,
    "Votre réservation a été annulée",
    `Bonjour ${ech(r.clientNom)}, la réservation ci-dessous vient d'être annulée. Si ce n'est pas ce que vous attendiez, contactez-nous : nous trouverons une solution.`,
    lignesReservation(r),
    apres,
    EMAIL,
    true
  );
}

/**
 * La demande n'a pas abouti et le créneau est reparti à la vente.
 *
 * POURQUOI CE MESSAGE EXISTE. `auClientReservationEnregistree` écrit « votre
 * créneau est retenu. Nous vous recontactons rapidement ». Si la demande
 * expire, ce courrier reste la dernière chose que le client a lue sur le
 * sujet — et elle est devenue fausse. Sans ce message-ci, personne ne le lui
 * dit : il découvre le jour dit, devant une porte, qu'il n'avait pas de
 * réservation.
 *
 * DEUX LECTEURS TRÈS DIFFÉRENTS, ET ON NE LEUR ÉCRIT PAS LA MÊME CHOSE.
 *
 * Avec paiement en ligne, il a quitté la page Stripe il y a trois quarts
 * d'heure — souvent sans le vouloir : onglet fermé, réseau perdu, application
 * bancaire qui ne s'ouvre pas. Lui dire qu'aucun paiement n'est arrivé décrit
 * exactement ce qui s'est passé.
 *
 * SANS PAIEMENT EN LIGNE, LA MÊME PHRASE EST UNE ACCUSATION FAUSSE. Le tunnel
 * lui a écrit « nous vous recontactons rapidement pour convenir du règlement » :
 * il n'a jamais eu le moyen de payer, et s'il est là c'est que personne ne l'a
 * rappelé. Lui reprocher un défaut de paiement, puis l'envoyer vérifier un
 * débit qui ne peut pas exister, retourne contre lui une négligence qui n'est
 * pas la sienne. D'où `paiementEnLigne` : le fait énoncé change, le ton non.
 *
 * QUAND IL Y A PAIEMENT, ON NE JURE PAS POUR AUTANT QU'AUCUN ARGENT N'A BOUGÉ.
 * Un paiement Bancontact peut se dénouer dans l'application bancaire après
 * l'expiration : celle-ci ne touche jamais une réservation dont le paiement a
 * abouti (migration 0026), mais la fenêtre existe. « Nous n'avons reçu aucun
 * paiement » est un constat vérifiable ; « vous n'avez pas été débité » serait
 * une promesse sur le compte de quelqu'un d'autre. D'où la porte de sortie : si
 * la banque a débité, on régularise. Elle n'a de sens que dans ce cas-là.
 */
export function auClientReservationExpiree(r: {
  reference: string;
  clientNom: string;
  clientEmail: string;
  activite: string;
  jourLabel: string;
  debut: string;
  fin: string;
  /** Le paiement en ligne était-il actif quand la demande a expiré ? */
  paiementEnLigne: boolean;
}): Message {
  const intro = r.paiementEnLigne
    ? `Bonjour ${ech(r.clientNom)}, nous n'avons reçu aucun paiement pour la demande ci-dessous : elle n'a pas été enregistrée, et le créneau est de nouveau proposé à la réservation.`
    : `Bonjour ${ech(r.clientNom)}, nous n'avons pas pu confirmer la demande ci-dessous à temps. Elle n'est donc pas enregistrée, et le créneau est de nouveau proposé à la réservation. Nous en sommes désolés.`;

  const apres: string[] = [
    `<strong>Le créneau vous intéresse toujours ?</strong> Il est à reprendre sur <a href="${ech(urlAbsolue("/reservation"))}" style="color:${ACCENT};">notre page de réservation</a>, s'il n'a pas été pris entre-temps.`,
  ];
  if (r.paiementEnLigne) {
    apres.push(
      "<strong>Votre banque vous a débité ?</strong> Répondez à cet e-mail en indiquant la référence ci-dessus : nous régularisons."
    );
  } else {
    // Il n'a rien pu payer : la seule chose utile est de lui rendre la main
    // sur la date, sans lui faire porter l'attente.
    apres.push(
      "<strong>Vous tenez à cette date ?</strong> Répondez à cet e-mail ou appelez-nous : nous verrons ce qu'il est encore possible de faire."
    );
  }
  apres.push(`Une question : <a href="mailto:${ech(EMAIL)}" style="color:${ACCENT};">${ech(EMAIL)}</a>.`);

  return composer(
    r.clientEmail,
    `Demande ${r.reference} sans suite — ${NOM_COMMERCIAL}`,
    "Votre demande n'a pas abouti",
    intro,
    [
      { cle: "Référence", valeur: r.reference },
      { cle: "Activité", valeur: r.activite },
      { cle: "Date", valeur: r.jourLabel },
      { cle: "Horaire", valeur: `${r.debut} – ${r.fin}` },
    ],
    apres,
    EMAIL
  );
}

/**
 * Remboursement effectué après coup, sans nouvelle annulation.
 *
 * POURQUOI CE MESSAGE EXISTE. Le remboursement n'était possible qu'au moment
 * exact de l'annulation. Si Brahim annulait en cochant « aucun remboursement »
 * puis changeait d'avis — le client rappelle, s'explique, et il accepte —, il
 * ne pouvait plus rien faire depuis son back-office. Ce cas est désormais
 * traité, et il appelle son propre e-mail : le client a déjà reçu un message
 * d'annulation qui lui disait, à l'époque, qu'il ne serait pas remboursé.
 * Lui renvoyer ce même message serait incompréhensible.
 *
 * `montantCents` est la somme DE CE REMBOURSEMENT-CI, pas le cumul : c'est
 * celle que le client verra apparaître sur son relevé.
 */
export function auClientRemboursement(r: RecapEmail, montantCents: number): Message {
  const apres: string[] = [
    `<strong>Remboursement de ${montantLisible(montantCents)}.</strong> Le montant revient sur ` +
      "le moyen de paiement utilisé lors de la réservation, sous quelques jours ouvrables " +
      "selon votre banque.",
  ];

  /*
    On ne dit « sur les N € réglés » que s'il reste effectivement quelque chose :
    sur un remboursement intégral, la précision n'apporte rien et alourdit.
  */
  if (r.paiement && r.paiement.montantCents > montantCents) {
    apres.push(
      `Pour mémoire, la réservation avait été réglée ${montantLisible(r.paiement.montantCents)}.`
    );
  }

  apres.push(
    `Une question sur ce remboursement ? Répondez à cet e-mail, ou écrivez-nous à ` +
      `<a href="mailto:${ech(EMAIL)}" style="color:${ACCENT};">${ech(EMAIL)}</a>.`
  );

  return composer(
    r.clientEmail,
    `Remboursement ${r.reference} — ${NOM_COMMERCIAL}`,
    "Vous avez été remboursé",
    `Bonjour ${ech(r.clientNom)}, nous venons de procéder au remboursement de votre réservation.`,
    lignesReservation(r),
    apres,
    EMAIL,
    true
  );
}

export function auClientDevisRecu(d: DevisEmail): Message {
  return composer(
    d.contactEmail,
    `Votre demande de devis ${d.reference} — ${NOM_COMMERCIAL}`,
    "Nous avons bien reçu votre demande de devis",
    `Bonjour ${ech(d.contactNom)}, merci pour votre intérêt. Nous revenons vers vous sous 48 heures ouvrables avec une proposition.`,
    [
      { cle: "Référence", valeur: d.reference },
      { cle: "Entreprise", valeur: d.entreprise },
      { cle: "Date", valeur: d.dateSouhaitee },
      { cle: "Créneau", valeur: d.periode },
      { cle: "Participants", valeur: String(d.nbParticipants) },
    ],
    [
      /*
        CETTE PHRASE DISAIT L'INVERSE JUSQU'AU 24 SEPTEMBRE 2026 : « Cette
        demande ne bloque pas encore de créneau. » C'était vrai tant que le team
        building n'avait pas de créneaux. Depuis la migration 0036, la demande
        tient sa place dès l'envoi — le dire, c'est aussi ce qui évite à
        l'entreprise de réserver ailleurs « au cas où ».
      */
      /*
        « RÉSERVÉ » SEULEMENT QUAND C'EST VRAI. Un créneau qui tombe dans les
        heures où Sport-Finder loue les mêmes terrains, le site le retient,
        mais ne peut pas garantir qu'il n'y est pas déjà loué. Relevé par la
        relecture du 24 septembre 2026 — la phrase promettait une place que
        le complexe n'avait pas encore vérifiée. (Les après-midis étaient
        concernés ce soir-là ; ils ne le sont plus depuis que le foot ouvre à
        18h, voir `plages-sport-finder.ts`.)
      */
      d.heurteSportFinder
        ? "<strong>Ce créneau est retenu pour vous.</strong> Notre devis vous confirmera la disponibilité du terrain et le prix."
        : "<strong>Ce créneau vous est réservé</strong> le temps d'établir votre devis. Seul le prix reste à convenir.",
    ],
    EMAIL
  );
}

/**
 * Le devis chiffré, envoyé à l'entreprise.
 *
 * C'EST UNE OFFRE, PAS UNE INFORMATION. Elle porte un prix et une date de
 * validité : jusqu'à cette date, l'acceptation du client suffit à former le
 * contrat. D'où trois exigences qui ne sont pas décoratives :
 *
 *   - l'identité complète du vendeur, en pied (art. III.74 du Code de droit
 *     économique) — c'est le `legal` passé à `composer` ;
 *   - la date de validité, écrite en toutes lettres. Un devis sans limite
 *     engage le vendeur indéfiniment sur son prix ;
 *   - le détail ligne par ligne. Un total seul ne permet pas au client de
 *     vérifier ce qu'il achète, ni de discuter un poste.
 *
 * Le lien vers les CGV est là aussi : elles régissent la prestation si l'offre
 * est acceptée.
 */
export function auClientDevisPropose(d: DevisEmail & {
  lignes: LigneDevis[];
  motDIntroduction: string;
  validiteLisible: string;
  tvaPourcent: number | null;
  /** Le devis en PDF, joint au message. */
  pdf?: Uint8Array;
}): Message {
  const lignesTableau: Ligne[] = d.lignes.map((l) => ({
    cle: l.quantite > 1 ? `${l.designation} × ${l.quantite}` : l.designation,
    valeur: montantLisible(totalLigneCents(l)),
  }));
  const m = montantsDevis(d.lignes, d.tvaPourcent);
  if (m.tvaCents === null) {
    lignesTableau.push({ cle: "Total", valeur: montantLisible(m.totalCents) });
  } else {
    lignesTableau.push({ cle: "Total HTVA", valeur: montantLisible(m.baseCents) });
    lignesTableau.push({ cle: `TVA ${d.tvaPourcent} %`, valeur: montantLisible(m.tvaCents) });
    lignesTableau.push({ cle: "Total TVAC", valeur: montantLisible(m.totalCents) });
  }

  const apres: string[] = [];
  if (d.motDIntroduction.trim()) {
    apres.push(ech(d.motDIntroduction.trim()).replace(/\n/g, "<br>"));
  }
  apres.push(
    `<strong>Offre valable jusqu'au ${ech(d.validiteLisible)}.</strong> Passé cette date, les montants sont à reconfirmer.`,
    `Pour l'accepter, répondez simplement à cet e-mail. La prestation est régie par nos <a href="${urlAbsolue("/cgv")}" style="color:${ACCENT};">conditions générales de vente</a>.`,
    "Le devis est également joint en PDF, à transmettre ou à archiver.",
    "Une question, un ajustement ? Répondez à ce message, nous adapterons la proposition."
  );

  const message = composer(
    d.contactEmail,
    `Votre devis ${d.reference} — ${NOM_COMMERCIAL}`,
    "Votre devis",
    `Bonjour ${ech(d.contactNom)}, voici notre proposition pour ${ech(d.entreprise)}.`,
    lignesTableau,
    apres,
    EMAIL,
    true
  );
  return d.pdf
    ? { ...message, piecesJointes: [{ nom: `Devis ${d.reference}.pdf`, contenu: d.pdf }] }
    : message;
}

// ── Avis internes ────────────────────────────────────────────────────────────

/**
 * L'avis interne : ce qui arrive, et ce qu'il reste à faire.
 *
 * IL EXISTE DEUX PARCOURS, ET CET E-MAIL DOIT DIRE LEQUEL.
 *
 *   - SANS paiement en ligne, la réservation est enregistrée « en attente ».
 *     Quelqu'un doit la confirmer, et le back-office affiche un bouton pour
 *     cela. L'avis dit donc « à confirmer », ce qui est vrai.
 *
 *   - AVEC paiement, le client a déjà payé : le webhook a confirmé la
 *     réservation tout seul, et le bouton « Confirmer » n'apparaît même plus
 *     dans le back-office puisqu'il ne s'affiche que sur une réservation en
 *     attente.
 *
 * Envoyer « Nouvelle réservation à confirmer » dans le second cas ferait
 * chercher à l'exploitant un bouton qui n'existe pas, sur une réservation qui
 * n'attend rien de lui. C'est le même défaut que celui trouvé dans le tunnel :
 * la mécanique du paiement avait été branchée sans que les textes suivent.
 *
 * L'état est lu dans `r.paiement`, renseigné par la base — jamais deviné.
 */
export function auComplexeNouvelleReservation(r: RecapEmail): Message {
  const paye = Boolean(r.paiement);

  const apres = [
    paye
      ? `<strong>Rien à faire : le client a payé et sa réservation est confirmée.</strong> ` +
        `<a href="${urlAbsolue("/admin")}" style="color:${ACCENT};font-weight:600;">Ouvrir le back-office</a> pour la consulter ou l'annuler.`
      : `<a href="${urlAbsolue("/admin")}" style="color:${ACCENT};font-weight:600;">Ouvrir le back-office</a> pour confirmer ou annuler.`,
  ];
  if (r.allergieSignalee) {
    // On signale, on ne recopie pas : donnée de santé concernant un mineur.
    apres.unshift(
      "<strong>Une allergie a été signalée.</strong> Le détail est dans le back-office."
    );
  }
  if (r.remarques) apres.push(`Remarque du client : ${ech(r.remarques)}`);

  return composer(
    adresseComplexe(),
    `${paye ? "Réservation payée" : "Nouvelle réservation"} ${r.reference} — ${r.jourLabel} ${r.debut}`,
    paye ? "Réservation payée et confirmée" : "Nouvelle réservation à confirmer",
    `${ech(r.clientNom)} · ${ech(r.clientTelephone)} · ${ech(r.clientEmail)}`,
    lignesReservation(r),
    apres,
    // Répondre à cet avis écrit directement au client.
    r.clientEmail
  );
}

export function auComplexeNouveauDevis(d: DevisEmail): Message {
  return composer(
    adresseComplexe(),
    `Demande de devis ${d.reference} — ${d.entreprise}`,
    "Nouvelle demande de devis",
    `${ech(d.contactNom)} · ${ech(d.contactTelephone)} · ${ech(d.contactEmail)}`,
    [
      { cle: "Référence", valeur: d.reference },
      { cle: "Entreprise", valeur: d.entreprise },
      { cle: "Date souhaitée", valeur: d.dateSouhaitee },
      { cle: "Créneau", valeur: d.periode },
      { cle: "Participants", valeur: String(d.nbParticipants) },
    ],
    [
      d.message ? `Message : ${ech(d.message)}` : "",
      "<strong>Les terrains sont bloqués sur le site</strong> pour cette entreprise jusqu'à ce que vous refusiez la demande.",
      d.heurteSportFinder
        ? "<strong>Cet horaire est aussi vendu sur Sport-Finder.</strong> Fermez cette plage là-bas DÈS MAINTENANT — " +
          "ou, si elle y est déjà louée, refusez la demande."
        : "",
      `<a href="${urlAbsolue("/admin/devis")}" style="color:${ACCENT};font-weight:600;">Ouvrir le back-office</a>.`,
    ].filter(Boolean),
    d.contactEmail
  );
}

// ── Vérification ─────────────────────────────────────────────────────────────

/**
 * Message de test, envoyé depuis le back-office.
 *
 * Il emprunte exactement le même chemin qu'un vrai e-mail — même expéditeur,
 * même gabarit, même fournisseur — pour que le réussir prouve quelque chose.
 */
export function emailDeTest(destinataire: string, acteur: string): Message {
  return composer(
    destinataire,
    `Test d'envoi — ${NOM_COMMERCIAL}`,
    "L'envoi d'e-mails fonctionne",
    "Ce message a été déclenché depuis le back-office. S'il est arrivé, la chaîne complète est en place.",
    [
      { cle: "Déclenché par", valeur: acteur },
      { cle: "Expéditeur", valeur: process.env.EMAIL_EXPEDITEUR ?? "—" },
    ],
    [
      "S'il est arrivé dans les indésirables, ouvrez ses en-têtes complets et vérifiez que <code>spf</code>, <code>dkim</code> et <code>dmarc</code> affichent tous <code>pass</code>.",
      "Aucune réservation n'a été créée par ce test.",
    ],
    EMAIL
  );
}

/**
 * Avis de CONTESTATION bancaire.
 *
 * Le client a contesté le débit auprès de sa banque. Stripe retire aussitôt la
 * somme du solde, y ajoute des frais, et laisse quelques jours pour fournir des
 * preuves — passé ce délai, la contestation est perdue par défaut.
 *
 * Rien n'écoutait cet événement : l'exploitant l'apprenait en consultant Stripe,
 * ou ne l'apprenait pas. C'est pourtant le seul message de tout le système qui
 * ait une date limite.
 *
 * On n'y met AUCUNE donnée du client. Le back-office et Stripe portent déjà le
 * détail ; un avis d'incident n'a pas à le recopier dans une boîte mail.
 */
/**
 * Avis interne : de l'argent a été encaissé sur une réservation qui n'existe
 * plus.
 *
 * LE CAS EST RARE ET IL FAUT DONC LE DIRE FORT. Le paiement aboutit après que
 * la réservation a expiré — un Bancontact dénoué tard, une session payée au
 * dernier moment — ou après une annulation depuis le back-office. Le créneau,
 * lui, est déjà retourné à la vente et peut avoir été racheté.
 *
 * Personne n'était prévenu. La seule trace était une ligne de paiement
 * « réussie » sans réservation confirmée, qu'il fallait remarquer au
 * back-office. Le client, lui, était débité sans rien recevoir.
 *
 * On ne rembourse pas automatiquement : selon que le créneau a été repris ou
 * non, l'exploitant voudra rendre l'argent OU confirmer la réservation à la
 * main. Décider à sa place serait pire que de le prévenir.
 */
export function auComplexePaiementSansReservation(p: {
  reference: string | null;
  montantCents: number;
  statut: string | null;
}): Message {
  return composer(
    adresseComplexe(),
    `Paiement encaissé sans réservation — ${montantLisible(p.montantCents)}`,
    "Un client a payé un créneau qui n'était plus à lui",
    "Le créneau était déjà libéré au moment où le paiement a abouti.",
    [
      { cle: "Référence", valeur: p.reference ?? "inconnue" },
      { cle: "Montant encaissé", valeur: montantLisible(p.montantCents) },
      { cle: "État de la réservation", valeur: p.statut ?? "inconnu" },
    ],
    [
      "<strong>Rien n'a été décidé automatiquement.</strong> Deux issues selon le cas.",
      "Si le créneau est encore libre : confirmez la réservation depuis le back-office, le client est en règle.",
      "S'il a été repris par quelqu'un d'autre : remboursez depuis Stripe et prévenez le client — il a payé et n'a pas de place.",
    ]
  );
}

export function auComplexeContestation(c: {
  montantCents: number;
  motif: string;
  /** Horodatage Unix de la date limite de réponse, si Stripe l'a fourni. */
  echeance: number | null;
  /**
   * La réservation contestée, quand on a pu la retrouver.
   *
   * L'avis annonçait un montant, un motif et une date limite — sans jamais
   * dire DE QUI il s'agissait. Pour répondre à une contestation il faut
   * produire des preuves : le nom du client, la date de l'activité, l'e-mail
   * de confirmation qu'il a reçu. Sans la référence, il fallait retrouver la
   * réservation à partir d'un montant, et deux anniversaires du même samedi au
   * même tarif sont indiscernables.
   *
   * `null` si le paiement n'a pas de ligne en base — auquel cas la phrase
   * s'adapte plutôt que d'afficher un trou.
   */
  reference?: string | null;
}): Message {
  const limite =
    typeof c.echeance === "number"
      ? jourLisibleCap(new Date(c.echeance * 1000))
      : null;

  const lignes: Ligne[] = [
    { cle: "Montant contesté", valeur: montantLisible(c.montantCents) },
    { cle: "Motif indiqué", valeur: c.motif },
    { cle: "Date limite de réponse", valeur: limite ?? "voir Stripe" },
  ];
  // En tête de liste : c'est par là qu'on commence à chercher.
  if (c.reference) lignes.unshift({ cle: "Réservation", valeur: c.reference });

  return composer(
    adresseComplexe(),
    c.reference
      ? `Contestation bancaire ${c.reference} — ${montantLisible(c.montantCents)}`
      : `Contestation bancaire — ${montantLisible(c.montantCents)}`,
    "Un paiement est contesté",
    limite
      ? `À traiter avant le ${limite}, sans quoi la contestation est perdue.`
      : "À traiter rapidement : la réponse est soumise à un délai.",
    lignes,
    [
      "La somme a déjà été retirée de votre solde Stripe, et des frais de dossier s'y ajoutent.",
      c.reference
        ? `Ouvrez la fiche ${ech(c.reference)} dans le back-office : le nom du client, la date de l'activité et l'e-mail de confirmation qu'il a reçu sont les preuves à fournir.`
        : "Le paiement n'a pas pu être rattaché à une réservation. Cherchez-le dans Stripe par son montant et l'adresse du client.",
      "Répondez depuis votre tableau de bord Stripe, rubrique « Litiges » : ce sont les preuves fournies là-bas qui tranchent, pas ce message.",
      "Sans réponse avant la date limite, la contestation est perdue automatiquement.",
    ]
  );
}
