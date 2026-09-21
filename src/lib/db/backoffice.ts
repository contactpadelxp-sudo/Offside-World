import "server-only";
import { base, baseConfiguree } from "@/lib/supabase/server";
import { heure, heuresAvant, jourISO, jourLisible, jourLisibleCap } from "@/lib/temps";
import { lireOptions } from "@/lib/db/referentiel";
import { VIE_SESSION_STRIPE_MINUTES } from "@/lib/db/paiements";
import { partRemboursee } from "@/data/reglement";
import { BUBBLE_EN_LIGNE } from "@/data/bubble-team";
import { lignesDepuisJson } from "@/lib/devis";
import { decrireAction, lienJournal } from "@/lib/journal";
import type { Database } from "@/lib/supabase/types";
type TypeActivite = Database["public"]["Enums"]["type_activite"];
import type { RecapEmail } from "@/lib/email/modeles";
import type {
  CreneauAdmin,
  DevisAdmin,
  EntreeJournal,
  FiltreReservations,
  ReservationAdmin,
  StatutDevis,
} from "@/lib/vues";

export type * from "@/lib/vues";

/**
 * Lectures du back-office.
 *
 * Tout ce qui sort d'ici contient des données personnelles — dont des données
 * de mineurs et de santé. L'accès est fermé par la session vérifiée dans le
 * gabarit du back-office, et les pages ne sont ni mises en cache ni indexables.
 *
 * UNE LISTE VIDE NE VEUT PLUS DIRE « TOUT VA BIEN ».
 *
 * Six lectures attrapaient leur erreur, l'écrivaient dans la console du
 * serveur — que personne ne lit — et rendaient `[]`. L'écran affichait alors
 * « Aucune réservation », exactement comme un samedi matin sans client. Un
 * délai dépassé sur la vue `reservations_detaillees`, un droit retiré, une
 * coupure passagère : Brahim n'avait aucun moyen de faire la différence entre
 * une journée calme et une base qui ne répond plus.
 *
 * L'écran qu'il fallait existait déjà et ne s'affichait jamais :
 * `(protege)/error.tsx` dit « Rien n'a été modifié. Réessayez : si l'erreur
 * persiste, la base de données est probablement injoignable », et propose de
 * recommencer sans perdre la session. Il ne manquait que de laisser l'erreur
 * monter jusqu'à lui.
 *
 * `if (error) throw error;` PUIS `if (!data) return [];` — dans cet ordre, et
 * jamais les deux dans la même condition. Une erreur est une panne, une
 * absence de données est une réponse : les confondre est précisément ce qui
 * produisait le faux calme. C'est la conversion déjà appliquée à
 * `db/creneaux.ts` et `db/referentiel.ts`, terminée ici.
 *
 * Les compteurs du gabarit (`compterAConfirmer`, `compterDevisANouveau`) et
 * `horizonParActivite` ne suivent PAS cette règle, et c'est délibéré. La
 * documentation de Next est explicite : `error.js` « does not wrap the
 * layout.js or template.js above it in the same segment »
 * (`03-file-conventions/error.md`). Une erreur levée dans le gabarit du
 * back-office échapperait donc à son propre écran d'erreur et remonterait
 * jusqu'à la racine — plus de barre de navigation, plus de session visible,
 * tout le back-office par terre pour une pastille. Ces trois-là dégradent
 * donc : la pastille se tait, la bannière dit qu'elle n'a pas pu vérifier.
 *
 * La liste, elle, échoue bruyamment — et c'est elle qui fait foi.
 */


/**
 * Nettoie un terme de recherche avant de le passer à PostgREST.
 *
 * La syntaxe `or=(...)` utilise la virgule et les parenthèses comme
 * séparateurs : les laisser passer permettrait de réécrire le filtre. On ne
 * garde donc que ce qui peut réellement figurer dans une référence, un nom, un
 * e-mail ou un numéro.
 */
function termeRecherche(q: string): string {
  return q
    .normalize("NFC")
    .replace(/[^\p{L}\p{N} @._+-]/gu, " ")
    .trim()
    .slice(0, 80);
}

