"use client";

/**
 * Mesure d'audience — côté navigateur.
 *
 * Trois règles, dans cet ordre :
 *
 * 1. RIEN SANS CONSENTEMENT. Chaque envoi relit le choix stocké par le bandeau
 *    cookies. Un visiteur qui refuse, ou qui n'a pas encore répondu, n'envoie
 *    rien du tout — pas même une page vue.
 * 2. AUCUN IDENTIFIANT DURABLE. La session est tirée au hasard et vit dans
 *    `sessionStorage`, donc elle meurt avec l'onglet ; elle est en plus remise
 *    à zéro après 30 minutes d'inactivité. Deux visites d'une même personne ne
 *    peuvent pas être rapprochées, et c'est voulu.
 * 3. JAMAIS D'ERREUR VISIBLE. Tout est enveloppé : si la mesure échoue, le
 *    visiteur ne doit rien en savoir et la page doit continuer.
 */

const CLE_CONSENTEMENT = "offside_cookie_consent";
const CLE_SESSION = "offside_mesure_session";
const INACTIVITE_MS = 30 * 60 * 1000;

/** Le visiteur a-t-il accepté la mesure d'audience ? */
export function mesureAutorisee(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const brut = localStorage.getItem(CLE_CONSENTEMENT);
    if (!brut) return false;
    const c = JSON.parse(brut) as { analytics?: boolean };
    return c.analytics === true;
  } catch {
    return false;
  }
}

interface Session {
  id: string;
  vue: number;
}

function identifiantAleatoire(): string {
  const octets = new Uint8Array(12);
  crypto.getRandomValues(octets);
  return Array.from(octets, (o) => o.toString(16).padStart(2, "0")).join("");
}

/**
 * Identifiant de la visite en cours. En crée un s'il n'y en a pas, ou si la
 * dernière activité remonte à plus de 30 minutes — auquel cas c'est une
 * nouvelle visite, et l'ancienne ne doit pas pouvoir lui être reliée.
 */
function session(): string | null {
  try {
    const maintenant = Date.now();
    const brut = sessionStorage.getItem(CLE_SESSION);
    if (brut) {
      const s = JSON.parse(brut) as Session;
      if (s.id && maintenant - s.vue < INACTIVITE_MS) {
        sessionStorage.setItem(CLE_SESSION, JSON.stringify({ id: s.id, vue: maintenant }));
        return s.id;
      }
    }
    const id = identifiantAleatoire();
    sessionStorage.setItem(CLE_SESSION, JSON.stringify({ id, vue: maintenant }));
    return id;
  } catch {
    // Navigation privée stricte, stockage désactivé : on ne mesure pas.
    return null;
  }
}

function appareil(): "mobile" | "tablette" | "ordinateur" {
  const l = Math.min(window.innerWidth, window.innerHeight);
  const grand = Math.max(window.innerWidth, window.innerHeight);
  if (grand < 768) return "mobile";
  if (l < 768 && grand < 1200) return "tablette";
  return "ordinateur";
}

/**
 * D'où vient le visiteur. On garde `utm_source` s'il est présent, sinon
 * seulement l'HÔTE du référent — jamais l'URL complète, qui peut contenir
 * des termes de recherche ou un identifiant.
 */
function provenance(): string | null {
  try {
    const utm = new URLSearchParams(window.location.search).get("utm_source");
    if (utm) return utm.slice(0, 120);
    if (!document.referrer) return null;
    const hote = new URL(document.referrer).hostname;
    return hote === window.location.hostname ? null : hote;
  } catch {
    return null;
  }
}

/**
 * Envoie un événement. `sendBeacon` d'abord : c'est le seul moyen fiable
 * d'envoyer quelque chose au moment où l'onglet se ferme, et il ne retarde
 * jamais la navigation. `fetch` en repli, en mode `keepalive`.
 */
export function mesurer(nom: string, detail?: string): void {
  if (!mesureAutorisee()) return;
  const id = session();
  if (!id) return;

  try {
    const charge = JSON.stringify({
      consentement: true,
      session: id,
      nom,
      detail: detail ?? null,
      chemin: window.location.pathname,
      provenance: provenance(),
      appareil: appareil(),
      langue: navigator.language?.slice(0, 12) ?? null,
    });

    const envoye =
      typeof navigator.sendBeacon === "function" &&
      navigator.sendBeacon("/api/mesure", new Blob([charge], { type: "application/json" }));

    if (!envoye) {
      void fetch("/api/mesure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: charge,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Volontairement silencieux : voir l'en-tête.
  }
}
