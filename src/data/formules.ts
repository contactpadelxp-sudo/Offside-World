export interface Option {
  id: string;
  label: string;
  price: number; // €
  description?: string;
}

export interface Formule {
  id: string;
  name: string;
  /** Accroche courte : « Je joue avec mes amis » */
  tagline: string;
  description: string;
  /** Prix forfaitaire, enfants inclus compris */
  basePrice: number; // €
  /** Nombre d'enfants couverts par le forfait */
  includedChildren: number;
  /** Supplément par enfant au-delà du forfait */
  extraChildPrice: number; // €
  maxChildren: number;
  durationMinutes: number;
  includes: string[];
  image: string;
}

/** Capacité maximale d'un anniversaire, toutes formules confondues. */
export const MAX_CHILDREN = 20;

/**
 * Calcule le prix d'un anniversaire : forfait jusqu'à `includedChildren`,
 * puis supplément par enfant supplémentaire.
 */
export function formulePrice(formule: Formule, nbChildren: number): number {
  const extra = Math.max(0, nbChildren - formule.includedChildren);
  return formule.basePrice + extra * formule.extraChildPrice;
}

export const formules: Formule[] = [
  {
    id: "kick-off",
    name: "Kick-Off",
    tagline: "Je joue avec mes amis",
    description:
      "La formule idéale pour profiter d'un anniversaire 100 % foot en toute liberté.",
    basePrice: 180,
    includedChildren: 10,
    extraChildPrice: 10,
    maxChildren: MAX_CHILDREN,
    durationMinutes: 120,
    includes: [
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
    name: "Bubble",
    tagline: "Je veux l'expérience la plus fun",
    description:
      "L'anniversaire Offside dans sa version la plus fun ! Une expérience qui mélange Football Indoor et Bubble Foot pour un maximum de rires et de souvenirs.",
    basePrice: 290,
    includedChildren: 10,
    extraChildPrice: 15,
    maxChildren: MAX_CHILDREN,
    durationMinutes: 120,
    includes: [
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

/** Mention commune aux deux formules. */
export const GATEAU_NOTE = "Le gâteau est apporté par les parents.";

/**
 * Options payantes en supplément.
 * La décoration, les boissons et la vaisselle sont désormais comprises dans
 * les deux formules : elles ne sont plus vendues à part.
 */
export const options: Option[] = [
  { id: "photo", label: "Pack photo souvenir", price: 20, description: "Photos de groupe + individuelles imprimées" },
  { id: "pinata", label: "Piñata", price: 30, description: "Piñata remplie de bonbons" },
];