/**
 * Classe « expirées » les demandes jamais confirmées dont la date est passée.
 *
 * Appelée avant de lire, et non par une tâche planifiée : le back-office est le
 * seul endroit où ces réservations se voient, donc les mettre à jour au moment
 * de les afficher suffit, et évite d'ajouter un `cron` à maintenir.
 *
 * Une réservation « en attente » dont la date est passée est un état mort :
 * rien ne peut plus la faire aboutir, et la confirmer enverrait au client
 * « votre réservation du 3 septembre est confirmée » le 15. Aucun e-mail n'est
 * envoyé au passage — prévenir quelqu'un qu'une demande a expiré des jours
 * après la date ne lui apprend rien.
 *
 * Les réservations réellement payées ne sont jamais touchées : voir la
 * migration 0018, c'est la précaution qui compte.
 *
 * Un échec ne fait pas échouer la lecture : mieux vaut afficher la liste avec
 * un statut périmé que de ne rien afficher du tout.
 */
async function expirerReservationsPassees(): Promise<void> {
  const { error } = await base().rpc("expirer_reservations_passees");
  if (error) console.error("Expiration des réservations passées impossible :", error.message);
}

/**
 * Réservations, filtrées selon ce que le back-office affiche.
 *
 * Une recherche l'emporte sur le filtre : quand on cherche une référence, on
 * veut la trouver qu'elle soit à venir, passée ou annulée.
 */
export async function lireReservations(
  filtre: FiltreReservations,
  recherche?: string
): Promise<ReservationAdmin[]> {
  if (!baseConfiguree()) return [];

  await expirerReservationsPassees();

  const maintenant = new Date();
  let requete = base().from("reservations_detaillees").select("*");

  const terme = recherche ? termeRecherche(recherche) : "";
  if (terme) {
    const motif = `*${terme}*`;
    requete = requete
      .or(
        [
          `reference.ilike.${motif}`,
          `client_nom.ilike.${motif}`,
          `client_email.ilike.${motif}`,
          `client_telephone.ilike.${motif}`,
          `enfant_prenom.ilike.${motif}`,
        ].join(",")
      )
      .order("debut", { ascending: false })
      .limit(50);
    const { data, error } = await requete;
    if (error) throw error;
    if (!data) return [];
    return construire(
      data,
      await lireOptions(false),
      await lirePaiements(data, maintenant),
      maintenant
    );
  }

  switch (filtre) {
    case "a-venir":
      requete = requete
        .in("statut", ["en_attente", "confirmee"])
        .gte("debut", maintenant.toISOString())
        .order("debut");
      break;
    case "a-confirmer":
      requete = requete
        .eq("statut", "en_attente")
        .gte("debut", maintenant.toISOString())
        .order("debut");
      break;
    case "passees":
      requete = requete
        .in("statut", ["en_attente", "confirmee"])
        .lt("debut", maintenant.toISOString())
        .order("debut", { ascending: false })
        .limit(100);
      break;
    case "annulees":
      requete = requete
        .in("statut", ["annulee", "expiree"])
        .order("debut", { ascending: false })
        .limit(100);
      break;
  }

  // `false` : y compris les extras retirés de la vente, pour que la fiche
  // d'une ancienne réservation continue de nommer ce qui a été commandé.
  const [{ data, error }, options] = await Promise.all([requete, lireOptions(false)]);

  if (error) throw error;
  if (!data) return [];

  return construire(data, options, await lirePaiements(data, maintenant), maintenant);
}

type LigneReservation = Database["public"]["Views"]["reservations_detaillees"]["Row"];

interface PaiementLu {
  montantCents: number;
  rembourseCents: number;
}

interface PaiementsLus {
  /** Ce qui a été réellement encaissé, par réservation. */
  payes: Map<string, PaiementLu>;
  /** Les réservations dont une session Stripe est ouverte en ce moment. */
  enCours: Set<string>;
}

