import type { FormuleVue } from "@/lib/vues";

/**
 * Anniversaires : textes fixes et repli d'affichage.
 *
 * LA SOURCE DES TARIFS EST LA TABLE `formules`, pas ce fichier. Le prix
 * facturé est recalculé par le serveur à partir de la base, à chaque
 * réservation (voir src/app/reservation/actions.ts).
 *
 * `FORMULES_REPLI` ne sert qu'à un cas : la page d'accueil, prérendue, quand la
 * base n'a pas répondu au moment du rendu. Mieux vaut afficher un tarif
 * légèrement daté que masquer la section — mais rien de ce qui est ici n'atteint
 * jamais le montant réellement demandé au client. En cas de doute, c'est la
 * base qui a raison.
 */

/** Mention commune aux deux formules. */
export const GATEAU_NOTE = "Le gâteau est apporté par les parents.";

/** Illustration de chaque option (chemins exacts dans public/images/). */
export const OPTION_IMAGES: Record<string, string> = {
  photo: "/images/photos.jpeg",
  pinata: "/images/pinata.webp",
};

export const FORMULES_REPLI: FormuleVue[] = [
  {
    id: "kick-off",
    nom: "Kick-Off",
    accroche: "Je joue avec mes amis",
    description:
      "La formule idéale pour profiter d'un anniversaire 100 % foot en toute liberté.",
    prixBase: 180,
    enfantsInclus: 10,
    prixEnfantSup: 10,
    enfantsMax: 20,
    dureeMinutes: 120,
    inclus: [
      "2 heures de Football Indoor",
      "Terrain réservé pour le groupe",
      "Ballons et chasubles à disposition",
      "Accès aux vestiaires",
      "Espace réservé pour le gâteau",
      "Vidéo souvenir de l'anniversaire",
      "Décoration de l'espace anniversaire",
      "Assiettes, gobelets et serviettes",
      "Eau, menthe et grenadine à volonté",
    ],
    image: "/images/anniv.jpg",
  },
  {
    id: "bubble",
    nom: "Bubble",
    accroche: "Je veux l'expérience la plus fun",
    description:
      "L'anniversaire Offside dans sa version la plus fun ! Une expérience qui mélange Football Indoor et Bubble Foot pour un maximum de rires et de souvenirs.",
    prixBase: 290,
    enfantsInclus: 10,
    prixEnfantSup: 15,
    enfantsMax: 20,
    dureeMinutes: 120,
    inclus: [
      "1 heure de Bubble Foot",
      "Animateur Bubble dédié",
      "1 heure de Football Indoor",
      "Bulles et matériel compris",
      "Terrain réservé pour le groupe",
      "Vidéo souvenir de l'anniversaire",
      "Décoration de l'espace anniversaire",
      "Assiettes, gobelets et serviettes",
      "Eau, menthe et grenadine à volonté",
      "Espace réservé pour le gâteau",
    ],
    image: "/images/anniv1.jpg",
  },
];
