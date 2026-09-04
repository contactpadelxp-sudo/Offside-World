/**
 * Passage de main vers la page de confirmation, SANS donnée personnelle dans
 * l'URL.
 *
 * Le prénom d'un enfant, le montant ou la formule n'ont rien à faire dans
 * l'historique du navigateur, les journaux du serveur ni l'en-tête Referer
 * envoyé aux tiers. Le récapitulatif est donc rangé en sessionStorage, et
 * l'URL ne transporte que la référence.
 *
 * La référence est celle attribuée par le serveur au moment d'écrire la
 * réservation : c'est elle qui figure en base, et c'est elle que le client
 * cite au complexe. Le stockage local n'en est qu'un affichage.
 */
export interface RecapReservation {
  ref: string;
  type: string;
  total: number;
  formule?: string;
  enfant?: string;
  /** « samedi 5 septembre » */
  date?: string;
  /** « 15:00 – 17:00 » */
  horaire?: string;
  /** Vrai pour une demande de devis : rien n'est à régler. */
  surDevis?: boolean;
}

const CLE = "ow_reservation";

/** À appeler après une écriture réussie, avec la référence renvoyée par le serveur. */
export function memoriserRecap(recap: RecapReservation): void {
  try {
    sessionStorage.setItem(CLE, JSON.stringify(recap));
  } catch {
    /* sessionStorage indisponible : la confirmation affichera un récap réduit */
  }
}

/** À appeler sur la page de confirmation. Renvoie le récap si la référence correspond. */
export function lireRecap(ref: string): RecapReservation | null {
  try {
    const brut = sessionStorage.getItem(CLE);
    if (!brut) return null;
    const recap = JSON.parse(brut) as RecapReservation;
    return recap.ref === ref ? recap : null;
  } catch {
    return null;
  }
}
