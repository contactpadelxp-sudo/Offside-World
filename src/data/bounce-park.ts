/**
 * Le Bounce Park — annoncé, pas encore ouvert.
 *
 * POURQUOI IL N'EST PAS UNE QUATRIÈME ACTIVITÉ. Il serait tentant de l'ajouter
 * à `useActivites()`, à côté des trois autres : une carte de plus dans le même
 * tableau, et tout le monde s'en sert. Ce serait une erreur, pour une raison
 * qui n'a rien de théorique — `useActivites()` alimente AUSSI les cartes de la
 * page Réserver. Le Bounce Park y apparaîtrait donc comme une activité
 * réservable, avec un bouton « Choisir » qui ouvrirait un tunnel vide.
 *
 * DEPUIS LE 25 SEPTEMBRE 2026, LA CARTE MÈNE À UNE PAGE : `/bounce-park`, qui
 * explique le parc et annonce son ouverture. Pas encore à un tunnel — il n'y a
 * ni créneau ni tarif. Le jour où le parc se réserve, il deviendra une
 * activité à part entière, et c'est à ce moment-là qu'il rejoindra
 * `useActivites()`.
 *
 * CE QU'ON PROMET ICI DOIT RESTER VRAI. La date d'ouverture est connue
 * (Brahim, 24 septembre 2026) ; le prix, l'âge minimum et la capacité ne le
 * sont pas, et ne s'écrivent donc nulle part. Annoncer un chiffre sans en être
 * sûr, c'est exactement le genre d'allégation que le droit de la consommation
 * traite en pratique trompeuse (art. VI.97 du Code de droit économique), et
 * c'est le même piège que les « 2000+ fêtes organisées » de la page d'accueil.
 */

export const BOUNCE_PARK = {
  titre: "Bounce Park",
  /** Ce qu'on affiche à la place d'un prix. */
  tag: "Bientôt",
  /** Une phrase, au présent, sur ce qui est certain. */
  description: "Un parc gonflable géant en préparation dans le complexe.",
  /** Communiquée par Brahim le 24 septembre 2026. */
  ouverture: "1er décembre 2026",
} as const;

/**
 * Les horaires d'ouverture, donnés par Brahim le 21 septembre 2026.
 *
 * Ils sont restés cachés tant que la date d'ouverture était inconnue :
 * annoncer des heures pour une activité dont on ignorait quand elle existerait
 * revenait à promettre une ouverture. Depuis que la date est connue, la page
 * `/bounce-park` les affiche, présentés comme « prévus ».
 *
 * ILS SE CHEVAUCHENT AVEC LES ANNIVERSAIRES, ET CE N'EST PAS UN CONFLIT. Le
 * parc est un espace distinct des Fun zones : mercredi 12h–19h recouvre les
 * deux créneaux d'anniversaire de l'après-midi, et les deux peuvent tourner en
 * même temps. Le jour où le parc se réserve, c'est cette distinction qu'il
 * faudra tenir — un créneau de Bounce Park ne doit PAS occuper une Fun zone.
 *
 * Reste inconnu : le prix, l'âge minimum, la capacité.
 */
export const BOUNCE_PARK_HORAIRES = {
  /** ISO : 3 = mercredi, 5 = vendredi, 6 = samedi, 7 = dimanche. */
  3: { debut: "12:00", fin: "19:00" },
  5: { debut: "15:00", fin: "20:00" },
  6: { debut: "10:00", fin: "20:00" },
  7: { debut: "10:00", fin: "19:00" },
} as const;
