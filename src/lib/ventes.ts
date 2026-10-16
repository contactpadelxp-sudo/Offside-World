import type { StatutReservation, TypeActivite } from "@/lib/vues";

/**
 * Le récapitulatif des ventes en ligne, calculé pour un comptable.
 *
 * Demandé par Brahim le 14 octobre 2026 — « je ne suis pas censé avoir un
 * récap de mes ventes pour envoyer à mon comptable ? » —, puis par Mathis :
 * un export par période, avec la TVA, « sérieux, car il va l'envoyer à son
 * comptable ».
 *
 * CE MODULE NE LIT RIEN ET N'ÉCRIT RIEN. Il reçoit des paiements et des
 * remboursements déjà lus, et rend les lignes et les totaux. C'est ici que se
 * décident tous les chiffres que le comptable lira — ils se testent donc sans
 * base, comme `tarification.ts`.
 *
 * TROIS RÈGLES, QUI FONT QUE LES TOTAUX RETOMBENT TOUJOURS JUSTE.
 *
 *   1. TOUT EN CENTIMES ENTIERS. Aucune somme ne passe par un flottant.
 *   2. LA TVA EST EXTRAITE DU MONTANT PAYÉ, ligne par ligne : HTVA = TVAC ÷
 *      (1 + taux), arrondi au centime, et TVA = TVAC − HTVA. Le prix payé par
 *      le client ne bouge donc jamais d'un centime, et chaque total est la
 *      somme exacte des lignes qu'il résume.
 *   3. UN MONTANT SE RÉPARTIT SANS PERTE. Un remboursement de 50 % sur une vente
 *      à deux taux se ventile au prorata des lignes, et les centimes d'arrondi
 *      vont aux plus grands restes : la somme des parts vaut toujours le
 *      montant remboursé, jamais un centime de plus ou de moins.
 *
 * UN TAUX INCONNU N'EST PAS DEVINÉ. Une ligne sans taux garde son montant TVAC
 * et laisse vides HTVA et TVA, et l'export le dit en tête. Un taux à 0 % est
 * un vrai taux — exonéré —, pas une absence.
 */

/** Une ligne figée à l'écriture de la réservation (`reservations.lignes`). */
export interface LigneFigee {
  nature: string;
  /** Formule ou option d'origine — sert à retrouver le taux actuel si la vente n'en portait pas. */
  ref: string | null;
  designation: string;
  quantite: number;
  puCents: number;
  totalCents: number;
  tvaPourcent: number | null;
}

/** Un paiement encaissé, avec ce qu'il couvre. */
export interface PaiementVente {
  paiementId: string;
  reference: string;
  typeActivite: TypeActivite;
  statutReservation: StatutReservation;
  /** Jour de l'activité, « 2026-10-11 », heure de Bruxelles. */
  jourActivite: string | null;
  /** Jour de l'encaissement, « 2026-09-27 », heure de Bruxelles. */
  jourPaiement: string;
  montantCents: number;
  methode: string | null;
  /** `null` quand la réservation n'a pas de détail figé (panne à l'écriture). */
  lignes: LigneFigee[] | null;
  /**
   * La formule et les options de la réservation — de quoi retrouver un taux
   * pour une vente dont le détail n'a pas pu être figé ligne par ligne.
   */
  formuleId: string | null;
  optionsIds: string[];
}

/** Un mouvement de remboursement : positif quand on rend, négatif quand Stripe annule un remboursement. */
export interface MouvementRemboursement {
  id: number;
  /** Jour du mouvement, heure de Bruxelles. */
  jour: string;
  montantCents: number;
  /**
   * Ce qui avait déjà été rendu sur ce paiement AVANT ce mouvement, toutes
   * périodes confondues. C'est ce qui permet de ventiler le cumul plutôt que
   * chaque mouvement isolé — voir `construireRapport`.
   */
  rembourseAvantCents: number;
  /** Reconstitué par la migration 0040 : daté approximativement. */
  repris: boolean;
  paiement: PaiementVente;
}

/** Les taux réglés aujourd'hui dans « Tarifs », pour les ventes faites avant qu'ils le soient. */
export interface TauxActuels {
  formules: Record<string, number | null>;
  options: Record<string, number | null>;
  /** Le Bubble Foot n'a pas de ligne de tarif en base : son taux vit dans le code. */
  bubble: number | null;
}