/**
 * Durée de vie d'une session Stripe, en millisecondes.
 *
 * Passé ce délai la page de paiement est morte : une ligne restée « en_cours »
 * ne signale plus un client devant son clavier, mais une tentative abandonnée.
 * Sans cette borne, un panier abandonné gèlerait la fiche pour toujours. La
 * minute exacte vient de `db/paiements.ts`, qui la partage avec l'`expires_at`
 * réellement envoyé à Stripe.
 */
const VIE_SESSION_STRIPE_MS = VIE_SESSION_STRIPE_MINUTES * 60 * 1000;

/**
 * Les paiements des réservations affichées, en une requête.
 *
 * UNE REQUÊTE POUR LA PAGE, PAS UNE PAR LIGNE. La vue `reservations_detaillees`
 * ne porte pas le paiement, et l'y ajouter aurait demandé de la recréer — donc
 * une migration, sur une vue dont dépend déjà tout le back-office. Un `in (…)`
 * sur les identifiants déjà en main coûte moins cher, en travail comme en
 * risque.
 *
 * ON LIT AUSSI « en_cours », ET C'EST LE POINT.
 *
 * La lecture ne ramenait que l'argent encaissé. Entre le clic sur « Payer » et
 * le webhook — jusqu'à 30 minutes avec Bancontact —, la fiche affichait donc
 * « non payé » et offrait « Confirmer » et « Annuler » sur une réservation
 * qu'un client était en train de régler. Les deux gestes cassent quelque
 * chose : voir `ReservationAdmin.paiementEnCours`.
 *
 * Un encaissement l'emporte toujours sur une tentative : une réservation
 * repayée après un premier abandon porte les deux lignes, et c'est la réussie
 * qui décrit son état.
 */
async function lirePaiements(
  lignes: LigneReservation[],
  maintenant: Date
): Promise<PaiementsLus> {
  const ids = lignes.map((l) => l.id).filter((id): id is string => Boolean(id));
  const lus: PaiementsLus = { payes: new Map(), enCours: new Set() };
  if (ids.length === 0) return lus;

  const { data, error } = await base()
    .from("paiements")
    .select("reservation_id, montant_cents, montant_rembourse_cents, statut, created_at")
    .in("reservation_id", ids)
    .in("statut", ["reussi", "rembourse", "partiellement_rembourse", "en_cours"]);

  if (error || !data) {
    // Un échec ici ne doit pas vider la liste des réservations : on affiche
    // les fiches sans leur volet paiement, et l'annulation ne proposera pas de
    // remboursement — le plus prudent des deux comportements.
    console.error("Lecture des paiements impossible :", error?.message);
    return lus;
  }

  const limite = maintenant.getTime() - VIE_SESSION_STRIPE_MS;
  for (const p of data) {
    if (p.statut === "en_cours") {
      if (new Date(p.created_at).getTime() >= limite) lus.enCours.add(p.reservation_id);
      continue;
    }
    lus.payes.set(p.reservation_id, {
      montantCents: p.montant_cents,
      rembourseCents: p.montant_rembourse_cents,
    });
  }
  // Payé bat « en train de payer » : la seconde tentative a abouti, ou la
  // première ligne n'a jamais été refermée.
  for (const id of lus.payes.keys()) lus.enCours.delete(id);
  return lus;
}

