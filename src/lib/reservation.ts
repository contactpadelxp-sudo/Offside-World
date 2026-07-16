/**
 * Handoff de réservation vers la page de confirmation SANS exposer de données
 * personnelles dans l'URL (le prénom d'un enfant, le total, etc. ne doivent pas
 * finir dans l'historique du navigateur, les logs serveur ni l'en-tête Referer).
 *
 * Maquette : on stocke le récap en sessionStorage et on ne passe qu'une référence
 * opaque dans l'URL. En production, ces détails seront récupérés côté serveur à
 * partir de la référence de réservation.
 */
export interface ReservationSummary {
  ref: string;
  type: string;
  total: number;
  formule?: string;
  enfant?: string;
}

const KEY = "ow_reservation";

function makeRef(): string {
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `OW-${rnd}`;
}

/** À appeler dans le gestionnaire de paiement. Retourne la référence à mettre dans l'URL. */
export function saveReservation(data: Omit<ReservationSummary, "ref">): string {
  const ref = makeRef();
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...data, ref }));
  } catch {
    /* sessionStorage indisponible : la confirmation affichera un récap générique */
  }
  return ref;
}

/** À appeler sur la page de confirmation. Renvoie le récap si la référence correspond. */
export function loadReservation(ref: string): ReservationSummary | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as ReservationSummary;
    return data.ref === ref ? data : null;
  } catch {
    return null;
  }
}
