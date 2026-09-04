import "server-only";
import type { Message } from "@/lib/email/envoi";
import { adresseComplexe } from "@/lib/email/envoi";
import { urlAbsolue } from "@/lib/site";
import { ADRESSE_LIGNE, EMAIL, NOM_COMMERCIAL, TELEPHONE } from "@/data/entreprise";
import { RESUME_ANNULATION } from "@/data/reglement";

/**
 * Messages transactionnels.
 *
 * TROIS PARTIS PRIS
 *
 * 1. RIEN N'EST INVENTÉ. Ces e-mails ne promettent que ce que le complexe
 *    tient réellement : une demande est enregistrée, quelqu'un rappelle. Pas de
 *    consigne d'arrivée, pas de QR code, pas de « paiement reçu ».
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

function enveloppe(titre: string, intro: string, lignes: Ligne[], apres: string[]): string {
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
        ${ech(NOM_COMMERCIAL)} — ${ech(ADRESSE_LIGNE)}<br>
        ${ech(TELEPHONE)} · <a href="mailto:${ech(EMAIL)}" style="color:${ACCENT};">${ech(EMAIL)}</a>
      </p>
    </td></tr>
  </table>
</body></html>`;
}

function versTexte(titre: string, intro: string, lignes: Ligne[], apres: string[]): string {
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
    `${NOM_COMMERCIAL} — ${ADRESSE_LIGNE}`,
    `${TELEPHONE} · ${EMAIL}`,
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
  repondreA?: string
): Message {
  return {
    destinataire,
    sujet,
    texte: versTexte(titre, intro, lignes, apres),
    html: enveloppe(titre, intro, lignes, apres),
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
  /** en euros */
  total: number;
  clientNom: string;
  clientEmail: string;
  clientTelephone: string;
  detail?: string | null;
  options?: string[];
  /** Vrai si une allergie a été renseignée. Le contenu reste au back-office. */
  allergieSignalee?: boolean;
  remarques?: string | null;
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
  lignes.push({ cle: "Montant", valeur: `${r.total} €` });
  return lignes;
}

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
      `<strong>Annulation :</strong> ${ech(RESUME_ANNULATION)}`,
      "Une erreur dans ce récapitulatif ? Répondez simplement à cet e-mail.",
    ],
    EMAIL
  );
}

export function auClientReservationConfirmee(r: RecapEmail): Message {
  return composer(
    r.clientEmail,
    `Réservation confirmée ${r.reference} — ${NOM_COMMERCIAL}`,
    "Votre réservation est confirmée",
    `Bonjour ${ech(r.clientNom)}, c'est noté : nous vous attendons.`,
    lignesReservation(r),
    [
      `<strong>Annulation :</strong> ${ech(RESUME_ANNULATION)}`,
      `Une question d'ici là ? Appelez-nous au ${ech(TELEPHONE)} ou répondez à cet e-mail.`,
    ],
    EMAIL
  );
}

export function auClientReservationAnnulee(r: RecapEmail): Message {
  return composer(
    r.clientEmail,
    `Réservation annulée ${r.reference} — ${NOM_COMMERCIAL}`,
    "Votre réservation a été annulée",
    `Bonjour ${ech(r.clientNom)}, la réservation ci-dessous vient d'être annulée. Si ce n'est pas ce que vous attendiez, contactez-nous : nous trouverons une solution.`,
    lignesReservation(r),
    [
      `Nous joindre : ${ech(TELEPHONE)} ou <a href="mailto:${ech(EMAIL)}" style="color:${ACCENT};">${ech(EMAIL)}</a>.`,
    ],
    EMAIL
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
