import "server-only";
import { base, baseConfiguree } from "@/lib/supabase/server";
import { jourISO } from "@/lib/temps";

/**
 * Mesure d'audience — écriture des événements et lectures du tableau de bord.
 *
 * Ce que cet outil sert à répondre, et rien d'autre : d'où viennent les gens,
 * ce qu'ils regardent, et surtout à quelle étape ils abandonnent une
 * réservation. C'est cette dernière question qui vaut de l'argent — le reste
 * est du contexte.
 *
 * Aucune adresse IP n'est écrite, et l'identifiant de session est tiré au
 * hasard par le navigateur puis oublié après 30 minutes. Voir l'en-tête de la
 * migration 0011 pour le raisonnement complet.
 */

export type Appareil = "mobile" | "tablette" | "ordinateur";

export interface EvenementEntrant {
  session: string;
  nom: string;
  chemin?: string | null;
  detail?: string | null;
  provenance?: string | null;
  appareil?: Appareil | null;
  pays?: string | null;
  langue?: string | null;
}

/**
 * Les étapes du tunnel, dans l'ordre où on les franchit.
 * L'ordre est la seule chose qui compte ici : c'est lui qui permet de dire
 * « on perd la moitié des gens entre le créneau et le formulaire ».
 */
export const ETAPES_TUNNEL = [
  { nom: "page_reservation", label: "Ouvre la réservation" },
  { nom: "activite", label: "Choisit une activité" },
  { nom: "formule", label: "Choisit une formule" },
  { nom: "formulaire", label: "Choisit un créneau, voit le formulaire" },
  { nom: "reservation", label: "Réserve" },
] as const;

/*
 * Cinq étapes et non six : le créneau et l'affichage du formulaire sont le
 * même instant dans les deux parcours — mesurer les deux donnerait une perte
 * nulle entre eux, donc une ligne qui n'apprend rien. La perte entre la
 * quatrième et la cinquième est en revanche LE chiffre à regarder : ce sont
 * les gens qui avaient choisi leur créneau et sont partis quand même.
 */

