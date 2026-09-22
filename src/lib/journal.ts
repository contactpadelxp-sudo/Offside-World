import { jourLisibleCap } from "@/lib/temps";
import { montantLisible } from "@/lib/tarification";
import type { FamilleJournal } from "@/lib/vues";

/**
 * Comment se lit une ligne du journal du back-office.
 *
 * Séparé de la couche base pour une raison précise : c'est ici que se décide ce
 * que l'exploitant lit réellement, et ça se teste sans toucher à Supabase.
 * `backoffice.ts` est marqué `server-only` et importe le client de base — un
 * test qui voudrait vérifier que « 18000 » devient « 180,00 € » devrait
 * démarrer une connexion pour y arriver.
 */

/**
 * CE QU'EST CHAQUE ACTION, ET CE QU'IL FAUT EN MONTRER.
 *
 * Une seule table plutôt que trois : le libellé, la famille et la façon de lire
 * le détail se décidaient à trois endroits différents, et deux actions
 * distinctes — `reservation.note` et `devis.note` — portaient le même libellé
 * « Note interne modifiée », sans rien pour dire de quoi on parlait.
 */
const ACTIONS: Record<
  string,
  {
    libelle: string;
    famille: FamilleJournal;
    /** Met le détail JSON en français. Rien à dire : `null`. */
    precision?: (d: Record<string, unknown>) => string | null;
  }
> = {
  connexion: { libelle: "Connexion", famille: "acces" },
  deconnexion: { libelle: "Déconnexion", famille: "acces" },
  "email.test": { libelle: "E-mail de test envoyé", famille: "acces" },

  "reservation.confirmee": { libelle: "Réservation confirmée", famille: "reservations" },
  "reservation.annulee": {
    libelle: "Réservation annulée",
    famille: "reservations",
    // Ce que l'annulation a rendu au client : la seule chose qui distingue
    // deux annulations, et elle n'était pas affichée.
    precision: (d) => REMBOURSEMENTS[String(d.remboursement)] ?? null,
  },
  "reservation.note": { libelle: "Note interne d’une réservation", famille: "reservations" },
  "reservation.effacee": {
    libelle: "Données personnelles effacées",
    famille: "reservations",
    // C'est la trace qui prouve qu'une demande d'effacement a été honorée, et
    // quand. L'article 12.3 du RGPD donne un mois pour répondre : il faut
    // pouvoir montrer la date.
    precision: (d) => (d.motif ? String(d.motif) : null),
  },
  "paiement.rembourse": {
    libelle: "Remboursement effectué",
    famille: "reservations",
    precision: (d) => {
      const c = Number(d.montant_cents);
      return Number.isFinite(c) ? montantLisible(c) : (REMBOURSEMENTS[String(d.remboursement)] ?? null);
    },
  },

  "devis.enregistre": { libelle: "Devis enregistré", famille: "devis" },
  "devis.envoye": {
    libelle: "Devis envoyé au client",
    famille: "devis",
    precision: (d) => {
      const c = Number(d.montant_cents);
      return Number.isFinite(c) ? montantLisible(c) : null;
    },
  },
  "devis.statut": {
    libelle: "Statut du devis",
    famille: "devis",
    precision: (d) => LIBELLES_STATUT_DEVIS[String(d.statut)] ?? null,
  },
  "devis.note": { libelle: "Note interne d’un devis", famille: "devis" },

  "creneau.cree": { libelle: "Créneau ajouté", famille: "catalogue" },
  "creneau.supprime": { libelle: "Créneau supprimé", famille: "catalogue" },
  "creneau.ouvert": { libelle: "Créneau rouvert", famille: "catalogue" },
  "creneau.ferme": { libelle: "Créneau fermé", famille: "catalogue" },
  "creneaux.journee_fermee": {
    libelle: "Journée fermée",
    famille: "catalogue",
    precision: (d) => precisionJournee(d),
  },
  "creneaux.journee_ouverte": {
    libelle: "Journée rouverte",
    famille: "catalogue",
    precision: (d) => precisionJournee(d),
  },
  "creneaux.generes": {
    libelle: "Créneaux générés",
    famille: "catalogue",
    precision: (d) => {
      const n = Number(d.crees);
      return Number.isFinite(n) ? `${n} créé${n > 1 ? "s" : ""}` : null;
    },
  },
  "formule.modifiee": {
    libelle: "Formule modifiée",
    famille: "catalogue",
    precision: (d) => {
      const bouts: string[] = [];
      const base = Number(d.prix_base_cents);
      if (Number.isFinite(base)) bouts.push(montantLisible(base));
      if (d.actif === false) bouts.push("retirée du site");
      if (d.actif === true) bouts.push("proposée sur le site");
      return bouts.join(" · ") || null;
    },
  },
  "option.modifiee": {
    libelle: "Option modifiée",
    famille: "catalogue",
    precision: (d) => {
      const c = Number(d.prix_cents);
      return Number.isFinite(c) ? montantLisible(c) : null;
    },
  },
  "article.cree": { libelle: "Article de blog créé", famille: "catalogue" },
  "article.enregistre": { libelle: "Article de blog enregistré", famille: "catalogue" },
  "article.publie": {
    libelle: "Article de blog publié",
    famille: "catalogue",
    precision: (d) => (d.publie === false ? "remis en brouillon" : null),
  },
  "article.supprime": { libelle: "Article de blog supprimé", famille: "catalogue" },
  "article.image": { libelle: "Image d’article envoyée", famille: "catalogue" },
};