/** Traduit les lignes de la vue en fiches affichables. */
function construire(
  data: LigneReservation[],
  options: { id: string; libelle: string }[],
  paiements: PaiementsLus,
  maintenant: Date
): ReservationAdmin[] {
  const libelles = new Map(options.map((o) => [o.id, o.libelle]));

  const sortie: ReservationAdmin[] = [];
  for (const r of data) {
    // Les colonnes d'une vue sont typées « nullable » : on écarte les lignes
    // dont l'ossature manque plutôt que d'afficher des trous.
    if (!r.id || !r.reference || !r.type || !r.statut || !r.debut || !r.fin) continue;
    const debut = new Date(r.debut);
    const paye = paiements.payes.get(r.id);
    sortie.push({
      id: r.id,
      reference: r.reference,
      type: r.type,
      statut: r.statut,
      total: (r.total_cents ?? 0) / 100,
      formuleNom: r.formule_nom,
      nbEnfants: r.nb_enfants,
      enfantPrenom: r.enfant_prenom,
      enfantAge: r.enfant_age,
      nbPersonnes: r.nb_personnes,
      options: (r.options_ids ?? []).map((id) => libelles.get(id) ?? id),
      clientNom: r.client_nom ?? "",
      clientEmail: r.client_email ?? "",
      clientTelephone: r.client_telephone ?? "",
      allergies: r.allergies,
      remarques: r.remarques,
      noteInterne: r.note_interne,
      jour: jourISO(debut),
      jourLabel: jourLisibleCap(debut),
      debut: heure(debut),
      fin: heure(new Date(r.fin)),
      espaceNom: r.espace_nom,
      passee: debut < maintenant,
      paiement: paye
        ? {
            montantCents: paye.montantCents,
            rembourseCents: paye.rembourseCents,
            // Calculé côté serveur et affiché tel quel : le back-office montre
            // le montant, il ne le décide pas. L'action le recalcule de son
            // côté avant d'envoyer quoi que ce soit chez Stripe.
            baremeCents: Math.min(
              Math.round(
                paye.montantCents *
                  // Même fonction que l'action qui rembourse pour de vrai :
                  // le montant montré et le montant envoyé ne peuvent pas
                  // diverger. Voir `heuresAvant` dans `lib/temps.ts`.
                  partRemboursee(heuresAvant(debut, maintenant))
              ),
              paye.montantCents - paye.rembourseCents
            ),
          }
        : null,
      paiementEnCours: paiements.enCours.has(r.id),
    });
  }
  return sortie;
}

/** Nombre de réservations encore à confirmer — sert la pastille de navigation. */
export async function compterAConfirmer(): Promise<number> {
  if (!baseConfiguree()) return 0;
  // On ne compte que les réservations à venir : la pastille doit correspondre
  // exactement à ce que montre le filtre « À confirmer ». Une réservation
  // passée et jamais confirmée sera de toute façon expirée par le serveur.
  const { count, error } = await base()
    .from("reservations_detaillees")
    .select("id", { count: "exact", head: true })
    .eq("statut", "en_attente")
    .gte("debut", new Date().toISOString());
  if (error) return 0;
  return count ?? 0;
}

export async function lireDevis(inclureTraites = false): Promise<DevisAdmin[]> {
  if (!baseConfiguree()) return [];

  const statuts: StatutDevis[] = inclureTraites
    ? ["nouvelle", "traitee", "devis_envoye", "acceptee", "refusee"]
    : ["nouvelle", "traitee", "devis_envoye"];

  const { data, error } = await base()
    .from("demandes_devis")
    .select("*")
    .in("statut", statuts)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  if (!data) return [];

  return data.map((d) => ({
    id: d.id,
    reference: d.reference,
    entreprise: d.entreprise,
    contactNom: d.contact_nom,
    contactEmail: d.contact_email,
    contactTelephone: d.contact_telephone,
    dateSouhaitee: d.date_souhaitee ? jourLisibleCap(new Date(`${d.date_souhaitee}T12:00:00Z`)) : null,
    periode: d.periode === "matin" ? "Matin" : d.periode === "apres-midi" ? "Après-midi" : null,
    nbParticipants: d.nb_participants,
    message: d.message,
    noteInterne: d.note_interne,
    statut: d.statut,
    recuLe: jourLisible(new Date(d.created_at)),
    devis: {
      lignes: lignesDepuisJson(d.devis_lignes),
      message: d.devis_message ?? "",
      validite: d.devis_validite ?? "",
      envoyeLe: d.devis_envoye_le ? jourLisible(new Date(d.devis_envoye_le)) : null,
      tvaPourcent: d.devis_tva_pourcent,
    },
    client: { adresse: d.client_adresse ?? "", tva: d.client_tva ?? "" },
    brut: {
      dateSouhaitee: d.date_souhaitee
        ? jourLisibleCap(new Date(`${d.date_souhaitee}T12:00:00Z`))
        : null,
      periode: d.periode === "matin" ? "le matin" : d.periode === "apres-midi" ? "l'après-midi" : null,
      nbParticipants: d.nb_participants,
    },
  }));
}