/**
 * D'où vient le taux d'une ligne.
 *
 * - `vente` : figé au moment de la vente — le cas normal ;
 * - `actuel` : la vente n'en portait pas (taux pas encore renseigné ce
 *   jour-là), on applique celui réglé aujourd'hui, et on le signale ;
 * - `inconnu` : aucun taux nulle part — HTVA et TVA restent vides.
 */
export type OrigineTaux = "vente" | "actuel" | "inconnu";

export interface LigneRapport {
  genre: "vente" | "remboursement";
  /** Jour de l'encaissement ou du remboursement. */
  jour: string;
  reference: string;
  jourActivite: string | null;
  /** Pour un remboursement : le jour de la vente remboursée. */
  jourVente: string;
  designation: string;
  /** Vente seulement : un remboursement porte sur un montant, pas sur des unités. */
  quantite: number | null;
  puCents: number | null;
  /** Négatif pour un remboursement. */
  ttcCents: number;
  tauxPourcent: number | null;
  htCents: number | null;
  tvaCents: number | null;
  origineTaux: OrigineTaux;
  methode: string | null;
  statutReservation: StatutReservation;
}

export interface TotalTaux {
  tauxPourcent: number | null;
  ventesTtcCents: number;
  remboursementsTtcCents: number;
  netTtcCents: number;
  netHtCents: number | null;
  netTvaCents: number | null;
}

export interface TotalMois {
  /** « 2026-10 » */
  mois: string;
  ventesTtcCents: number;
  remboursementsTtcCents: number;
  netTtcCents: number;
  /** Somme des lignes dont le taux est connu ; voir `ttcSansTauxCents`. */
  netHtCents: number;
  netTvaCents: number;
  ttcSansTauxCents: number;
}

export interface TotalMoyen {
  methode: string;
  ventesTtcCents: number;
  remboursementsTtcCents: number;
  nombreVentes: number;
}

export interface RapportVentes {
  du: string;
  au: string;
  ventes: LigneRapport[];
  remboursements: LigneRapport[];
  parTaux: TotalTaux[];
  parMois: TotalMois[];
  parMoyen: TotalMoyen[];
  nombreVentes: number;
  nombreRemboursements: number;
  ventesTtcCents: number;
  remboursementsTtcCents: number;
  netTtcCents: number;
  /** HTVA et TVA des seules lignes au taux connu. */
  netHtCents: number;
  netTvaCents: number;
  /** TVAC des lignes sans taux : à zéro, HTVA + TVA = TVAC. */
  ttcSansTauxCents: number;
  avertissements: string[];
}

// ── Lecture du détail figé ──────────────────────────────────────────────────

function entierOu(v: unknown, defaut: number): number {
  return typeof v === "number" && Number.isInteger(v) ? v : defaut;
}

/**
 * `reservations.lignes` tel que la base le rend, vérifié champ par champ.
 *
 * `null` si la colonne est vide ou illisible : l'appelant traite alors la
 * vente comme une ligne unique au montant payé, et le signale. Une ligne
 * malformée invalide tout le détail plutôt que de fausser une somme en
 * silence.
 */
export function lignesFigeesDepuisJson(json: unknown): LigneFigee[] | null {
  if (!Array.isArray(json) || json.length === 0) return null;
  const lignes: LigneFigee[] = [];
  for (const brut of json) {
    if (!brut || typeof brut !== "object") return null;
    const l = brut as Record<string, unknown>;
    const total = l.total_cents;
    if (typeof total !== "number" || !Number.isInteger(total)) return null;
    const tva = l.tva_pourcent;
    lignes.push({
      nature: typeof l.nature === "string" ? l.nature : "reservation",
      ref: typeof l.ref === "string" ? l.ref : null,
      designation: typeof l.designation === "string" && l.designation ? l.designation : "Réservation",
      quantite: entierOu(l.quantite, 1),
      puCents: entierOu(l.pu_cents, total),
      totalCents: total,
      tvaPourcent: typeof tva === "number" && Number.isFinite(tva) ? tva : null,
    });
  }
  return lignes;
}

// ── Arithmétique ────────────────────────────────────────────────────────────

/**
 * HTVA et TVA contenues dans un montant TVAC.
 *
 * L'arrondi se fait sur la valeur absolue : `Math.round(-2.5)` vaut −2 en
 * JavaScript mais `Math.round(2.5)` vaut 3. Sans ça, un remboursement n'aurait
 * pas exactement la TVA opposée de la vente qu'il annule.
 */
