/**
 * Bubble Foot et Team Building — regroupés sur une même offre « groupes ».
 *
 * Bubble Foot : tarif à la personne, à l'heure. Ses créneaux vivent en base
 * (table `creneaux`, type « bubble ») ; seul le tarif reste ici.
 * Team Building : privatisation à la demi-journée, sur devis, donc sans créneau.
 */

// ── Bubble Foot ──────────────────────────────────────────────────────────────

/**
 * Tarif du Bubble Foot.
 *
 * Volontairement hors de la table `formules` : celle-ci décrit des forfaits
 * (un prix de base + un supplément par enfant), alors que le Bubble Foot se
 * facture à la personne. Ces trois constantes sont donc la SEULE source du
 * tarif Bubble — rien ne les duplique en base, et le serveur les relit au
 * moment de calculer le total. À déplacer dans une table dédiée le jour où le
 * tarif devra changer sans redéploiement.
 */
/**
 * LE BUBBLE FOOT NE SE RÉSERVE PLUS SUR LE SITE — décidé le 21 septembre 2026.
 *
 * POURQUOI. Le Bubble se joue aux mêmes heures que la location de terrain, sur
 * les mêmes espaces — Brahim l'a confirmé. Or la location vit sur Sport-Finder,
 * qui pilote aussi l'ouverture automatique du complexe. Deux systèmes qui
 * vendent le même terrain aux mêmes heures, sans se voir, finissent par le
 * vendre deux fois : le site ignore les réservations de Sport-Finder, et
 * l'inverse est vrai.
 *
 * On a cherché la place restante, et elle ne suffisait pas. En croisant les
 * heures d'ouverture, les créneaux d'anniversaire et les plages de location, il
 * ne restait au Bubble qu'une poignée d'heures creuses en milieu de semaine —
 * jamais le week-end après 20h, qui est justement le moment où il se vend, et
 * qui est aussi l'heure où plus personne n'est sur place pour sortir les
 * bulles, puisque la porte s'ouvre toute seule.
 *
 * (Le calcul exact de ces heures creuses a changé depuis : la migration 0028 a
 * ramené le vendredi à un seul anniversaire, qui finit à 18h30 au lieu de
 * 20h30. Il n'est plus reproduit ici, parce qu'une arithmétique recopiée dans
 * un commentaire se périme au premier changement d'horaire et se fait croire
 * ensuite. La décision, elle, ne dépend pas du chiffre.)
 *
 * La ligne de partage qui en découle n'est pas un arbitrage, c'est un constat :
 * le SITE vend ce qui se passe quand quelqu'un est là (anniversaires, et le
 * Bounce Park à venir), SPORT-FINDER vend ce qui se passe quand personne n'y
 * est (foot, Bubble).
 *
 * ⚠ CE PARTAGE NE SE SURVEILLE PAS TOUT SEUL, et ce commentaire a affirmé le
 * contraire — « aucun chevauchement possible, donc rien à surveiller » — jusqu'à
 * ce qu'un relevé du 21 septembre 2026 montre l'inverse sur la page publique de
 * Sport-Finder : le samedi 3 octobre, une location courait de 16h à 17h, en
 * plein dans un créneau d'anniversaire que le site vendait au même moment. Les
 * deux plages ne se touchent que si QUELQU'UN les tient alignées, des deux
 * côtés. Côté site, `data/plages-sport-finder.ts` refuse désormais d'ouvrir un
 * créneau dans les heures du tiers ; côté Sport-Finder, rien n'est automatique
 * et le préalable de `MISE-EN-LIGNE.md` est le seul garde-fou.
 *
 * CE FICHIER SUFFIT À REVENIR EN ARRIÈRE. Le tunnel, l'action serveur, la table
 * `horaires_bubble` et le générateur de créneaux restent en place et compilent.
 * Passer cette constante à `true` remet le Bubble en vente sur le site — ce qui
 * n'aura de sens que le jour où l'ouverture automatique sera pilotable depuis
 * le site, objectif que Brahim a posé pour plus tard.
 */
export const BUBBLE_EN_LIGNE = false;

/**
 * La fiche Sport-Finder du Bubble Foot, connue depuis le 21 septembre 2026.
 *
 * `/activity/228`, et non `/booking/field_rental/107/book?sport=1` comme la
 * location de terrain : chez Sport-Finder, le Bubble est une ACTIVITÉ et pas
 * une location, donc une autre forme d'adresse et un autre identifiant. C'est
 * exactement pourquoi on ne l'a jamais devinée.
 *
 * ELLE N'EST PAS ENCORE BRANCHÉE, ET C'EST DÉLIBÉRÉ. La fiche accepte
 * aujourd'hui des DEMANDES, pas des paiements : le client envoie une demande,
 * quelqu'un y répond. Brahim ouvrira la réservation directe quand le site sera
 * prêt, et c'est ce jour-là qu'on basculera le lien — pas avant, pour ne pas
 * avoir à le changer deux fois. Voir `MISE-EN-LIGNE.md`.
 */
export const SPORTFINDER_BUBBLE_FICHE =
  "https://www.sport-finder.com/fr/center/offside-foot-indoor/activity/228";

