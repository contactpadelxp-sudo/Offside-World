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
 * Il n'est pas non plus un lien. Il n'y a rien au bout : pas de page, pas de
 * créneau, pas de tarif. Une carte cliquable qui ne mène nulle part est pire
 * qu'une carte inerte, parce qu'elle promet une réponse qu'elle n'a pas. Le
 * jour où le parc ouvre, cette carte devient une activité à part entière — et
 * c'est à ce moment-là qu'elle rejoindra `useActivites()`.
 *
 * CE QU'ON PROMET ICI DOIT RESTER VRAI. Aucune date n'est annoncée, aucun prix,
 * aucune capacité : rien de tout cela n'est arrêté. Annoncer « ouverture en
 * mars » sans en être sûr, c'est exactement le genre d'allégation que le droit
 * de la consommation traite en pratique trompeuse (art. VI.97 du Code de droit
 * économique), et c'est le même piège que les « 2000+ fêtes organisées » de la
 * page d'accueil.
 */

export const BOUNCE_PARK = {
  titre: "Bounce Park",
  /** Ce qu'on affiche à la place d'un prix. */
  tag: "Bientôt",
  /** Une phrase, au présent, sur ce qui est certain. */
  description: "Un parc gonflable géant en préparation dans le complexe.",
} as const;

/**
 * Les horaires d'ouverture, donnés par Brahim le 21 septembre 2026.
 *
 * ILS NE S'AFFICHENT NULLE PART, ET C'EST VOLONTAIRE. Le parc n'a ni date
 * d'ouverture, ni tarif, ni âge minimum : annoncer des heures pour une
 * activité dont on ignore quand elle existe reviendrait à promettre une
 * ouverture. Ils sont écrits ici parce qu'une réponse de l'exploitant ne doit
 * pas vivre dans une boîte aux lettres — c'est ainsi qu'on finit par la
 * redemander, ou pire, par l'inventer.
 *
 * ILS SE CHEVAUCHENT AVEC LES ANNIVERSAIRES, ET CE N'EST PAS UN CONFLIT. Le
 * parc est un espace distinct des Fun zones : mercredi 12h–19h recouvre les
 * deux créneaux d'anniversaire de l'après-midi, et les deux peuvent tourner en
 * même temps. Le jour où le parc se réserve, c'est cette distinction qu'il
 * faudra tenir — un créneau de Bounce Park ne doit PAS occuper une Fun zone.
 *
 * Reste inconnu : le prix, l'âge minimum, la date d'ouverture, la capacité.
 */
export const BOUNCE_PARK_HORAIRES = {
  /** ISO : 3 = mercredi, 5 = vendredi, 6 = samedi, 7 = dimanche. */
  3: { debut: "12:00", fin: "19:00" },
  5: { debut: "15:00", fin: "20:00" },
  6: { debut: "10:00", fin: "20:00" },
  7: { debut: "10:00", fin: "19:00" },
} as const;