export function ventilerTva(
  ttcCents: number,
  tauxPourcent: number | null
): { htCents: number | null; tvaCents: number | null } {
  if (tauxPourcent === null) return { htCents: null, tvaCents: null };
  const signe = ttcCents < 0 ? -1 : 1;
  const absolu = Math.abs(ttcCents);
  const ht = Math.round((absolu * 100) / (100 + tauxPourcent));
  return { htCents: signe * ht, tvaCents: signe * (absolu - ht) };
}

/**
 * Répartit un montant au prorata de poids, sans perdre un centime.
 *
 * Méthode des plus grands restes : chaque part reçoit sa partie entière, puis
 * les centimes restants vont aux plus grands restes — à égalité, à la ligne la
 * plus haute. La somme des parts vaut toujours exactement `montant`.
 */
export function repartir(montant: number, poids: number[]): number[] {
  if (poids.length === 0) return [];
  const signe = montant < 0 ? -1 : 1;
  const absolu = Math.abs(montant);
  const somme = poids.reduce((s, p) => s + Math.max(0, p), 0);
  if (somme === 0) return poids.map((_, i) => (i === 0 ? montant : 0));

  const exacts = poids.map((p) => (absolu * Math.max(0, p)) / somme);
  const parts = exacts.map(Math.floor);
  let reste = absolu - parts.reduce((s, p) => s + p, 0);
  const ordre = exacts
    .map((e, i) => ({ i, r: e - Math.floor(e) }))
    .sort((a, b) => b.r - a.r || a.i - b.i);
  for (const { i } of ordre) {
    if (reste <= 0) break;
    parts[i] += 1;
    reste -= 1;
  }
  return parts.map((p) => signe * p);
}

// ── Construction du rapport ─────────────────────────────────────────────────

const LIBELLE_TYPE: Record<TypeActivite, string> = {
  anniversaire: "Anniversaire",
  bubble: "Bubble Foot",
  team_building: "Team building",
};

/** Ce qu'il faut savoir de la vente pour retrouver le taux d'une ligne de repli. */
export interface ContexteTaux {
  typeActivite: TypeActivite;
  formuleId: string | null;
  optionsIds: string[];
}

/**
 * Le taux d'une ligne, et d'où il vient.
 *
 * Une ligne sans taux figé prend le taux réglé aujourd'hui pour ce qu'elle
 * vend. Une ligne UNIQUE — le détail n'a pas pu être figé — n'en prend un que
 * si la formule et toutes ses options ont le même : sinon, un seul taux pour
 * un montant qui en mêle plusieurs serait faux, et on le laisse inconnu.
 */
export function tauxDeLaLigne(
  ligne: LigneFigee,
  actuels: TauxActuels,
  contexte?: ContexteTaux
): { taux: number | null; origine: OrigineTaux } {
  if (ligne.tvaPourcent !== null) return { taux: ligne.tvaPourcent, origine: "vente" };

  let actuel: number | null | undefined;
  if (ligne.nature === "option" && ligne.ref) {
    actuel = actuels.options[ligne.ref];
  } else if ((ligne.nature === "formule" || ligne.nature === "participant_sup") && ligne.ref) {
    actuel = actuels.formules[ligne.ref];
  } else if (ligne.nature === "bubble" || contexte?.typeActivite === "bubble") {
    actuel = actuels.bubble;
  } else if (ligne.nature === "reservation" && contexte?.formuleId) {
    const taux = [
      actuels.formules[contexte.formuleId],
      ...contexte.optionsIds.map((o) => actuels.options[o]),
    ];
    const tousConnus = taux.every((t): t is number => typeof t === "number");
    if (tousConnus && new Set(taux).size === 1) actuel = taux[0];
  }

  return typeof actuel === "number"
    ? { taux: actuel, origine: "actuel" }
    : { taux: null, origine: "inconnu" };
}

/**
 * Les lignes qui composent un paiement, montants ajustés au paiement.
 *
 * Normalement le détail figé retombe exactement sur le montant payé. S'il
 * manque, on en fait une ligne unique ; s'il ne retombe pas juste — cas
 * anormal, signalé —, le montant PAYÉ fait foi et se répartit au prorata.
 */
