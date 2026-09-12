import "server-only";
import type { Message } from "@/lib/email/envoi";
import { adresseComplexe } from "@/lib/email/envoi";
import { urlAbsolue } from "@/lib/site";
import {
  ADRESSE_LIGNE,
  BCE,
  DENOMINATION_SOCIALE,
  EMAIL,
  NOM_COMMERCIAL,
  TVA,
} from "@/data/entreprise";
import { RESUME_ANNULATION } from "@/data/reglement";
import { montantLisible } from "@/lib/tarification";
import { totalDevisCents, totalLigneCents, type LigneDevis } from "@/lib/devis";

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
    DENOMINATION_SOCIALE && DENOMINATION_SOCIALE !== NOM_COMMERCIAL
      ? `${DENOMINATION_SOCIALE} (${NOM_COMMERCIAL})`
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

export function auClientDevisRecu(d: DevisEmail): Message {
  return composer(
    d.contactEmail,
    `Votre demande de devis ${d.reference} — ${NOM_COMMERCIAL}`,
    "Nous avons bien reçu votre demande de devis",
    `Bonjour ${ech(d.contactNom)}, merci pour votre intérêt. Nous revenons vers vous sous 48 heures ouvrables avec une proposition.`,
    [
      { cle: "Référence", valeur: d.reference },
      { cle: "Entreprise", valeur: d.entreprise },
      { cle: "Date souhaitée", valeur: d.dateSouhaitee },
      { cle: "Demi-journée", valeur: d.periode },
      { cle: "Participants", valeur: String(d.nbParticipants) },
    ],
    [
      "<strong>Cette demande ne bloque pas encore de créneau.</strong> La date sera arrêtée avec vous au moment du devis.",
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
}): Message {
  const lignesTableau: Ligne[] = d.lignes.map((l) => ({
    cle: l.quantite > 1 ? `${l.designation} × ${l.quantite}` : l.designation,
    valeur: montantLisible(totalLigneCents(l)),
  }));
  lignesTableau.push({ cle: "Total TVAC", valeur: montantLisible(totalDevisCents(d.lignes)) });

  const apres: string[] = [];
  if (d.motDIntroduction.trim()) {
    apres.push(ech(d.motDIntroduction.trim()).replace(/\n/g, "<br>"));
  }
  apres.push(
    `<strong>Offre valable jusqu'au ${ech(d.validiteLisible)}.</strong> Passé cette date, les montants sont à reconfirmer.`,
    `Pour l'accepter, répondez simplement à cet e-mail. La prestation est régie par nos <a href="${urlAbsolue("/cgv")}" style="color:${ACCENT};">conditions générales de vente</a>.`,
    "Une question, un ajustement ? Répondez à ce message, nous adapterons la proposition."
  );

  return composer(
    d.contactEmail,
    `Votre devis ${d.reference} — ${NOM_COMMERCIAL}`,
    "Votre devis",
    `Bonjour ${ech(d.contactNom)}, voici notre proposition pour ${ech(d.entreprise)}.`,
    lignesTableau,
    apres,
    EMAIL,
    true
  );
}

// ── Avis internes ────────────────────────────────────────────────────────────

export function auComplexeNouvelleReservation(r: RecapEmail): Message {
  const apres = [
    `<a href="${urlAbsolue("/admin")}" style="color:${ACCENT};font-weight:600;">Ouvrir le back-office</a> pour confirmer ou annuler.`,
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
    `Nouvelle réservation ${r.reference} — ${r.jourLabel} ${r.debut}`,
    "Nouvelle réservation à confirmer",
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
      { cle: "Demi-journée", valeur: d.periode },
      { cle: "Participants", valeur: String(d.nbParticipants) },
    ],
    [
      d.message ? `Message : ${ech(d.message)}` : "",
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
