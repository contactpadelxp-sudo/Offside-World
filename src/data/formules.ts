export interface Option {
  id: string;
  label: string;
  price: number; // €
  description?: string;
}

export interface Formule {
  id: string;
  name: string;
  description: string;
  pricePerChild: number; // €/enfant
  minChildren: number;
  maxChildren: number;
  durationMinutes: number;
  includes: string[];
  image: string; // placeholder
}

export const formules: Formule[] = [
  {
    id: "classique",
    name: "Classique",
    description: "L'anniversaire foot indoor par excellence : matchs encadrés, vestiaires privatisés et espace goûter dédié.",
    pricePerChild: 18,
    minChildren: 8,
    maxChildren: 20,
    durationMinutes: 120,
    includes: [
      "2h de terrain privatisé",
      "Encadrement par un animateur",
      "Vestiaires & chasubles",
      "Espace goûter privatisé",
      "Invitation digitale personnalisée",
    ],
    image: "/images/placeholder-classique.jpg",
  },
  {
    id: "bubble-foot",
    name: "Bubble Foot",
    description: "Le Bubble Foot, c'est LE truc en plus ! Les enfants jouent au foot dans des bulles géantes : fous rires garantis.",
    pricePerChild: 25,
    minChildren: 8,
    maxChildren: 16,
    durationMinutes: 150,
    includes: [
      "2h30 (dont 45 min Bubble Foot)",
      "Encadrement par un animateur",
      "Équipement Bubble Foot fourni",
      "Vestiaires & chasubles",
      "Espace goûter privatisé",
      "Invitation digitale personnalisée",
    ],
    image: "/images/placeholder-bubble.jpg",
  },
  {
    id: "premium",
    name: "Premium",
    description: "La formule VIP : tout inclus avec Bubble Foot, décoration, gâteau et boissons pour un anniversaire inoubliable.",
    pricePerChild: 35,
    minChildren: 8,
    maxChildren: 20,
    durationMinutes: 180,
    includes: [
      "3h tout inclus",
      "Bubble Foot (45 min)",
      "Encadrement par 2 animateurs",
      "Décoration thématique",
      "Gâteau d'anniversaire",
      "Boissons & goûter",
      "Vestiaires & chasubles",
      "Photo de groupe offerte",
    ],
    image: "/images/placeholder-premium.jpg",
  },
];

export const options: Option[] = [
  { id: "deco", label: "Pack décoration", price: 40, description: "Ballons, guirlandes, nappe thématique foot" },
  { id: "gateau", label: "Gâteau d'anniversaire", price: 35, description: "Gâteau pour 12 parts (saveur au choix)" },
  { id: "boissons", label: "Pack boissons", price: 25, description: "Jus de fruits, eau, sirop pour tous les enfants" },
  { id: "photo", label: "Pack photo souvenir", price: 20, description: "Photos de groupe + individuelles imprimées" },
  { id: "pinata", label: "Piñata", price: 30, description: "Piñata remplie de bonbons" },
];