function lignesDuPaiement(
  p: PaiementVente,
  signaler: (code: string, texte: string) => void
): { ligne: LigneFigee; montantCents: number }[] {
  const lignes = p.lignes ?? [
    {
      nature: "reservation",
      ref: null,
      designation: LIBELLE_TYPE[p.typeActivite] ?? "Réservation",
      quantite: 1,
      puCents: p.montantCents,
      totalCents: p.montantCents,
      tvaPourcent: null,
    },
  ];
  if (!p.lignes) signaler(`sans-detail:${p.reference}`, p.reference);

  const somme = lignes.reduce((s, l) => s + l.totalCents, 0);
  if (somme === p.montantCents) return lignes.map((ligne) => ({ ligne, montantCents: ligne.totalCents }));

  signaler(`ecart:${p.reference}`, p.reference);
  const parts = repartir(
    p.montantCents,
    lignes.map((l) => l.totalCents)
  );
  return lignes.map((ligne, i) => ({ ligne, montantCents: parts[i] }));
}

// ── Libellés, partagés par l'écran et les fichiers ──────────────────────────

export function methodeLisible(m: string | null): string {
  if (m === "bancontact") return "Bancontact";
  if (m === "card") return "Carte";
  return m ? m : "Non précisé";
}

export const LIBELLE_STATUT: Record<StatutReservation, string> = {
  en_attente: "En attente",
  confirmee: "Confirmée",
  annulee: "Annulée",
  expiree: "Expirée",
};

export const LIBELLE_ORIGINE: Record<OrigineTaux, string> = {
  vente: "Taux de la vente",
  actuel: "Taux actuel (Tarifs)",
  inconnu: "Non renseigné",
};

/** « 2026-10-16 » → « 16/10/2026 » : la forme qu'un comptable belge relit. */
export function jourCourt(jour: string): string {
  const [a, m, j] = jour.split("-");
  return `${j}/${m}/${a}`;
}

const JOUR_LONG = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const MOIS_LONG = new Intl.DateTimeFormat("fr-BE", { month: "long", year: "numeric", timeZone: "UTC" });

/** « 2026-10-01 » → « 1er octobre 2026 ». */
export function jourLong(jour: string): string {
  return JOUR_LONG.format(new Date(`${jour}T12:00:00Z`)).replace(/^1 /, "1er ");
}

/** « 2026-10 » → « octobre 2026 ». */
export function moisLong(mois: string): string {
  return MOIS_LONG.format(new Date(`${mois}-15T12:00:00Z`));
}

/** « du 1er octobre 2026 au 31 octobre 2026 », ou « le 16 octobre 2026 ». */
export function periodeLisible(du: string, au: string): string {
  return du === au ? `le ${jourLong(du)}` : `du ${jourLong(du)} au ${jourLong(au)}`;
}

/** Libellé d'un taux : « 6 % », « 0 % (exonéré) », « Non renseigné ». */
export function tauxLisible(taux: number | null): string {
  if (taux === null) return "Non renseigné";
  return taux === 0 ? "0 % (exonéré)" : `${taux} %`;
}

