import { isValidPhoneNumber } from "libphonenumber-js";
import { isValidEmail } from "@/lib/validation";

/**
 * Lecture bornée des données envoyées par le navigateur.
 *
 * Une Server Action est un point d'entrée public : n'importe qui peut la
 * rappeler avec le corps de son choix, sans passer par le formulaire. Tout ce
 * qui arrive ici est donc traité comme hostile, et chaque champ est borné :
 *
 *   - longueur maximale AVANT toute expression régulière (pas de ReDoS, pas de
 *     champ « remarques » de 10 Mo qui gonfle la base) ;
 *   - caractères de contrôle retirés, y compris les séparateurs de ligne
 *     Unicode, pour qu'aucune saisie ne puisse casser un e-mail ou un export ;
 *   - entiers vérifiés comme entiers, dans un intervalle explicite ;
 *   - listes plafonnées en nombre d'éléments.
 *
 * Les mêmes contrôles côté navigateur sont du confort d'usage. Ceux-ci sont la
 * sécurité.
 */

export class SaisieInvalide extends Error {
  constructor(
    readonly champ: string,
    message: string
  ) {
    super(message);
    this.name = "SaisieInvalide";
  }
}

/** Au-delà, on ne lit même pas : c'est un abus, pas une faute de frappe. */
const PLAFOND_ABSOLU = 20_000;

/**
 * Caractères de contrôle et séparateurs de ligne Unicode.
 * Construits par `new RegExp` pour que le fichier source ne contienne
 * lui-même aucun caractère invisible.
 */
const CONTROLE = new RegExp("[\\u0000-\\u001F\\u007F\\u2028\\u2029]", "g");
/** Idem, mais le saut de ligne (U+000A) est conservé. */
const CONTROLE_SAUF_SAUT = new RegExp("[\\u0000-\\u0009\\u000B-\\u001F\\u007F\\u2028\\u2029]", "g");

function assainir(v: string, autoriserSauts: boolean): string {
  return v.replace(autoriserSauts ? CONTROLE_SAUF_SAUT : CONTROLE, "").trim();
}

function brut(v: unknown, champ: string): string {
  if (typeof v !== "string") throw new SaisieInvalide(champ, `${champ} : texte attendu.`);
  if (v.length > PLAFOND_ABSOLU) throw new SaisieInvalide(champ, `${champ} : saisie trop longue.`);
  return v;
}

export function texte(
  v: unknown,
  champ: string,
  { min = 1, max = 200, sauts = false }: { min?: number; max?: number; sauts?: boolean } = {}
): string {
  const s = assainir(brut(v, champ), sauts);
  if (min > 0 && s.length < min) {
    throw new SaisieInvalide(champ, `${champ} : information manquante.`);
  }
  if (s.length > max) throw new SaisieInvalide(champ, `${champ} : ${max} caractères maximum.`);
  return s;
}

export function texteFacultatif(
  v: unknown,
  champ: string,
  { max = 1000, sauts = true }: { max?: number; sauts?: boolean } = {}
): string | null {
  if (v === null || v === undefined || v === "") return null;
  const s = assainir(brut(v, champ), sauts);
  if (!s) return null;
  if (s.length > max) throw new SaisieInvalide(champ, `${champ} : ${max} caractères maximum.`);
  return s;
}

export function entier(
  v: unknown,
  champ: string,
  { min, max }: { min: number; max: number }
): number {
  const n = typeof v === "number" ? v : Number(brut(v, champ));
  if (!Number.isInteger(n)) throw new SaisieInvalide(champ, `${champ} : nombre entier attendu.`);
  if (n < min || n > max) {
    throw new SaisieInvalide(champ, `${champ} : valeur attendue entre ${min} et ${max}.`);
  }
  return n;
}

/** Case à cocher obligatoire (les CGV, notamment) : rien d'autre que `true`. */
export function vrai(v: unknown, champ: string, message: string): true {
  if (v !== true) throw new SaisieInvalide(champ, message);
  return true;
}

/** Case facultative : tout ce qui n'est pas explicitement `true` vaut « non ». */
export function booleen(v: unknown): boolean {
  return v === true;
}