/**
 * « Journée fermée » sans dire laquelle ne sert à rien : c'est justement
 * l'écran qu'on rouvre quand un client affirme que son créneau existait.
 *
 * Le jour est stocké au format ISO dans le détail de l'action ; on le rend
 * lisible, et on ajoute le nombre de créneaux touchés quand il est connu.
 */
function precisionJournee(d: Record<string, unknown>): string | null {
  const brut = typeof d.jour === "string" ? d.jour : null;
  if (!brut || !/^\d{4}-\d{2}-\d{2}$/.test(brut)) return null;
  const date = new Date(`${brut}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;

  const bouts = [jourLisibleCap(date)];
  const n = Number(d.creneaux);
  if (Number.isFinite(n) && n > 0) bouts.push(`${n} créneau${n > 1 ? "x" : ""}`);
  return bouts.join(" · ");
}

const REMBOURSEMENTS: Record<string, string> = {
  aucun: "sans remboursement",
  integral: "remboursement intégral",
  bareme: "remboursement selon le barème",
};

const LIBELLES_STATUT_DEVIS: Record<string, string> = {
  nouvelle: "remis en « nouvelle »",
  traitee: "marqué traité",
  devis_envoye: "marqué envoyé",
  acceptee: "accepté par le client",
  refusee: "refusé par le client",
};

/**
 * Vers quoi pointer depuis une entrée du journal, quand c'est possible.
 *
 * Les réservations tombent juste : la recherche du back-office trouve une
 * référence quel que soit l'onglet, le lien mène donc exactement à la bonne
 * fiche.
 *
 * Les devis n'ont pas de recherche. `toutes=1` est le seul lien qui garantisse
 * que la demande soit bien PRÉSENTE sur la page d'arrivée : la liste par défaut
 * masque les demandes déjà traitées, et la plupart des lignes du journal en
 * concernent une. Un lien qui mène à une page où la cible n'apparaît pas serait
 * pire que pas de lien du tout.
 *
 * Le reste — créneaux, formules, connexions — n'a pas de fiche à ouvrir : on ne
 * fabrique pas de lien pour faire joli.
 */
export function lienJournal(action: string, cible: string | null): string | null {
  if (!cible) return null;
  if (action.startsWith("reservation.") || action.startsWith("paiement.")) {
    return `/admin?q=${encodeURIComponent(cible)}`;
  }
  if (action.startsWith("devis.")) return "/admin/devis?toutes=1";
  return null;
}

/**
 * Tout ce qu'il faut afficher pour une entrée, à partir de la clé d'action et
 * du détail JSON brut lu en base.
 *
 * Une action inconnue garde sa clé pour libellé : c'est moins joli, mais un
 * journal qui masque ce qu'il ne sait pas nommer ne vaut plus rien — c'est une
 * trace d'accès à des données d'enfants, pas un fil d'actualité.
 */
export function decrireAction(
  action: string,
  detail: unknown
): { famille: FamilleJournal; libelle: string; precision: string | null } {
  const connue = ACTIONS[action];

  // Un détail qui n'est pas un objet JSON n'a rien à dire de lisible : mieux
  // vaut ne rien afficher que d'écrire « [object Object] ».
  const brut =
    detail && typeof detail === "object" && !Array.isArray(detail)
      ? (detail as Record<string, unknown>)
      : null;

  return {
    famille: connue?.famille ?? "acces",
    libelle: connue?.libelle ?? action,
    precision: brut && connue?.precision ? connue.precision(brut) : null,
  };
}
