import "server-only";
import { base, baseConfiguree } from "@/lib/supabase/server";

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

export interface ResumeAudience {
  jours: number;
  visites: number;
  pagesVues: number;
  reservations: number;
  /** Réservations rapportées aux visites de la page de réservation, en %. */
  tauxConversion: number | null;
  parJour: { jour: string; visites: number }[];
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

/**
 * Tout le tableau de bord en une seule requête.
 *
 * On rapatrie les lignes brutes de la période et on agrège en mémoire, plutôt
 * que d'écrire six requêtes SQL d'agrégation. À l'échelle d'un complexe de
 * quartier — quelques milliers d'événements par mois — c'est plus simple à
 * lire et à faire évoluer, et la différence de vitesse est imperceptible.
 * Si le volume devenait tel que ça compte, ce sont des vues SQL qu'il faudrait
 * écrire, pas de la pagination ici.
 */
export async function lireAudience(jours = 30): Promise<ResumeAudience | null> {
  if (!baseConfiguree()) return null;

  const depuis = new Date(Date.now() - jours * 86_400_000).toISOString();

  const { data, error } = await base()
    .from("evenements_audience")
    .select("survenu_le, session, nom, chemin, provenance, appareil, pays")
    .gte("survenu_le", depuis)
    .order("survenu_le", { ascending: false })
    .limit(50_000);

  if (error || !data) return null;
  const lignes = data as LigneBrute[];

  const sessions = new Set(lignes.map((l) => l.session));
  const pagesVues = lignes.filter((l) => l.nom === "page");

  // Visites par jour, sur la période complète — y compris les jours à zéro,
  // sans quoi une courbe plate et une courbe trouée se ressemblent.
  const parJourMap = new Map<string, Set<string>>();
  for (const l of lignes) {
    const jour = l.survenu_le.slice(0, 10);
    const s = parJourMap.get(jour) ?? new Set<string>();
    s.add(l.session);
    parJourMap.set(jour, s);
  }
  const parJour: { jour: string; visites: number }[] = [];
  for (let i = jours - 1; i >= 0; i--) {
    const jour = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    parJour.push({ jour, visites: parJourMap.get(jour)?.size ?? 0 });
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

  const reservations = sessionsParEtape.get("reservation")?.size ?? 0;

  return {
    jours,
    visites: sessions.size,
    pagesVues: pagesVues.length,
    reservations,
    tauxConversion: depart > 0 ? (reservations / depart) * 100 : null,
    parJour,
    pages: compter(pagesVues.map((l) => l.chemin)),
    provenances: compter(lignes.map((l) => l.provenance)),
    appareils: compter(lignes.map((l) => l.appareil)),
    pays: compter(lignes.map((l) => l.pays), 6),
    tunnel,
  };
}