export function email(v: unknown, champ: string): string {
  const s = texte(v, champ, { min: 3, max: 254 });
  if (!isValidEmail(s)) throw new SaisieInvalide(champ, "Adresse e-mail invalide.");
  return s.toLowerCase();
}

/** Le navigateur envoie déjà du E.164 ; on revalide sans lui faire confiance. */
export function telephone(v: unknown, champ: string): string {
  const s = texte(v, champ, { min: 5, max: 25 });
  let valide = false;
  try {
    valide = isValidPhoneNumber(s);
  } catch {
    valide = false;
  }
  if (!valide) throw new SaisieInvalide(champ, "Numéro de téléphone invalide.");
  return s;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function uuid(v: unknown, champ: string): string {
  const s = texte(v, champ, { min: 36, max: 36 });
  if (!UUID.test(s)) throw new SaisieInvalide(champ, `${champ} : identifiant invalide.`);
  return s.toLowerCase();
}

/**
 * Liste d'identifiants du référentiel (les options, par exemple). Les doublons
 * sont fusionnés et le nombre d'éléments plafonné ; l'appelant doit ensuite
 * vérifier que chaque identifiant existe VRAIMENT en base.
 */
export function identifiants(v: unknown, champ: string, maxElements = 20): string[] {
  if (v === null || v === undefined) return [];
  if (!Array.isArray(v)) throw new SaisieInvalide(champ, `${champ} : liste attendue.`);
  if (v.length > maxElements) throw new SaisieInvalide(champ, `${champ} : trop d'éléments.`);
  const vus = new Set<string>();
  for (const element of v) {
    const s = texte(element, champ, { min: 1, max: 60 });
    if (!/^[a-z0-9-]+$/.test(s)) throw new SaisieInvalide(champ, `${champ} : identifiant invalide.`);
    vus.add(s);
  }
  return [...vus];
}

/** Date « AAAA-MM-JJ », réellement existante, dans une fenêtre raisonnable. */
export function jour(
  v: unknown,
  champ: string,
  { maxJours = 400 }: { maxJours?: number } = {}
): string {
  const s = texte(v, champ, { min: 10, max: 10 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new SaisieInvalide(champ, `${champ} : date invalide.`);
  const d = new Date(`${s}T12:00:00Z`);
  // Écarte les dates syntaxiquement valides mais inexistantes (31 février).
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) {
    throw new SaisieInvalide(champ, `${champ} : date invalide.`);
  }
  const jours = (d.getTime() - Date.now()) / 86_400_000;
  if (jours < -1 || jours > maxJours) throw new SaisieInvalide(champ, `${champ} : date hors période.`);
  return s;
}

/**
 * Montant saisi en euros, converti en centimes entiers.
 *
 * On accepte la virgule comme séparateur décimal — c'est ce qu'un clavier
 * belge produit — et on arrondit au centime le plus proche plutôt que de
 * laisser filer un flottant : « 18,1 » doit donner 1810, pas 1809,9999.
 */
export function montantEnCents(
  v: unknown,
  champ: string,
  { max = 1_000_000 }: { max?: number } = {}
): number {
  const brut = typeof v === "number" ? String(v) : texte(v, champ, { min: 1, max: 12 });
  const normalise = brut.replace(",", ".").replace(/\s/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(normalise)) {
    throw new SaisieInvalide(champ, `${champ} : montant invalide.`);
  }
  const cents = Math.round(Number(normalise) * 100);
  if (!Number.isFinite(cents) || cents < 0 || cents > max) {
    throw new SaisieInvalide(champ, `${champ} : montant hors limites.`);
  }
  return cents;
}

/** Liste de lignes saisies dans une zone de texte, une par ligne. */
export function lignes(v: unknown, champ: string, { max = 30, maxLigne = 200 } = {}): string[] {
  if (v === null || v === undefined || v === "") return [];
  const brut = texte(v, champ, { min: 0, max: 8000, sauts: true });
  const sortie = brut
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (sortie.length > max) throw new SaisieInvalide(champ, `${champ} : ${max} lignes maximum.`);
  for (const l of sortie) {
    if (l.length > maxLigne) {
      throw new SaisieInvalide(champ, `${champ} : ${maxLigne} caractères maximum par ligne.`);
    }
  }
  return sortie;
}
