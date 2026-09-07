import { after } from "next/server";
import { autoriser } from "@/lib/limiteur";
import { enregistrerEvenement, type Appareil } from "@/lib/db/audience";

/**
 * Point de collecte de la mesure d'audience.
 *
 * Un Route Handler et non une Server Action : le navigateur doit pouvoir
 * appeler ce point avec `sendBeacon()` au moment où l'onglet se ferme, ce
 * qu'une Server Action ne permet pas.
 *
 * Trois principes tiennent tout le fichier :
 *
 * 1. RIEN NE DOIT RALENTIR LE VISITEUR. On répond 204 immédiatement et
 *    l'écriture part dans `after()`, donc après la réponse. Le visiteur
 *    n'attend jamais la base.
 * 2. RIEN NE DOIT CASSER. Une erreur ici est avalée : une mesure d'audience
 *    qui fait échouer une page serait un très mauvais échange.
 * 3. RIEN DE PLUS QUE LE NÉCESSAIRE N'EST LU. L'adresse IP sert à limiter le
 *    débit et à déduire le pays via l'en-tête de Vercel — elle n'est jamais
 *    écrite, ni brute ni hachée.
 */

export const runtime = "nodejs";

const APPAREILS = new Set<Appareil>(["mobile", "tablette", "ordinateur"]);
const NOMS_AUTORISES = new Set([
  "page",
  "activite",
  "formule",
  "creneau",
  "formulaire",
  "reservation",
  "devis",
]);

/** Adresse de l'appelant, pour le seul compteur de débit. Jamais conservée. */
function appelant(req: Request): string {
  const transmise = req.headers.get("x-forwarded-for");
  return transmise?.split(",")[0]?.trim() || "inconnu";
}

function texte(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

export async function POST(req: Request) {
  // 60 événements par minute et par adresse : très au-dessus d'une navigation
  // humaine — une page en envoie deux ou trois — et bien en dessous de ce
  // qu'un script pourrait injecter.
  if (!autoriser(`mesure:${appelant(req)}`, 60, 60_000)) {
    return new Response(null, { status: 429 });
  }

  let corps: unknown;
  try {
    corps = await req.json();
  } catch {
    return new Response(null, { status: 204 });
  }

  const c = corps as Record<string, unknown>;

  // Le consentement est vérifié côté navigateur avant l'envoi ; on le
  // redemande ici parce qu'une vérification faite uniquement côté client
  // n'en est pas une.
  if (c.consentement !== true) return new Response(null, { status: 204 });

  const session = texte(c.session, 64);
  const nom = texte(c.nom, 40);
  if (!session || session.length < 8 || !nom || !NOMS_AUTORISES.has(nom)) {
    return new Response(null, { status: 204 });
  }

  const appareil = texte(c.appareil, 20) as Appareil | null;
  const pays = req.headers.get("x-vercel-ip-country");

  // Répond tout de suite ; l'écriture se fait après la réponse.
  after(async () => {
    await enregistrerEvenement({
      session,
      nom,
      chemin: texte(c.chemin, 200),
      detail: texte(c.detail, 120),
      provenance: texte(c.provenance, 120),
      appareil: appareil && APPAREILS.has(appareil) ? appareil : null,
      pays: pays && /^[A-Z]{2}$/.test(pays) ? pays : null,
      langue: texte(c.langue, 12),
    });
  });

  return new Response(null, { status: 204 });
}