export async function compterDevisANouveau(): Promise<number> {
  if (!baseConfiguree()) return 0;
  const { count, error } = await base()
    .from("demandes_devis")
    .select("id", { count: "exact", head: true })
    .eq("statut", "nouvelle");
  if (error) return 0;
  return count ?? 0;
}

/**
 * Créneaux d'une journée, ouverts comme fermés, avec l'indication de ceux qui
 * portent déjà une réservation active — c'est ce qui interdit de les fermer.
 */
export async function lireCreneauxDuJour(jour: string): Promise<CreneauAdmin[]> {
  if (!baseConfiguree()) return [];

  // Bornes de la journée en heure de Bruxelles, converties en instants.
  const debutJour = new Date(`${jour}T00:00:00`);
  const finJour = new Date(`${jour}T23:59:59.999`);

  const { data, error } = await base()
    .from("creneaux")
    .select("id, type, espace_id, debut, fin, ouvert, espaces(nom)")
    .gte("debut", debutJour.toISOString())
    .lte("debut", finJour.toISOString())
    .order("debut");

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const { data: prises } = await base()
    .from("reservations")
    .select("creneau_id, reference")
    .in("statut", ["en_attente", "confirmee"])
    .in(
      "creneau_id",
      data.map((c) => c.id)
    );

  const parCreneau = new Map((prises ?? []).map((r) => [r.creneau_id, r.reference]));

  return data.map((c) => {
    const debut = new Date(c.debut);
    return {
      id: c.id,
      type: c.type,
      espaceNom: c.espaces?.nom ?? c.espace_id,
      jour: jourISO(debut),
      jourLabel: jourLisibleCap(debut),
      debut: heure(debut),
      fin: heure(new Date(c.fin)),
      ouvert: c.ouvert,
      reservePar: parCreneau.get(c.id) ?? null,
    };
  });
}

/** Journal des actions du back-office, les plus récentes d'abord. */
export async function lireJournal(limite = 150): Promise<EntreeJournal[]> {
  if (!baseConfiguree()) return [];

  const { data, error } = await base()
    .from("journal_admin")
    .select("id, acteur, action, cible, detail, created_at")
    .order("created_at", { ascending: false })
    .limit(limite);

  if (error) throw error;
  if (!data) return [];

  return data.map((e) => {
    const quand = new Date(e.created_at);
    return {
      id: e.id,
      acteur: e.acteur,
      action: e.action,
      ...decrireAction(e.action, e.detail),
      cible: e.cible,
      lien: lienJournal(e.action, e.cible),
      jourLabel: jourLisibleCap(quand),
      heure: heure(quand),
    };
  });
}

/**
 * Récapitulatif d'une réservation destiné à un e-mail.
 *
 * Relu depuis la base après une modification : l'action ne dispose que de
 * l'identifiant, et il faut l'horaire, l'espace et la formule pour écrire un
 * message compréhensible. Le contenu des allergies n'est PAS transmis — seul
 * un indicateur l'est, le détail restant dans le back-office.
 *
 * LE PAIEMENT EST RELU ICI, ET NON PASSÉ PAR L'APPELANT. Le même e-mail de
 * confirmation part de deux endroits : le webhook Stripe, où le client vient
 * de payer, et le back-office, où l'exploitant confirme une réservation dont
 * le règlement a été convenu autrement. Un drapeau transmis par l'appelant
 * aurait fini par mentir dans l'un des deux cas ; la base, elle, sait
 * laquelle des deux situations on est en train de vivre.
 */
