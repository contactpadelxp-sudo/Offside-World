import "server-only";

/**
 * Limitation de débit — protection de premier rideau, volontairement modeste.
 *
 * CE QUE ÇA FAIT : empêche un même client d'appeler une Server Action en
 * rafale (script naïf, formulaire relancé en boucle, robot de spam).
 *
 * CE QUE ÇA NE FAIT PAS : le compteur vit dans la mémoire de l'instance qui
 * traite la requête. Sur Vercel, plusieurs instances coexistent et sont
 * recyclées : un attaquant réparti sur assez de requêtes passera au travers, et
 * une attaque distribuée n'est pas concernée du tout. Une vraie limitation
 * suppose un compteur partagé (Vercel KV, Upstash) — à ajouter en même temps
 * que le paiement, quand un abus coûtera de l'argent.
 *
 * Ce n'est donc pas une sécurité forte : c'est ce qui évite qu'un accident ou
 * un script paresseux remplisse la base.
 */

interface Fenetre {
  debut: number;
  compte: number;
}

const compteurs = new Map<string, Fenetre>();

/** Au-delà, on vide les entrées périmées pour ne pas laisser la carte enfler. */
const SEUIL_NETTOYAGE = 5_000;

function nettoyer(maintenant: number, fenetreMs: number): void {
  for (const [cle, f] of compteurs) {
    if (maintenant - f.debut > fenetreMs) compteurs.delete(cle);
  }
}

/**
 * Retourne `true` si l'appel est autorisé, `false` s'il dépasse le quota.
 *
 * @param cle        identifiant de l'appelant (IP + nom de l'action)
 * @param max        nombre d'appels autorisés dans la fenêtre
 * @param fenetreMs  durée de la fenêtre
 */
export function autoriser(cle: string, max: number, fenetreMs: number): boolean {
  const maintenant = Date.now();

  if (compteurs.size > SEUIL_NETTOYAGE) nettoyer(maintenant, fenetreMs);

  const courante = compteurs.get(cle);
  if (!courante || maintenant - courante.debut > fenetreMs) {
    compteurs.set(cle, { debut: maintenant, compte: 1 });
    return true;
  }

  courante.compte += 1;
  return courante.compte <= max;
}
