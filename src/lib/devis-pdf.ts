import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  montantsDevis,
  totalLigneCents,
  type LigneDevis,
} from "@/lib/devis";
import { montantLisible } from "@/lib/tarification";
import {
  ADRESSE_LIGNE,
  BCE,
  DENOMINATION_SOCIALE,
  EMAIL,
  NOM_COMMERCIAL,
  TVA,
} from "@/data/entreprise";

/**
 * Le devis en PDF.
 *
 * POURQUOI UN PDF EN PLUS DE L'E-MAIL. L'e-mail se lit, le PDF se transmet.
 * Une société qui reçoit une offre la fait circuler — au responsable, à la
 * comptabilité, parfois à un comité — et ce qui circule est une pièce jointe,
 * pas un fil de messages. C'est aussi ce qu'on archive, et ce qu'on ressort le
 * jour où le prix est discuté.
 *
 * POURQUOI `pdf-lib` ET NON UN NAVIGATEUR SANS TÊTE. Générer un PDF en
 * imprimant une page HTML demanderait Chromium dans une fonction serverless :
 * des centaines de mégaoctets, un démarrage à froid de plusieurs secondes, et
 * une dépendance qui casse à chaque montée de version. `pdf-lib` est du
 * JavaScript pur, sans binaire, et produit ici un document d'une page.
 *
 * LE PIÈGE DES POLICES STANDARD, vérifié avant d'écrire ce fichier. Les polices
 * intégrées au format PDF encodent en WinAnsi. Les accents français passent,
 * le symbole € aussi, les guillemets « » et le tiret cadratin également — je
 * l'ai testé. Mais tout caractère hors de ce jeu fait LEVER UNE EXCEPTION à
 * `drawText`, et non un carré vide : un emoji collé dans une désignation ferait
 * échouer la génération, donc l'envoi du devis. D'où `winAnsi()` plus bas, qui
 * remplace l'irreprésentable au lieu de laisser exploser.
 */

const MARGE = 50;
const LARGEUR = 595; // A4 en points
const HAUTEUR = 842;

const ENCRE = rgb(0.1, 0.1, 0.11);
const GRIS = rgb(0.42, 0.42, 0.44);
const TRAIT = rgb(0.85, 0.85, 0.84);
const ACCENT = rgb(0.71, 0.49, 0.07);

/**
 * Rend un texte représentable par les polices standard du PDF.
 *
 * Ce n'est pas de la cosmétique : sans ce filtre, un seul caractère exotique
 * dans une désignation saisie à la main — un emoji, une puce, un espace fine
 * insécable venu d'un copier-coller — ferait échouer la génération du document
 * et, avec elle, l'envoi du devis. On remplace ce qu'on sait remplacer, et on
 * écarte le reste.
 */
function winAnsi(v: string): string {
  const remplacements: [RegExp, string][] = [
    [/[‘’‛]/g, "'"],
    [/[“”]/g, '"'],
    [/[–]/g, "-"],
    [/[…]/g, "..."],
    [/[   ]/g, " "],
    [/[•]/g, "-"],
    [/[Œ]/g, "OE"],
    [/[œ]/g, "oe"],
  ];
  let t = v;
  for (const [motif, par] of remplacements) t = t.replace(motif, par);
  // Ce qui reste hors de Latin-1 étendu + les quelques signes que WinAnsi
  // ajoute (€, œ, tiret cadratin) est retiré plutôt que de faire échouer tout
  // le document.
  return t.replace(/[^\x20-\x7E -ÿ€—]/g, "");
}

/** Coupe un texte pour qu'il tienne dans une largeur donnée. */
function tronquer(texte: string, police: PDFFont, taille: number, largeur: number): string {
  let t = texte;
  while (t.length > 1 && police.widthOfTextAtSize(t, taille) > largeur) {
    t = t.slice(0, -1);
  }
  return t === texte ? t : `${t.slice(0, -1)}…`.replace("…", "...");
}

interface Ecrivain {
  page: PDFPage;
  normale: PDFFont;
  grasse: PDFFont;
}