/**
 * Où l'on envoie RÉELLEMENT le visiteur pour réserver un Bubble Foot.
 *
 * La page du complexe, et non la fiche du produit : voir
 * `SPORTFINDER_BUBBLE_FICHE`. Elle coûte un clic de plus, mais elle reste juste
 * quel que soit l'état de la fiche 228 — aujourd'hui sur demande, demain en
 * réservation directe. Un lien qui ne ment jamais vaut mieux qu'un lien plus
 * court qu'il faudrait surveiller.
 *
 * CE QUE LE CLIENT PEUT FAIRE AUJOURD'HUI. Le Bubble n'est plus vendu sur le
 * site (`BUBBLE_EN_LIGNE = false`) ; sur Sport-Finder, il se demande sans se
 * payer. La carte du tunnel reste donc honnête : elle annonce l'activité et son
 * tarif, et le bouton mène là où l'on peut la demander. Ce n'est pas le cas
 * décrit dans `data/bounce-park.ts` — « une carte qui promet une réponse
 * qu'elle n'a pas » —, puisqu'il y a bien une réponse au bout.
 */
export const SPORTFINDER_BUBBLE_URL = "https://www.sport-finder.com/fr/center/offside-foot-indoor";

export const BUBBLE_PRIX_PAR_PERSONNE = 23; // €
export const BUBBLE_MIN_PERSONNES = 6;
/**
 * DIX-HUIT, COMME LA FUN ZONE — pas vingt.
 *
 * Le Bubble se joue dans les Fun zones, dont la capacité est passée de 20 à 18
 * le 17 septembre 2026 (migration 0020, sur réponse de Brahim). Cette constante
 * était restée à 20. Le site ne s'en apercevait pas : le tunnel plafonne à
 * `Math.min(BUBBLE_MAX_PERSONNES, creneau.capacite)` et le serveur relit la
 * capacité réelle, donc 18 l'emportait partout.
 *
 * Le chiffre comptait quand même, parce qu'il quitte le site : c'est celui
 * qu'on reporte sur la fiche Sport-Finder, où AUCUN plafonnement ne viendra le
 * corriger. Vingt places vendues sur un terrain qui en tient dix-huit, et deux
 * personnes restent dehors.
 */
export const BUBBLE_MAX_PERSONNES = 18;
export const BUBBLE_DUREE_MINUTES = 60;

/*
 * Pas de `bubbleTotal()` ici. Une fonction de ce nom existait, inutilisée :
 * le montant facturé est recalculé par le serveur au moment d'écrire la
 * réservation. Un second calcul côté navigateur finirait par diverger du
 * premier, et c'est le genre d'écart qu'on découvre sur une facture.
 */

// ── Team Building ────────────────────────────────────────────────────────────

/** Participants acceptés dans une demande de devis. */
export const TEAM_BUILDING_MIN_PARTICIPANTS = 6;
export const TEAM_BUILDING_MAX_PARTICIPANTS = 60;

/*
  LES JOURS SONT CONNUS, LES HEURES NE LE SONT TOUJOURS PAS.

  Brahim a répondu le 17 septembre 2026 : lundi, mardi et jeudi matin ET
  après-midi ; vendredi matin seulement. Pas de team building le mercredi, ni
  le week-end — ces journées sont prises par les anniversaires.

  Il n'a en revanche pas donné les HEURES des demi-journées. Celles ci-dessous
  restent donc provisoires, et c'est écrit ici plutôt que supposé résolu : un
  devis part avec elles.
*/
export const TEAM_BUILDING_JOURS = [1, 2, 4, 5] as const; // ISO : lun, mar, jeu, ven

/** Le vendredi, seule la matinée est proposée. */
export const TEAM_BUILDING_JOURS_APRES_MIDI = [1, 2, 4] as const;

/*
  LES HEURES SONT `null` TANT QU'ON NE LES CONNAÎT PAS, ET CE N'EST PAS UN OUBLI.

  Elles valaient « 09:00 – 13:00 » et « 14:00 – 18:00 » — des horaires que
  personne n'a confirmés. Le client les voyait en choisissant sa demi-journée,
  puis dans son récapitulatif : une précision inventée, sur l'écran même où il
  demande un devis.

  `null` fait disparaître l'heure de l'affichage sans rien casser : il reste
  « Matin » et « Après-midi », qui sont vrais. Le jour où Brahim répond, il
  suffit de remplir ces deux constantes — les heures réapparaissent partout,
  sans toucher à une ligne d'interface.

  Écrire une heure fausse coûte plus qu'en écrire aucune : une entreprise qui
  accepte un devis s'engage sur l'horaire qu'elle y a lu.
*/
type Plage = { debut: string; fin: string } | null;

export const TEAM_BUILDING_MATIN: Plage = null;
export const TEAM_BUILDING_APRES_MIDI: Plage = null;

export const TEAM_BUILDING_INCLUS = [
  "Terrain privatisé pour votre groupe",
  "Bubble Foot et matériel compris",
  "Organisation et arbitrage du tournoi",
  "Chasubles et ballons",
  "Accès aux vestiaires",
];