/** Coupe une chaîne à la longueur acceptée par la base, ou renvoie null. */
function borne(v: string | null | undefined, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

/**
 * Écrit un événement. Ne lève jamais : une mesure d'audience qui casse une
 * page de réservation serait un très mauvais échange.
 */
export async function enregistrerEvenement(e: EvenementEntrant): Promise<void> {
  if (!baseConfiguree()) return;
  const session = borne(e.session, 64);
  const nom = borne(e.nom, 40);
  if (!session || session.length < 8 || !nom) return;

  try {
    await base()
      .from("evenements_audience")
      .insert({
        session,
        nom,
        chemin: borne(e.chemin, 200),
        detail: borne(e.detail, 120),
        provenance: borne(e.provenance, 120),
        appareil: e.appareil ?? null,
        pays: borne(e.pays, 2),
        langue: borne(e.langue, 12),
      });
  } catch {
    // Silencieux par conception : voir plus haut.
  }
}

// ---------------------------------------------------------------------------
// Lectures du tableau de bord
// ---------------------------------------------------------------------------

export interface Comptage {
  cle: string;
  n: number;
}

export interface EtapeTunnel {
  nom: string;
  label: string;
  visites: number;
  /** Part des visites qui ont atteint cette étape, rapportée à la première. */
  part: number;
  /** Part perdue entre l'étape précédente et celle-ci. */
  perte: number;
}

/** Une période en jours de Bruxelles, bornes incluses : « 2026-09-24 » → « 2026-10-03 ». */
export interface PeriodeAudience {
  du: string;
  au: string;
}

/** Une journée du graphique : ce que montre l'infobulle quand on la survole. */
export interface PointJour {
  jour: string;
  /** Visites mesurées (sessions distinctes). */
  visites: number;
  pagesVues: number;
  /** Réservations réelles créées ce jour-là, mesurées ou non. */
  reservations: number;
}

export interface ResumeAudience {
  periode: PeriodeAudience;
  /** Nombre de jours de la période, bornes comprises. */
  jours: number;
  /** Visites MESURÉES, donc seulement celles qui ont accepté la mesure. */
  visites: number;
  pagesVues: number;
  /**
   * Réservations RÉELLES, lues dans la table des réservations.
   *
   * Surtout pas comptées depuis les événements d'audience : ceux-ci n'existent
   * que pour les visiteurs ayant accepté la mesure. Le 15 septembre 2026, une
   * réservation payée n'a produit AUCUN événement — la tuile affichait donc
   * « 0 réservation » alors qu'il y en avait deux en base. Un exploitant qui
   * lit ça conclut que son site ne vend rien.
   */
  reservations: number;
  /** Ce qui a été encaissé sur la période, remboursements déduits. */
  encaisseCents: number;
  /**
   * Part des visiteurs MESURÉS qui, après avoir ouvert la page de réservation,
   * sont allés jusqu'au bout. `null` si personne n'a ouvert cette page.
   *
   * Ce taux ne porte QUE sur les visiteurs mesurés, des deux côtés de la
   * division : le rapprocher du nombre réel de réservations n'aurait aucun
   * sens, et pourrait dépasser 100 %.
   */
  tauxConversion: number | null;
  /**
   * LES DEUX TERMES DE LA DIVISION, POUR POUVOIR LES ÉCRIRE.
   *
   * Un pourcentage seul ment par omission. « 0,0 % » sur cinq visiteurs
   * mesurés dont aucun n'a réservé ne dit pas la même chose que « 0,0 % » sur
   * mille : le premier est un échantillon vide, le second une catastrophe
   * commerciale. Le 15 septembre 2026 l'exploitant a lu « 0 % » alors qu'une
   * réservation venait d'être payée — elle venait d'un visiteur qui avait
   * refusé la mesure, donc invisible des deux côtés du calcul.
   *
   * On expose donc le numérateur et le dénominateur, et c'est la page qui
   * écrit la phrase honnête.
   */
  ouvertParcours: number;
  reservationsMesurees: number;
  parJour: PointJour[];
  pages: Comptage[];
  provenances: Comptage[];
  appareils: Comptage[];
  pays: Comptage[];
  tunnel: EtapeTunnel[];
}

interface LigneBrute {
  survenu_le: string;
  session: string;
  nom: string;
  chemin: string | null;
  provenance: string | null;
  appareil: string | null;
  pays: string | null;
}

/** Compte les occurrences d'une clé, du plus fréquent au moins fréquent. */
function compter(valeurs: (string | null)[], limite = 8): Comptage[] {
  const m = new Map<string, number>();
  for (const v of valeurs) {
    const cle = v?.trim();
    if (!cle) continue;
    m.set(cle, (m.get(cle) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([cle, n]) => ({ cle, n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, limite);
}

/** « 2026-10-03 » → midi UTC ce jour-là : la date reste la même quel que soit le décalage. */
function midi(jour: string): Date {
  return new Date(`${jour}T12:00:00Z`);
}

/** Les jours de la période, du premier au dernier, en jours de Bruxelles. */
export function joursDeLaPeriode({ du, au }: PeriodeAudience): string[] {
  const jours: string[] = [];
  for (let t = midi(du).getTime(); t <= midi(au).getTime(); t += 86_400_000) {
    jours.push(jourISO(new Date(t)));
  }
  return jours;
}

/**
 * Tout le tableau de bord en une seule requête.
 *
 * On rapatrie les lignes brutes de la période et on agrège en mémoire, plutôt
 * que d'écrire six requêtes SQL d'agrégation. À l'échelle d'un complexe de
 * quartier — quelques milliers d'événements par mois — c'est plus simple à
 * lire et à faire évoluer, et la différence de vitesse est imperceptible.
 * Si le volume devenait tel que ça compte, ce sont des vues SQL qu'il faudrait
 * écrire, pas de la pagination ici.
 *
 * UNE PÉRIODE « DU … AU … », ET PLUS SEULEMENT « LES N DERNIERS JOURS ».
 * Demandé par Brahim le 3 octobre 2026. Les bornes sont des jours de
 * Bruxelles : on lit large — de la veille à midi au lendemain à midi, en UTC
 * —, puis `jourISO` range chaque ligne dans son jour. Aucun calcul de fuseau à
 * la main, et une visite à 0h30 le samedi compte bien pour le samedi.
 */
export async function lireAudience(periode: PeriodeAudience): Promise<ResumeAudience | null> {
  if (!baseConfiguree()) return null;

  const jours = joursDeLaPeriode(periode);
  const dedans = new Set(jours);
  const depuis = new Date(midi(periode.du).getTime() - 86_400_000).toISOString();
  const jusqua = new Date(midi(periode.au).getTime() + 86_400_000).toISOString();
  const dansLaPeriode = (instant: string) => dedans.has(jourISO(new Date(instant)));

  const { data, error } = await base()
    .from("evenements_audience")
    .select("survenu_le, session, nom, chemin, provenance, appareil, pays")
    .gte("survenu_le", depuis)
    .lt("survenu_le", jusqua)
    .order("survenu_le", { ascending: false })
    .limit(50_000);

  if (error || !data) return null;
  const lignes = (data as LigneBrute[]).filter((l) => dansLaPeriode(l.survenu_le));

  const sessions = new Set(lignes.map((l) => l.session));
  const pagesVues = lignes.filter((l) => l.nom === "page");

  // Visites par jour, sur la période complète — y compris les jours à zéro,
  // sans quoi une courbe plate et une courbe trouée se ressemblent. Le jour
  // est celui de Bruxelles : `slice(0, 10)` sur l'instant donnait le jour
  // UTC, et rangeait la veille une visite faite avant 2h du matin.
  const parJourMap = new Map<string, Set<string>>();
  for (const l of lignes) {
    const jour = jourISO(new Date(l.survenu_le));
    const s = parJourMap.get(jour) ?? new Set<string>();
    s.add(l.session);
    parJourMap.set(jour, s);
  }
  const pagesParJour = new Map<string, number>();
  for (const l of pagesVues) {
    const jour = jourISO(new Date(l.survenu_le));
    pagesParJour.set(jour, (pagesParJour.get(jour) ?? 0) + 1);
  }

  // Tunnel : on compte des VISITES distinctes par étape, pas des événements.
  // Un visiteur qui revient trois fois sur le choix du créneau ne vaut qu'une.
  const sessionsParEtape = new Map<string, Set<string>>();
  for (const l of lignes) {
    const etape =
      l.nom === "page" && l.chemin?.startsWith("/reservation") ? "page_reservation" : l.nom;
    const s = sessionsParEtape.get(etape) ?? new Set<string>();
    s.add(l.session);
    sessionsParEtape.set(etape, s);
  }

  const depart = sessionsParEtape.get("page_reservation")?.size ?? 0;
  let precedent = depart;
  const tunnel: EtapeTunnel[] = ETAPES_TUNNEL.map((e) => {
    const visites = sessionsParEtape.get(e.nom)?.size ?? 0;
    const etape: EtapeTunnel = {
      nom: e.nom,
      label: e.label,
      visites,
      part: depart > 0 ? visites / depart : 0,
      perte: precedent > 0 ? Math.max(0, (precedent - visites) / precedent) : 0,
    };
    precedent = visites;
    return etape;
  });

  // Mesuré : sert au taux de conversion, dont les deux termes doivent venir
  // de la même population.
  const reservationsMesurees = sessionsParEtape.get("reservation")?.size ?? 0;

  /*
    LES VRAIS CHIFFRES VIENNENT DES VRAIES TABLES.

    Ceux-ci ne dépendent d'aucun consentement : ce ne sont pas des traces de
    navigation mais l'activité du complexe, que l'exploitant possède déjà.
  */
  const [{ data: reservationsLues }, { data: paiementsLus }] = await Promise.all([
    base()
      .from("reservations")
      .select("created_at")
      .gte("created_at", depuis)
      .lt("created_at", jusqua)
      .in("statut", ["en_attente", "confirmee"]),
    base()
      .from("paiements")
      .select("created_at, montant_cents, montant_rembourse_cents")
      .gte("created_at", depuis)
      .lt("created_at", jusqua)
      .in("statut", ["reussi", "partiellement_rembourse"]),
  ]);

  const reservationsDeLaPeriode = (reservationsLues ?? []).filter((r) => dansLaPeriode(r.created_at));
  const reservations = reservationsDeLaPeriode.length;
  const reservationsParJour = new Map<string, number>();
  for (const r of reservationsDeLaPeriode) {
    const jour = jourISO(new Date(r.created_at));
    reservationsParJour.set(jour, (reservationsParJour.get(jour) ?? 0) + 1);
  }
  const parJour: PointJour[] = jours.map((jour) => ({
    jour,
    visites: parJourMap.get(jour)?.size ?? 0,
    pagesVues: pagesParJour.get(jour) ?? 0,
    reservations: reservationsParJour.get(jour) ?? 0,
  }));
  const encaissements = (paiementsLus ?? []).filter((p) => dansLaPeriode(p.created_at));

  const encaisseCents = encaissements.reduce(
    (somme, p) => somme + (p.montant_cents ?? 0) - (p.montant_rembourse_cents ?? 0),
    0
  );

  return {
    periode,
    jours: jours.length,
    visites: sessions.size,
    pagesVues: pagesVues.length,
    reservations,
    encaisseCents,
    tauxConversion: depart > 0 ? (reservationsMesurees / depart) * 100 : null,
    ouvertParcours: depart,
    reservationsMesurees,
    parJour,
    pages: compter(pagesVues.map((l) => l.chemin)),
    provenances: compter(lignes.map((l) => l.provenance)),
    appareils: compter(lignes.map((l) => l.appareil)),
    pays: compter(lignes.map((l) => l.pays), 6),
    tunnel,
  };
}