export async function lireRecapEmail(id: string): Promise<RecapEmail | null> {
  if (!baseConfiguree()) return null;

  const [{ data, error }, options, paiement] = await Promise.all([
    base().from("reservations_detaillees").select("*").eq("id", id).maybeSingle(),
    lireOptions(),
    base()
      .from("paiements")
      .select("montant_cents, montant_rembourse_cents, methode")
      .eq("reservation_id", id)
      // « rembourse » et « partiellement_rembourse » sont inclus : l'e-mail
      // d'annulation doit justement pouvoir dire ce qui a été rendu.
      .in("statut", ["reussi", "rembourse", "partiellement_rembourse"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (error || !data || !data.reference || !data.type || !data.debut || !data.fin) return null;

  const libelles = new Map(options.map((o) => [o.id, o.libelle]));
  const debut = new Date(data.debut);

  return {
    reference: data.reference,
    activite:
      data.type === "anniversaire"
        ? `Anniversaire — formule ${data.formule_nom ?? ""}`.trim()
        : "Bubble Foot",
    detail:
      data.type === "anniversaire"
        ? `${data.nb_enfants ?? "?"} enfants${
            data.enfant_prenom
              ? ` — ${data.enfant_prenom}${data.enfant_age ? `, ${data.enfant_age} ans` : ""}`
              : ""
          }`
        : `${data.nb_personnes ?? "?"} personnes`,
    jourLabel: jourLisibleCap(debut),
    debut: heure(debut),
    fin: heure(new Date(data.fin)),
    espaceNom: data.espace_nom,
    totalCents: data.total_cents ?? 0,
    clientNom: data.client_nom ?? "",
    clientEmail: data.client_email ?? "",
    clientTelephone: data.client_telephone ?? "",
    options: (data.options_ids ?? []).map((o) => libelles.get(o) ?? o),
    allergieSignalee: Boolean(data.allergies),
    remarques: data.remarques,
    paiement: paiement.data
      ? {
          montantCents: paiement.data.montant_cents,
          rembourseCents: paiement.data.montant_rembourse_cents,
          methode: LIBELLES_MOYEN_PAIEMENT[paiement.data.methode ?? ""] ?? null,
        }
      : null,
  };
}

/**
 * Le moyen de paiement écrit comme le client le connaît.
 *
 * Stripe renvoie ses propres identifiants (`bancontact`, `card`). Les recopier
 * tels quels donnerait « Payé par card » dans un e-mail français.
 */
const LIBELLES_MOYEN_PAIEMENT: Record<string, string> = {
  bancontact: "Bancontact",
  card: "carte bancaire",
};

/**
 * Dans combien de jours chaque activité cesse-t-elle d'être vendable ?
 *
 * POURQUOI CETTE FONCTION EXISTE. Les créneaux sont générés par lots, à la
 * main, depuis « Ouvrir une période ». Rien ne les prolonge tout seul — c'est
 * un choix assumé (voir la migration 0010), mais il a un défaut : le jour où
 * le dernier créneau est passé, la page de réservation n'affiche plus rien.
 * Aucune erreur, aucune alerte : juste un tunnel vide, et des clients qui
 * repartent.
 *
 * POURQUOI ELLE COMPTE PAR ACTIVITÉ, ET NON EN BLOC. Elle regardait le dernier
 * créneau toutes activités confondues. Avec 943 créneaux d'anniversaire ouverts
 * jusqu'en mars 2027, elle restait donc éteinte — pendant que le Bubble Foot
 * était à ZÉRO créneau et invendable depuis le premier jour. Une activité
 * entière ne se vendait pas, et l'écran conçu pour le dire affichait le calme.
 * Un total ne dit jamais qu'une part est vide.
 *
 * TROIS FILTRES, ET AUCUN N'EST DÉCORATIF. On lit `creneaux_disponibles`, pas
 * `creneaux` : la vue écarte déjà les créneaux fermés et les espaces inactifs.
 * On y ajoute `libre` — un créneau déjà réservé ne se vend plus — et le fait
 * qu'il soit à venir. Sans ces trois conditions, la dernière date trouvée peut
 * être celle d'un créneau que personne ne peut acheter.
 *
 * `jours` vaut `null` quand l'activité n'a plus rien à vendre du tout. C'est
 * un cas distinct de « il reste trois jours », et l'appelant ne doit pas les
 * confondre : l'un est une alerte, l'autre est une panne.
 */
export type HorizonActivite = {
  type: TypeActivite;
  libelle: string;
  /** Jours avant le dernier créneau vendable, ou `null` s'il n'y en a aucun. */
  jours: number | null;
};

/*
  ON N'ALERTE QUE SUR CE QUE LE SITE VEND.

  Le Bubble Foot se réserve sur Sport-Finder depuis le 21 septembre 2026 — voir
  `BUBBLE_EN_LIGNE`. Le laisser dans cette liste ferait s'allumer la bannière
  rouge « le Bubble Foot ne se vend pas, aucun créneau disponible » à chaque
  ouverture du back-office, pour toujours et à juste titre : il n'y a aucun
  créneau, et il n'y en aura pas.

  Une alerte qui a raison mais qu'on ne peut pas éteindre est pire qu'une
  alerte absente : on apprend à passer devant sans lire, et le jour où elle dit
  autre chose, personne ne le voit. C'est exactement ce qu'on vient de corriger
  en la rendant sensible par activité.

  Elle revient d'elle-même si le Bubble repasse en vente sur le site.
*/
const LIBELLES_ACTIVITE: Record<TypeActivite, string> = {
  anniversaire: "Anniversaires",
  bubble: "Bubble Foot",
};

const VENDUES_EN_LIGNE: TypeActivite[] = (
  Object.keys(LIBELLES_ACTIVITE) as TypeActivite[]
).filter((t) => t !== "bubble" || BUBBLE_EN_LIGNE);

export async function horizonParActivite(): Promise<HorizonActivite[] | null> {
  if (!baseConfiguree()) return null;

  const maintenant = new Date().toISOString();
  const types = VENDUES_EN_LIGNE;

  /*
    `null` SIGNIFIE « JE NE SAIS PAS », ET C'EST UN TROISIÈME ÉTAT.

    Il y a trois situations à distinguer, pas deux : l'activité se vend, elle
    ne se vend plus, ou l'on n'a pas pu le savoir. Laisser une requête ratée
    ressembler au premier cas éteindrait l'alerte au pire moment ; la laisser
    remonter ferait tomber tout le back-office pour une bannière. On renvoie
    donc `null`, et l'appelant le dit.
  */
  try {
    return await lignesParType(types, maintenant);
  } catch (e) {
    console.error("Horizon des créneaux illisible :", e);
    return null;
  }
}

async function lignesParType(
  types: TypeActivite[],
  maintenant: string
): Promise<HorizonActivite[]> {
  return Promise.all(
    types.map(async (type) => {
      const { data, error } = await base()
        .from("creneaux_disponibles")
        .select("debut")
        .eq("type", type)
        .eq("libre", true)
        .gt("debut", maintenant)
        .order("debut", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Une erreur n'est PAS « aucun créneau » : la remonter évite d'annoncer
      // une panne de vente là où il n'y a qu'une requête ratée.
      if (error) throw error;

      // Les colonnes d'une vue sont typées nullables : Postgres ne garantit
      // pas le contraire à travers une jointure. Une date absente se traite
      // comme une absence de créneau, pas comme une date à zéro.
      const debut = data?.debut ?? null;
      return {
        type,
        libelle: LIBELLES_ACTIVITE[type],
        jours: debut ? Math.floor((new Date(debut).getTime() - Date.now()) / 86_400_000) : null,
      };
    })
  );
}

/**
 * Les espaces de jeu, pour alimenter le choix à la création d'un créneau.
 *
 * Lus en base et non écrits en dur. Ils s'appelaient « Espace anniversaire 1 »
 * et « 2 » faute de connaître les vrais noms ; ce sont désormais les trois
 * « Fun zone », communiquées le 17 septembre 2026. Le formulaire a suivi sans
 * qu'on y retouche — c'est précisément ce que cette lecture en base achète.
 */
export async function lireEspaces(): Promise<{ id: string; nom: string }[]> {
  if (!baseConfiguree()) return [];
  const { data, error } = await base()
    .from("espaces")
    .select("id, nom")
    .eq("actif", true)
    .order("nom");
  if (error) throw error;
  if (!data) return [];
  return data;
}