export function construireRapport({
  du,
  au,
  paiements,
  remboursements,
  actuels,
}: {
  du: string;
  au: string;
  paiements: PaiementVente[];
  remboursements: MouvementRemboursement[];
  actuels: TauxActuels;
}): RapportVentes {
  const signales = new Map<string, Set<string>>();
  const signaler = (code: string, valeur: string) => {
    const famille = code.split(":")[0];
    const ensemble = signales.get(famille) ?? new Set<string>();
    ensemble.add(valeur);
    signales.set(famille, ensemble);
  };
  const tauxActuelsUtilises = new Set<string>();
  const sansTaux = new Set<string>();

  const ligneRapport = (
    genre: LigneRapport["genre"],
    jour: string,
    p: PaiementVente,
    ligne: LigneFigee,
    ttcCents: number,
    /** Pour un remboursement : HTVA et TVA déjà calculées sur le cumul. */
    ventile?: (taux: number | null) => { htCents: number | null; tvaCents: number | null }
  ): LigneRapport => {
    const { taux, origine } = tauxDeLaLigne(ligne, actuels, p);
    if (origine === "actuel") tauxActuelsUtilises.add(ligne.designation);
    if (origine === "inconnu") sansTaux.add(ligne.designation);
    const { htCents, tvaCents } = ventile ? ventile(taux) : ventilerTva(ttcCents, taux);
    return {
      genre,
      jour,
      reference: p.reference,
      jourActivite: p.jourActivite,
      jourVente: p.jourPaiement,
      designation: genre === "vente" ? ligne.designation : `Remboursement — ${ligne.designation}`,
      quantite: genre === "vente" ? ligne.quantite : null,
      puCents: genre === "vente" ? ligne.puCents : null,
      ttcCents,
      tauxPourcent: taux,
      htCents,
      tvaCents,
      origineTaux: origine,
      methode: p.methode,
      statutReservation: p.statutReservation,
    };
  };

  // Les ventes, dans l'ordre du calendrier.
  const ventes: LigneRapport[] = [];
  for (const p of [...paiements].sort(
    (a, b) => a.jourPaiement.localeCompare(b.jourPaiement) || a.reference.localeCompare(b.reference)
  )) {
    for (const { ligne, montantCents } of lignesDuPaiement(p, signaler)) {
      ventes.push(ligneRapport("vente", p.jourPaiement, p, ligne, montantCents));
    }
  }

  /*
    LES REMBOURSEMENTS SE VENTILENT SUR LE CUMUL, PAS MOUVEMENT PAR MOUVEMENT.

    Relevé par la relecture du 16 octobre 2026. Ventilé isolément, chaque
    mouvement arrondissait de son côté : une vente rendue en trois fois
    (33,33 + 33,33 + 133,84 €) laissait un centime de HTVA et de TVA en trop
    sur un montant net nul. On répartit donc le cumul rendu APRÈS le mouvement,
    puis celui d'AVANT, et le mouvement est la différence des deux. Un
    remboursement total redonne ainsi exactement, ligne par ligne, la TVA de la
    vente — quel que soit le nombre de fois où il a été fait.
  */
  const lignesRemb: LigneRapport[] = [];
  let reprisDansLaPeriode = false;
  for (const m of [...remboursements].sort((a, b) => a.jour.localeCompare(b.jour) || a.id - b.id)) {
    if (m.repris) reprisDansLaPeriode = true;
    const composantes = lignesDuPaiement(m.paiement, signaler);
    const poids = composantes.map((c) => c.montantCents);
    // Un remboursement (montant positif) est une recette en moins : négatif.
    const avant = repartir(-m.rembourseAvantCents, poids);
    const apres = repartir(-(m.rembourseAvantCents + m.montantCents), poids);
    composantes.forEach((c, i) => {
      const ttc = apres[i] - avant[i];
      if (ttc === 0) return;
      const l = ligneRapport("remboursement", m.jour, m.paiement, c.ligne, ttc, (taux) => {
        const va = ventilerTva(avant[i], taux);
        const vp = ventilerTva(apres[i], taux);
        return taux === null
          ? { htCents: null, tvaCents: null }
          : { htCents: vp.htCents! - va.htCents!, tvaCents: vp.tvaCents! - va.tvaCents! };
      });
      if (m.montantCents < 0) l.designation = `Remboursement annulé — ${c.ligne.designation}`;
      lignesRemb.push(l);
    });
  }

  // Totaux par taux.
  const cleTaux = (t: number | null) => (t === null ? "inconnu" : String(t));
  const parTauxMap = new Map<string, TotalTaux>();
  const cumulerTaux = (l: LigneRapport) => {
    const cle = cleTaux(l.tauxPourcent);
    const t = parTauxMap.get(cle) ?? {
      tauxPourcent: l.tauxPourcent,
      ventesTtcCents: 0,
      remboursementsTtcCents: 0,
      netTtcCents: 0,
      netHtCents: l.tauxPourcent === null ? null : 0,
      netTvaCents: l.tauxPourcent === null ? null : 0,
    };
    if (l.genre === "vente") t.ventesTtcCents += l.ttcCents;
    else t.remboursementsTtcCents += l.ttcCents;
    t.netTtcCents += l.ttcCents;
    if (t.netHtCents !== null && l.htCents !== null) t.netHtCents += l.htCents;
    if (t.netTvaCents !== null && l.tvaCents !== null) t.netTvaCents += l.tvaCents;
    parTauxMap.set(cle, t);
  };

  // Totaux par mois.
  const parMoisMap = new Map<string, TotalMois>();
  const cumulerMois = (l: LigneRapport) => {
    const mois = l.jour.slice(0, 7);
    const t = parMoisMap.get(mois) ?? {
      mois,
      ventesTtcCents: 0,
      remboursementsTtcCents: 0,
      netTtcCents: 0,
      netHtCents: 0,
      netTvaCents: 0,
      ttcSansTauxCents: 0,
    };
    if (l.genre === "vente") t.ventesTtcCents += l.ttcCents;
    else t.remboursementsTtcCents += l.ttcCents;
    t.netTtcCents += l.ttcCents;
    if (l.htCents !== null && l.tvaCents !== null) {
      t.netHtCents += l.htCents;
      t.netTvaCents += l.tvaCents;
    } else {
      t.ttcSansTauxCents += l.ttcCents;
    }
    parMoisMap.set(mois, t);
  };

  // Totaux par moyen de paiement — ce qui se rapproche des relevés Stripe.
  const parMoyenMap = new Map<string, TotalMoyen>();
  const cumulerMoyen = (l: LigneRapport) => {
    const methode = methodeLisible(l.methode);
    const t = parMoyenMap.get(methode) ?? {
      methode,
      ventesTtcCents: 0,
      remboursementsTtcCents: 0,
      nombreVentes: 0,
    };
    if (l.genre === "vente") t.ventesTtcCents += l.ttcCents;
    else t.remboursementsTtcCents += l.ttcCents;
    parMoyenMap.set(methode, t);
  };

  for (const l of [...ventes, ...lignesRemb]) {
    cumulerTaux(l);
    cumulerMois(l);
    cumulerMoyen(l);
  }
  for (const p of paiements) {
    const t = parMoyenMap.get(methodeLisible(p.methode));
    if (t) t.nombreVentes += 1;
  }

  const somme = (lignes: LigneRapport[], champ: "ttcCents" | "htCents" | "tvaCents") =>
    lignes.reduce((s, l) => s + (l[champ] ?? 0), 0);
  const toutes = [...ventes, ...lignesRemb];

  // Ce que le comptable doit savoir avant de lire les chiffres.
  const avertissements: string[] = [];
  if (sansTaux.size > 0) {
    avertissements.push(
      `Taux de TVA non renseigné pour : ${[...sansTaux].join(", ")}. Le montant TVAC de ces ` +
        "lignes est compté, mais leur HTVA et leur TVA ne sont pas calculés. Le taux d'une " +
        "formule ou d'une option se règle dans « Tarifs » du back-office" +
        ([...sansTaux].some((d) => d.startsWith("Bubble")) ? " ; celui du Bubble Foot, sur demande au site." : ".")
    );
  }
  if (tauxActuelsUtilises.size > 0) {
    avertissements.push(
      `Ventes faites avant que leur taux soit renseigné : ${[...tauxActuelsUtilises].join(", ")}. ` +
        "Le taux appliqué est celui réglé aujourd'hui dans « Tarifs » (colonne « Origine du taux »)."
    );
  }
  const sansDetail = signales.get("sans-detail");
  if (sansDetail && sansDetail.size > 0) {
    avertissements.push(
      `Détail non enregistré pour ${[...sansDetail].join(", ")} : le montant payé est repris sur une ` +
        "seule ligne."
    );
  }
  const ecarts = signales.get("ecart");
  if (ecarts && ecarts.size > 0) {
    avertissements.push(
      `Montant payé différent du détail enregistré pour ${[...ecarts].join(", ")} : le montant ` +
        "payé fait foi et a été réparti au prorata des lignes."
    );
  }
  if (reprisDansLaPeriode) {
    avertissements.push(
      "Certains remboursements sont antérieurs à la mise en place de cet export : le site ne " +
        "les datait pas encore, leur date est celle de la dernière modification du paiement."
    );
  }

  return {
    du,
    au,
    ventes,
    remboursements: lignesRemb,
    parTaux: [...parTauxMap.values()].sort(
      (a, b) => (a.tauxPourcent ?? Infinity) - (b.tauxPourcent ?? Infinity)
    ),
    parMois: [...parMoisMap.values()].sort((a, b) => a.mois.localeCompare(b.mois)),
    parMoyen: [...parMoyenMap.values()].sort((a, b) => a.methode.localeCompare(b.methode, "fr")),
    nombreVentes: paiements.length,
    nombreRemboursements: remboursements.length,
    ventesTtcCents: somme(ventes, "ttcCents"),
    remboursementsTtcCents: somme(lignesRemb, "ttcCents"),
    netTtcCents: somme(toutes, "ttcCents"),
    netHtCents: somme(toutes, "htCents"),
    netTvaCents: somme(toutes, "tvaCents"),
    ttcSansTauxCents: toutes
      .filter((l) => l.tauxPourcent === null)
      .reduce((s, l) => s + l.ttcCents, 0),
    avertissements,
  };
}