function texte(
  e: Ecrivain,
  v: string,
  x: number,
  y: number,
  opts: { taille?: number; gras?: boolean; couleur?: typeof ENCRE; droite?: number } = {}
) {
  const taille = opts.taille ?? 10;
  const police = opts.gras ? e.grasse : e.normale;
  const propre = winAnsi(v);
  const largeurTexte = police.widthOfTextAtSize(propre, taille);
  e.page.drawText(propre, {
    x: opts.droite !== undefined ? opts.droite - largeurTexte : x,
    y,
    size: taille,
    font: police,
    color: opts.couleur ?? ENCRE,
  });
}

export interface DevisPourPdf {
  reference: string;
  emisLe: string;
  validiteLisible: string;
  client: {
    entreprise: string;
    contactNom: string;
    contactEmail: string;
    adresse: string;
    tva: string;
  };
  lignes: LigneDevis[];
  tvaPourcent: number | null;
  motDIntroduction: string;
}

export async function genererDevisPdf(d: DevisPourPdf): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Devis ${d.reference} — ${NOM_COMMERCIAL}`);
  doc.setProducer(NOM_COMMERCIAL);
  const page = doc.addPage([LARGEUR, HAUTEUR]);
  const e: Ecrivain = {
    page,
    normale: await doc.embedFont(StandardFonts.Helvetica),
    grasse: await doc.embedFont(StandardFonts.HelveticaBold),
  };

  const droite = LARGEUR - MARGE;
  let y = HAUTEUR - MARGE;

  // ── Le vendeur, en tête ──────────────────────────────────────────────────
  texte(e, NOM_COMMERCIAL.toUpperCase(), MARGE, y, { taille: 9, gras: true, couleur: ACCENT });
  y -= 16;
  texte(e, "DEVIS", MARGE, y, { taille: 22, gras: true });
  texte(e, d.reference, droite, y, { taille: 11, gras: true, droite });
  y -= 14;
  texte(e, `Émis le ${d.emisLe}`, droite, y, { taille: 9, couleur: GRIS, droite });

  y -= 22;
  /*
    L'identité du vendeur. Les champs encore inconnus sont OMIS, comme dans le
    pied des e-mails : un client ne doit pas recevoir un document portant
    « [à compléter] ». Ils apparaîtront d'eux-mêmes quand `data/entreprise.ts`
    les portera.
  */
  const vendeur = [
    DENOMINATION_SOCIALE && DENOMINATION_SOCIALE !== NOM_COMMERCIAL
      ? `${DENOMINATION_SOCIALE} (${NOM_COMMERCIAL})`
      : NOM_COMMERCIAL,
    ADRESSE_LIGNE,
    BCE ? `N° d'entreprise : ${BCE}` : "",
    TVA ? `TVA : BE ${TVA}` : "",
    EMAIL,
  ].filter(Boolean);
  for (const ligne of vendeur) {
    texte(e, ligne, MARGE, y, { taille: 9, couleur: GRIS });
    y -= 12;
  }

  // ── Le client ────────────────────────────────────────────────────────────
  y -= 14;
  texte(e, "DESTINATAIRE", MARGE, y, { taille: 8, gras: true, couleur: GRIS });
  y -= 14;
  const client = [
    d.client.entreprise,
    d.client.adresse,
    d.client.tva ? `TVA : ${d.client.tva}` : "",
    `${d.client.contactNom} — ${d.client.contactEmail}`,
  ].filter(Boolean);
  for (const ligne of client) {
    texte(e, ligne, MARGE, y, { taille: 10 });
    y -= 13;
  }

  // ── Le tableau ───────────────────────────────────────────────────────────
  y -= 18;
  const xQte = 360;
  const xPu = 440;
  const xTotal = droite;

  page.drawLine({ start: { x: MARGE, y }, end: { x: droite, y }, thickness: 1, color: TRAIT });
  y -= 14;
  texte(e, "Désignation", MARGE, y, { taille: 8, gras: true, couleur: GRIS });
  texte(e, "Qté", xQte, y, { taille: 8, gras: true, couleur: GRIS, droite: xQte });
  texte(e, "P.U.", xPu, y, { taille: 8, gras: true, couleur: GRIS, droite: xPu });
  texte(e, "Total", xTotal, y, { taille: 8, gras: true, couleur: GRIS, droite: xTotal });
  y -= 8;
  page.drawLine({ start: { x: MARGE, y }, end: { x: droite, y }, thickness: 0.5, color: TRAIT });

  for (const l of d.lignes) {
    y -= 18;
    texte(e, tronquer(winAnsi(l.designation), e.normale, 10, 290), MARGE, y, { taille: 10 });
    texte(e, String(l.quantite), xQte, y, { taille: 10, droite: xQte });
    texte(e, montantLisible(l.prixUnitaireCents), xPu, y, { taille: 10, droite: xPu });
    texte(e, montantLisible(totalLigneCents(l)), xTotal, y, { taille: 10, droite: xTotal });
  }

  y -= 12;
  page.drawLine({ start: { x: MARGE, y }, end: { x: droite, y }, thickness: 0.5, color: TRAIT });

  // ── Les totaux ───────────────────────────────────────────────────────────
  const m = montantsDevis(d.lignes, d.tvaPourcent);
  if (m.tvaCents === null) {
    /*
      Aucun taux renseigné : on n'invente pas de ventilation. Le total est
      donné tel quel, et la mention dit franchement ce qu'on ne sait pas
      plutôt que d'afficher une base HTVA reconstituée au hasard.
    */
    y -= 20;
    texte(e, "Total", xPu, y, { taille: 12, gras: true, droite: xPu });
    texte(e, montantLisible(m.totalCents), xTotal, y, { taille: 12, gras: true, droite: xTotal });
    y -= 14;
    texte(e, "TVA non renseignée sur ce devis.", xTotal, y, {
      taille: 8,
      couleur: GRIS,
      droite: xTotal,
    });
  } else {
    y -= 18;
    texte(e, "Total HTVA", xPu, y, { taille: 10, couleur: GRIS, droite: xPu });
    texte(e, montantLisible(m.baseCents), xTotal, y, { taille: 10, droite: xTotal });
    y -= 14;
    texte(e, `TVA ${d.tvaPourcent} %`, xPu, y, { taille: 10, couleur: GRIS, droite: xPu });
    texte(e, montantLisible(m.tvaCents), xTotal, y, { taille: 10, droite: xTotal });
    y -= 18;
    texte(e, "Total TVAC", xPu, y, { taille: 12, gras: true, droite: xPu });
    texte(e, montantLisible(m.totalCents), xTotal, y, { taille: 12, gras: true, droite: xTotal });
  }

  // ── Mot d'introduction ───────────────────────────────────────────────────
  if (d.motDIntroduction.trim()) {
    y -= 34;
    for (const ligne of decouper(winAnsi(d.motDIntroduction.trim()), e.normale, 10, droite - MARGE)) {
      texte(e, ligne, MARGE, y, { taille: 10, couleur: GRIS });
      y -= 13;
    }
  }

  // ── Conditions, en pied ──────────────────────────────────────────────────
  let bas = MARGE + 58;
  page.drawLine({
    start: { x: MARGE, y: bas + 14 },
    end: { x: droite, y: bas + 14 },
    thickness: 0.5,
    color: TRAIT,
  });
  texte(e, `Offre valable jusqu'au ${d.validiteLisible}.`, MARGE, bas, { taille: 9, gras: true });
  bas -= 12;
  texte(
    e,
    "Passé cette date, les montants sont à reconfirmer. Pour accepter cette offre, il suffit de",
    MARGE,
    bas,
    { taille: 8, couleur: GRIS }
  );
  bas -= 11;
  texte(e, `répondre à ${EMAIL}. La prestation est régie par nos conditions générales de vente.`, MARGE, bas, {
    taille: 8,
    couleur: GRIS,
  });

  return doc.save();
}

/** Découpe un paragraphe en lignes qui tiennent dans la largeur donnée. */
function decouper(v: string, police: PDFFont, taille: number, largeur: number): string[] {
  const mots = v.split(/\s+/);
  const lignes: string[] = [];
  let courante = "";
  for (const mot of mots) {
    const essai = courante ? `${courante} ${mot}` : mot;
    if (police.widthOfTextAtSize(essai, taille) > largeur && courante) {
      lignes.push(courante);
      courante = mot;
    } else {
      courante = essai;
    }
  }
  if (courante) lignes.push(courante);
  // Un mot d'introduction n'est pas un roman : au-delà, on coupe.
  return lignes.slice(0, 6);
}
