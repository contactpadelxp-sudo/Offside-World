import "server-only";
import fs from "node:fs";
import path from "node:path";
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
  FORME_JURIDIQUE,
  NOM_COMMERCIAL,
  RPM_TRIBUNAL,
  SIEGE_SOCIAL,
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
const FOND_LOGO = rgb(0.055, 0.055, 0.065);
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

  /*
    ── LE LOGO, DANS UN BANDEAU SOMBRE ──

    Le logo est un PNG transparent dont 40 % des pixels sont quasi blancs —
    mesuré : l'« OFF » et le ballon. Posé tel quel sur une page blanche, cette
    part DISPARAÎT, et il ne resterait que le « SIDE » jaune.

    Deux façons de s'en sortir : fabriquer une variante sombre du logo, ou lui
    donner un fond. La variante serait un fichier dérivé de plus, qui
    divergerait le jour où le logo change sans que personne y pense. Le
    bandeau, lui, n'a rien à maintenir — et il reprend le fond du site, donc il
    a l'air voulu plutôt que subi.
  */
  const logo = await chargerLogo(doc);
  const HAUT_BANDEAU = 46;
  if (logo) {
    const largeurLogo = Math.min(150, (logo.width / logo.height) * (HAUT_BANDEAU - 18));
    const hauteurLogo = largeurLogo * (logo.height / logo.width);
    page.drawRectangle({
      x: MARGE,
      y: y - HAUT_BANDEAU,
      width: largeurLogo + 24,
      height: HAUT_BANDEAU,
      color: FOND_LOGO,
    });
    page.drawImage(logo, {
      x: MARGE + 12,
      y: y - HAUT_BANDEAU + (HAUT_BANDEAU - hauteurLogo) / 2,
      width: largeurLogo,
      height: hauteurLogo,
    });
  } else {
    texte(e, NOM_COMMERCIAL.toUpperCase(), MARGE, y - 20, { taille: 12, gras: true, couleur: ACCENT });
  }

  // La référence et la date s'alignent à droite, à hauteur du bandeau.
  texte(e, d.reference, droite, y - 16, { taille: 11, gras: true, droite });
  texte(e, `Émis le ${d.emisLe}`, droite, y - 30, { taille: 9, couleur: GRIS, droite });

  // « DEVIS » vient SOUS le bandeau : l'écart garantit qu'ils ne se
  // superposent jamais, quelle que soit la taille du logo déposé.
  y -= HAUT_BANDEAU + 26;
  texte(e, "DEVIS", MARGE, y, { taille: 22, gras: true });

  y -= 20;
  /*
    L'identité du vendeur. Les champs encore inconnus sont OMIS, comme dans le
    pied des e-mails : un client ne doit pas recevoir un document portant
    « [à compléter] ». Ils apparaîtront d'eux-mêmes quand `data/entreprise.ts`
    les portera.
  */
  const raisonSociale = [DENOMINATION_SOCIALE, FORME_JURIDIQUE].filter(Boolean).join(" ");
  const vendeur = [
    raisonSociale
      ? `${raisonSociale}${raisonSociale !== NOM_COMMERCIAL ? ` — ${NOM_COMMERCIAL}` : ""}`
      : NOM_COMMERCIAL,
    SIEGE_SOCIAL ? `Siège social : ${SIEGE_SOCIAL}` : "",
    SIEGE_SOCIAL ? `Exploitation : ${ADRESSE_LIGNE}` : ADRESSE_LIGNE,
    BCE ? `N° d'entreprise : ${BCE}` : "",
    TVA ? `TVA : BE ${TVA}` : "",
    RPM_TRIBUNAL ? `RPM ${RPM_TRIBUNAL}` : "",
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

  /*
    ── PIED DE PAGE : CE QUI ENGAGE, ET CE QUI L'ENCADRE ──

    Un devis n'est pas une facture, mais il reste un document émanant d'une
    société : l'article 2:20 du Code des sociétés et des associations impose
    qu'il porte la dénomination, la forme légale, le siège, le numéro
    d'entreprise et la mention « RPM » suivie du tribunal compétent. Les trois
    premiers et le numéro figurent en tête ; ce qui manque encore est simplement
    absent plutôt qu'inventé.

    Le BLOC D'ACCEPTATION n'est imposé par aucun texte, mais c'est lui qui
    transforme le document en offre exploitable : daté et signé, il matérialise
    l'accord, et évite la discussion sur ce qui a été accepté et quand.
  */
  const X_ACCORD = 330;
  const LARGEUR_PIED = X_ACCORD - MARGE - 20; // 20 pt de gouttière

  let bas = MARGE + 96;
  page.drawLine({
    start: { x: MARGE, y: bas + 16 },
    end: { x: droite, y: bas + 16 },
    thickness: 0.5,
    color: TRAIT,
  });

  texte(e, `Offre valable jusqu'au ${d.validiteLisible}.`, MARGE, bas, { taille: 9, gras: true });
  bas -= 13;

  /*
    LA LARGEUR EST BORNÉE, PAS ESPÉRÉE. Une première version écrivait ce
    paragraphe sur toute la page : il passait sous le bloc « Bon pour accord »
    posé à droite, et les deux textes se chevauchaient. On découpe donc sur la
    largeur réellement disponible — l'espace jusqu'au bloc, moins une
    gouttière — ce qui rend le chevauchement impossible plutôt qu'improbable.
  */
  const conditions =
    "Passé cette date, les montants sont à reconfirmer. Ce devis est gratuit et ne vous engage à rien. "
    + `La prestation est régie par nos conditions générales de vente, sur ${urlDevis()}/cgv ou sur demande.`;
  for (const ligne of decouper(winAnsi(conditions), e.normale, 7.5, LARGEUR_PIED)) {
    texte(e, ligne, MARGE, bas, { taille: 7.5, couleur: GRIS });
    bas -= 10;
  }

  // ── Bloc d'acceptation, à droite ────────────────────────────────────────
  let yAccord = MARGE + 96;
  texte(e, "Bon pour accord", X_ACCORD, yAccord, { taille: 9, gras: true });
  yAccord -= 20;
  texte(e, "Date", X_ACCORD, yAccord, { taille: 8, couleur: GRIS });
  page.drawLine({
    start: { x: X_ACCORD + 30, y: yAccord - 3 },
    end: { x: droite, y: yAccord - 3 },
    thickness: 0.5,
    color: TRAIT,
  });
  yAccord -= 26;
  texte(e, "Nom et signature", X_ACCORD, yAccord, { taille: 8, couleur: GRIS });
  page.drawLine({
    start: { x: X_ACCORD, y: yAccord - 18 },
    end: { x: droite, y: yAccord - 18 },
    thickness: 0.5,
    color: TRAIT,
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
  return lignes.slice(0, 8);
}

/** L'adresse publique du site, pour renvoyer aux conditions générales. */
function urlDevis(): string {
  return (process.env.SITE_URL || "https://offsidefootindoor.be").replace(/\/+$/, "");
}

/**
 * Charge le logo depuis `public/images`, s'il existe.
 *
 * Même tolérance de nommage que le reste du site : n'importe quel fichier
 * contenant « logo ». Un échec ne fait pas échouer le devis — l'en-tête
 * retombe sur le lettrage texte, et un document sans logo reste un document
 * valable.
 */
async function chargerLogo(doc: PDFDocument) {
  try {
    const dir = path.join(process.cwd(), "public", "images");
    const fichier = fs
      .readdirSync(dir)
      .filter((n) => /logo/i.test(n) && /\.png$/i.test(n))
      .sort()[0];
    if (!fichier) return null;
    return await doc.embedPng(fs.readFileSync(path.join(dir, fichier)));
  } catch {
    return null;
  }
}
