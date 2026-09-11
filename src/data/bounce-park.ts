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
